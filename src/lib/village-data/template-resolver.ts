/**
 * Template Resolver — resolves which template a desa uses and which
 * components are visible (accounting for per-desa visibility overrides).
 *
 * Pre-migration fallback: when DesaDetailTemplateAssignment / VillageDetailComponent
 * tables don't exist yet, falls back to DETAIL_FIELD_STANDARDS (hardcoded constants).
 * After migration + seed-templates.mjs, reads from DB.
 */

import { db } from "@/lib/db";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { DEFAULT_TEMPLATE_KEY, DEFAULT_TEMPLATE_NAME } from "@/lib/village-data/template-constants";
import { DEFAULT_COMPONENT_CATALOG_MANIFEST } from "@/lib/village-data/component-catalog-manifest";
import { mergeResolvedFieldsWithCatalogManifest } from "@/lib/village-data/runtime-template-manifest";

// ─── Module-level cache + deduplication (60s TTL) ────────────────────────────
// Do not keep a cross-request template cache here. Template mutations happen in
// separate route bundles/processes, so a module-level TTL cache can show stale
// field counts after switching templates. In-flight dedupe is still safe.
const _inflight = new Map<string, Promise<ResolvedTemplate>>();

function fromTemplateCache(key: string): ResolvedTemplate | null {
  void key;
  return null;
}
function toTemplateCache(key: string, data: ResolvedTemplate) {
  void key;
  void data;
}
/** Call after toggling component visibility so the cache reflects the change immediately. */
export function invalidateTemplateCache(desaId: string) {
  _inflight.delete(desaId);
}

export function invalidateAllTemplateCaches() {
  _inflight.clear();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedComponent {
  componentId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  rendererType?: string;
  previewVariant?: string;
  detailSlot?: string;
  navLabel?: string | null;
  anchorId?: string | null;
  publicGroupKey?: string | null;
  publicTabKey?: string | null;
  highlightFieldKeys?: string[];
  renderConfig?: Record<string, unknown>;
  fields: ResolvedField[];
}

export interface ResolvedField {
  componentId?: string;
  fieldStandardId?: string;
  fieldKey: string;
  label: string;
  valueType: string;
  validationRules?: unknown;
  sourcePolicy?: unknown;
  isRequired?: boolean;
  isPublicVisible?: boolean;
  isPublishableNow: boolean;
  componentKey: string;
  componentLabel: string;
}

export interface ResolvedTemplate {
  templateId: string;
  templateKey: string;
  templateName: string;
  /** Components visible for this desa (accounting for visibility overrides) */
  visibleComponents: ResolvedComponent[];
  /** Components that exist in template but are hidden for this desa */
  hiddenComponents: ResolvedComponent[];
}

type SupabaseAssignmentRow = {
  templateId: string;
  isActive: boolean;
};

type SupabaseTemplateRow = {
  id: string;
  key: string;
  name: string;
};

type SupabaseComponentRow = {
  id: string;
  componentKey: string;
  label: string;
  isDefaultVisible: boolean;
  displayOrder: number;
};

type SupabaseCatalogComponentRow = {
  componentKey: string;
  rendererType: string | null;
  previewVariant: string | null;
  detailSlot: string | null;
  navLabel: string | null;
  anchorId: string | null;
  publicGroupKey: string | null;
  publicTabKey: string | null;
  highlightFieldKeys: unknown;
  renderConfigJson: unknown;
};

type SupabaseFieldRow = {
  id: string;
  componentId: string;
  fieldKey: string;
  label: string;
  valueType: string;
  validationRules: unknown;
  sourcePolicyJson: unknown;
  isRequired: boolean;
  isPublicVisible: boolean;
  isPublishableNow: boolean;
  displayOrder: number;
};

type SupabaseVisibilityRow = {
  componentId: string;
  isVisible: boolean;
};

type SupabasePublishedDataDesaRow = {
  fieldKey: string;
  valueJson: unknown;
  valueText: string | null;
};

const templateTreeSelect = {
  id: true,
  key: true,
  name: true,
  components: {
    where: { status: "ACTIVE" },
    orderBy: { displayOrder: "asc" as const },
    select: {
      id: true,
      componentKey: true,
      label: true,
      isDefaultVisible: true,
      displayOrder: true,
      catalogComponent: {
        select: {
          rendererType: true,
          previewVariant: true,
          detailSlot: true,
          navLabel: true,
          anchorId: true,
          publicGroupKey: true,
          publicTabKey: true,
          highlightFieldKeys: true,
          renderConfigJson: true,
        },
      },
      fieldStandards: {
        where: { status: "ACTIVE" },
        orderBy: { displayOrder: "asc" as const },
        select: {
          id: true,
          fieldKey: true,
          label: true,
          valueType: true,
          validationRules: true,
          sourcePolicyJson: true,
          isRequired: true,
          isPublicVisible: true,
          isPublishableNow: true,
        },
      },
    },
  },
};

// ─── Fallback (pre-migration) ─────────────────────────────────────────────────

function buildFallbackTemplate(): ResolvedTemplate {
  const visibleComponents: ResolvedComponent[] = DEFAULT_COMPONENT_CATALOG_MANIFEST.map(
    (component) => ({
      componentId: `fallback-${component.componentKey}`,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      fields: component.fields.map((field) => ({
        componentId: `fallback-${component.componentKey}`,
        fieldStandardId: `fallback-${component.componentKey}:${field.fieldKey}`,
        fieldKey: field.fieldKey,
        label: field.label,
        valueType: field.valueType,
        validationRules: null,
        sourcePolicy: null,
        isRequired: false,
        isPublicVisible: true,
        isPublishableNow: field.isPublishableNow,
        componentKey: component.componentKey,
        componentLabel: component.label,
      })),
    }),
  );

  return {
    templateId:        "fallback",
    templateKey:       DEFAULT_TEMPLATE_KEY,
    templateName:      DEFAULT_TEMPLATE_NAME,
    visibleComponents,
    hiddenComponents:  [],
  };
}

function toStringArray(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const values = input.filter((item): item is string => typeof item === "string");
  return values.length > 0 ? values : undefined;
}

function toRecord(input: unknown): Record<string, unknown> | undefined {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : undefined;
}

async function resolveDesaTemplateViaSupabase(desaId: string): Promise<ResolvedTemplate | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data: assignment, error: assignmentError } = await client
    .from("desa_detail_template_assignments")
    .select("templateId,isActive")
    .eq("desaId", desaId)
    .maybeSingle<SupabaseAssignmentRow>();
  if (assignmentError) throw assignmentError;

  let template: SupabaseTemplateRow | null = null;
  if (assignment?.isActive !== false && assignment?.templateId) {
    const { data, error } = await client
      .from("village_detail_templates")
      .select("id,key,name")
      .eq("id", assignment.templateId)
      .maybeSingle<SupabaseTemplateRow>();
    if (error) throw error;
    template = data;
  } else {
    const { data, error } = await client
      .from("village_detail_templates")
      .select("id,key,name")
      .eq("key", DEFAULT_TEMPLATE_KEY)
      .maybeSingle<SupabaseTemplateRow>();
    if (error) throw error;
    template = data;
  }

  if (!template) return null;
  const shouldOverlayCatalog = template.key === DEFAULT_TEMPLATE_KEY;

  const [{ data: components, error: componentsError }, { data: fields, error: fieldsError }, { data: overrides, error: overridesError }] =
    await Promise.all([
      client
        .from("village_detail_components")
        .select("id,componentKey,label,isDefaultVisible,displayOrder")
        .eq("templateId", template.id)
        .eq("status", "ACTIVE")
        .order("displayOrder", { ascending: true })
        .returns<SupabaseComponentRow[]>(),
      client
        .from("detail_field_standards")
        .select("id,componentId,fieldKey,label,valueType,validationRules,sourcePolicyJson,isRequired,isPublicVisible,isPublishableNow,displayOrder")
        .eq("templateId", template.id)
        .eq("status", "ACTIVE")
        .order("displayOrder", { ascending: true })
        .returns<SupabaseFieldRow[]>(),
      client
        .from("desa_detail_component_visibility")
        .select("componentId,isVisible")
        .eq("desaId", desaId)
        .returns<SupabaseVisibilityRow[]>(),
    ]);

  if (componentsError) throw componentsError;
  if (fieldsError) throw fieldsError;
  if (overridesError) throw overridesError;

  const componentKeys = [...new Set((components ?? []).map((component) => component.componentKey))];
  const { data: catalogRows, error: catalogError } = await client
    .from("village_component_catalog")
    .select("componentKey,rendererType,previewVariant,detailSlot,navLabel,anchorId,publicGroupKey,publicTabKey,highlightFieldKeys,renderConfigJson")
    .in("componentKey", componentKeys.length > 0 ? componentKeys : ["__empty__"])
    .eq("status", "ACTIVE")
    .returns<SupabaseCatalogComponentRow[]>();
  if (catalogError) throw catalogError;

  const catalogByComponentKey = new Map(
    (catalogRows ?? []).map((row) => [row.componentKey, row]),
  );

  const fieldMap = new Map<string, ResolvedField[]>();
  for (const field of (fields ?? []).sort((a, b) => a.displayOrder - b.displayOrder)) {
    const list = fieldMap.get(field.componentId) ?? [];
    list.push({
      componentId: field.componentId,
      fieldStandardId: field.id,
      fieldKey: field.fieldKey,
      label: field.label,
      valueType: field.valueType,
      validationRules: field.validationRules,
      sourcePolicy: field.sourcePolicyJson,
      isRequired: field.isRequired,
      isPublicVisible: field.isPublicVisible,
      isPublishableNow: field.isPublishableNow,
      componentKey: "",
      componentLabel: "",
    });
    fieldMap.set(field.componentId, list);
  }

  const overrideMap = new Map((overrides ?? []).map((row) => [row.componentId, row.isVisible]));
  const visibleComponents: ResolvedComponent[] = [];
  const hiddenComponents: ResolvedTemplate["hiddenComponents"] = [];

  for (const component of (components ?? []).sort((a, b) => a.displayOrder - b.displayOrder)) {
    const catalog = catalogByComponentKey.get(component.componentKey) ?? null;
    const resolvedFields = (fieldMap.get(component.id) ?? []).map((field) => ({
      ...field,
      componentKey: component.componentKey,
      componentLabel: component.label,
    }));
    const mergedFields = shouldOverlayCatalog
      ? mergeResolvedFieldsWithCatalogManifest({
          componentId: component.id,
          componentKey: component.componentKey,
          componentLabel: component.label,
          fields: resolvedFields,
        })
      : resolvedFields;
    const isVisible = overrideMap.has(component.id)
      ? overrideMap.get(component.id)!
      : component.isDefaultVisible;

    if (isVisible) {
      visibleComponents.push({
        componentId: component.id,
        componentKey: component.componentKey,
        label: component.label,
        displayOrder: component.displayOrder,
        rendererType: catalog?.rendererType ?? undefined,
        previewVariant: catalog?.previewVariant ?? undefined,
        detailSlot: catalog?.detailSlot ?? undefined,
        navLabel: catalog?.navLabel ?? undefined,
        anchorId: catalog?.anchorId ?? undefined,
        publicGroupKey: catalog?.publicGroupKey ?? undefined,
        publicTabKey: catalog?.publicTabKey ?? undefined,
        highlightFieldKeys: toStringArray(catalog?.highlightFieldKeys),
        renderConfig: toRecord(catalog?.renderConfigJson),
        fields: mergedFields,
      });
    } else {
      hiddenComponents.push({
        componentId: component.id,
        componentKey: component.componentKey,
        label: component.label,
        displayOrder: component.displayOrder,
        rendererType: catalog?.rendererType ?? undefined,
        previewVariant: catalog?.previewVariant ?? undefined,
        detailSlot: catalog?.detailSlot ?? undefined,
        navLabel: catalog?.navLabel ?? undefined,
        anchorId: catalog?.anchorId ?? undefined,
        publicGroupKey: catalog?.publicGroupKey ?? undefined,
        publicTabKey: catalog?.publicTabKey ?? undefined,
        highlightFieldKeys: toStringArray(catalog?.highlightFieldKeys),
        renderConfig: toRecord(catalog?.renderConfigJson),
        fields: mergedFields,
      });
    }
  }

  return {
    templateId: template.id,
    templateKey: template.key,
    templateName: template.name,
    visibleComponents,
    hiddenComponents,
  };
}

async function getPublishedDataDesaViaSupabase(
  desaId: string,
  resolved: ResolvedTemplate,
): Promise<Record<string, unknown>> {
  const client = getSupabaseAdminClient();
  if (!client) return {};

  const visibleComponentIds = resolved.visibleComponents
    .map((component) => component.componentId)
    .filter((componentId) => !componentId.startsWith("fallback-"));

  if (visibleComponentIds.length === 0) return {};

  const { data, error } = await client
    .from("data_desa")
    .select("fieldKey,valueJson,valueText")
    .eq("desaId", desaId)
    .eq("status", "PUBLISHED")
    .eq("isActive", true)
    .in("componentId", visibleComponentIds)
    .returns<SupabasePublishedDataDesaRow[]>();

  if (error) throw error;

  const result: Record<string, unknown> = {};
  for (const row of data ?? []) {
    result[row.fieldKey] = row.valueJson ?? row.valueText;
  }

  return result;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolve the full template for a desa, including component visibility overrides.
 * Falls back to DETAIL_FIELD_STANDARDS constants if DB tables don't exist yet.
 */
export function resolveDesaTemplate(desaId: string): Promise<ResolvedTemplate> {
  const cached = fromTemplateCache(desaId);
  if (cached) return Promise.resolve(cached);

  // Deduplicate: if a request is already in-flight for this desaId, reuse it.
  const inflight = _inflight.get(desaId);
  if (inflight) return inflight;

  const promise = _resolveDesaTemplateFromDB(desaId).then(result => {
    if (result.templateId !== "fallback") {
      toTemplateCache(desaId, result);
    }
    _inflight.delete(desaId);
    return result;
  }).catch(e => {
    _inflight.delete(desaId);
    throw e;
  });
  _inflight.set(desaId, promise);
  return promise;
}

async function _resolveDesaTemplateFromDB(desaId: string): Promise<ResolvedTemplate> {
  if (!db) {
    return (await resolveDesaTemplateViaSupabase(desaId)) ?? buildFallbackTemplate();
  }

  try {
    // Keep these reads sequential so local runtimes with a very small Prisma pool
    // do not time out and silently fall back to hardcoded template ids.
    const assignment = await db.desaDetailTemplateAssignment.findUnique({
      where: { desaId },
      select: {
        isActive: true,
        templateId: true,
        template: { select: templateTreeSelect },
      },
    });

    const template =
      assignment?.isActive !== false && assignment?.template
        ? assignment.template
        : await db.villageDetailTemplate.findUnique({
            where: { key: DEFAULT_TEMPLATE_KEY },
            select: templateTreeSelect,
          });
    if (!template) return buildFallbackTemplate();
    const shouldOverlayCatalog = template.key === DEFAULT_TEMPLATE_KEY;

    const overrides = await db.desaDetailComponentVisibility.findMany({
      where: { desaId },
      select: { componentId: true, isVisible: true },
    });

    const overrideMap = new Map<string, boolean>(
      overrides.map(o => [o.componentId, o.isVisible])
    );

    // 3. Separate visible and hidden components
    const visibleComponents: ResolvedComponent[] = [];
    const hiddenComponents: ResolvedTemplate["hiddenComponents"] = [];

    for (const comp of template.components) {
      const isVisible = overrideMap.has(comp.id)
        ? overrideMap.get(comp.id)!
        : comp.isDefaultVisible;

      const resolvedFields: ResolvedField[] = comp.fieldStandards.map(
        (f: {
          id: string;
          fieldKey: string;
          label: string;
          valueType: string;
          validationRules: unknown;
          sourcePolicyJson: unknown;
          isRequired: boolean;
          isPublicVisible: boolean;
          isPublishableNow: boolean;
        }) => ({
          componentId:     comp.id,
          fieldStandardId:  f.id,
          fieldKey:        f.fieldKey,
          label:           f.label,
          valueType:       f.valueType,
          validationRules: f.validationRules,
          sourcePolicy:    f.sourcePolicyJson,
          isRequired:      f.isRequired,
          isPublicVisible: f.isPublicVisible,
          isPublishableNow: f.isPublishableNow,
          componentKey:    comp.componentKey,
          componentLabel:  comp.label,
        })
      );
      const mergedFields = shouldOverlayCatalog
        ? mergeResolvedFieldsWithCatalogManifest({
            componentId: comp.id,
            componentKey: comp.componentKey,
            componentLabel: comp.label,
            fields: resolvedFields,
          })
        : resolvedFields;

      if (isVisible) {
        visibleComponents.push({
          componentId:  comp.id,
          componentKey: comp.componentKey,
          label:        comp.label,
          displayOrder: comp.displayOrder,
          rendererType: comp.catalogComponent?.rendererType,
          previewVariant: comp.catalogComponent?.previewVariant,
          detailSlot: comp.catalogComponent?.detailSlot,
          navLabel: comp.catalogComponent?.navLabel,
          anchorId: comp.catalogComponent?.anchorId,
          publicGroupKey: comp.catalogComponent?.publicGroupKey,
          publicTabKey: comp.catalogComponent?.publicTabKey,
          highlightFieldKeys: toStringArray(comp.catalogComponent?.highlightFieldKeys),
          renderConfig: toRecord(comp.catalogComponent?.renderConfigJson),
          fields:       mergedFields,
        });
      } else {
        hiddenComponents.push({
          componentId:  comp.id,
          componentKey: comp.componentKey,
          label:        comp.label,
          displayOrder: comp.displayOrder,
          rendererType: comp.catalogComponent?.rendererType,
          previewVariant: comp.catalogComponent?.previewVariant,
          detailSlot: comp.catalogComponent?.detailSlot,
          navLabel: comp.catalogComponent?.navLabel,
          anchorId: comp.catalogComponent?.anchorId,
          publicGroupKey: comp.catalogComponent?.publicGroupKey,
          publicTabKey: comp.catalogComponent?.publicTabKey,
          highlightFieldKeys: toStringArray(comp.catalogComponent?.highlightFieldKeys),
          renderConfig: toRecord(comp.catalogComponent?.renderConfigJson),
          fields:       mergedFields,
        });
      }
    }

    return {
      templateId:       template.id,
      templateKey:      template.key,
      templateName:     template.name,
      visibleComponents,
      hiddenComponents,
    };
  } catch (e) {
    if (isDatabaseConnectivityError(e)) {
      const supabaseResolved = await resolveDesaTemplateViaSupabase(desaId).catch(() => null);
      if (supabaseResolved) return supabaseResolved;
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[template-resolver] error for", desaId, e);
    }
    return buildFallbackTemplate();
  }
}

/**
 * Get all publishable fields for a desa (visible components only).
 * Used by intake pipeline to determine field coverage.
 */
export async function resolvePublishableFields(desaId: string): Promise<ResolvedField[]> {
  const resolved = await resolveDesaTemplate(desaId);
  return resolved.visibleComponents
    .flatMap(c => c.fields)
    .filter(f => f.isPublishableNow);
}

/**
 * Check if a component is visible for a desa.
 * Used by intake to label "detected but component hidden".
 */
export async function isComponentVisibleForDesa(desaId: string, componentKey: string): Promise<boolean> {
  const resolved = await resolveDesaTemplate(desaId);
  return resolved.visibleComponents.some(c => c.componentKey === componentKey);
}

/**
 * Get published DataDesa values for a desa given an already-resolved template.
 * Accepts pre-resolved template to avoid a redundant resolveDesaTemplate call.
 */
export async function getPublishedDataDesa(
  desaId: string,
  resolved: ResolvedTemplate,
): Promise<Record<string, unknown>> {
  if (!db) {
    return getPublishedDataDesaViaSupabase(desaId, resolved).catch(() => ({}));
  }

  try {
    const visibleComponentIds = resolved.visibleComponents
      .map(c => c.componentId)
      .filter(id => !id.startsWith("fallback-"));

    if (visibleComponentIds.length === 0) return {};

    const rows = await db.dataDesa.findMany({
      where: {
        desaId,
        status: "PUBLISHED",
        isActive: true,
        componentId: { in: visibleComponentIds },
      },
      select: { fieldKey: true, valueJson: true, valueText: true },
    });

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.fieldKey] = row.valueJson ?? row.valueText;
    }
    return result;
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return getPublishedDataDesaViaSupabase(desaId, resolved).catch(() => ({}));
    }
    return {};
  }
}
