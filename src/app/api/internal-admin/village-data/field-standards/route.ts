import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import { db } from "@/lib/db";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildComponentProgressLens,
  matchPublishedRowsToComponents,
} from "@/lib/internal-admin/component-progress-lens";
import { DEFAULT_COMPONENT_CATALOG_MANIFEST } from "@/lib/village-data/component-catalog-manifest";
import { DEFAULT_TEMPLATE_KEY, DEFAULT_TEMPLATE_NAME } from "@/lib/village-data/template-constants";
import {
  buildRuntimeTemplateManifest,
  mergeResolvedFieldsWithCatalogManifest,
  toRuntimeProgressSources,
} from "@/lib/village-data/runtime-template-manifest";
import {
  resolveDesaTemplate,
  type ResolvedTemplate,
} from "@/lib/village-data/template-resolver";

type SupabaseCountRow = { count: number | null };
type SupabasePublishedRow = {
  fieldKey: string;
  componentId: string | null;
  fieldStandardId?: string | null;
};
type SupabaseTemplateAssignmentRow = {
  desaId: string;
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
  templateId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  isDefaultVisible: boolean;
};
type SupabaseFieldRow = {
  id: string;
  componentId: string;
  fieldKey: string;
  label: string;
  valueType: string;
  isPublishableNow: boolean;
  displayOrder: number;
};
type SupabaseVisibilityRow = {
  componentId: string;
  isVisible: boolean;
};

async function getComponentProgressInputsViaSupabase(input: {
  desaId: string;
  componentIds: string[];
}) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return {
      sourceCount: 0,
      documentCount: 0,
      voiceCount: 0,
      publishedRows: [] as SupabasePublishedRow[],
    };
  }

  const safeComponentIds =
    input.componentIds.length > 0 ? input.componentIds : ["__empty__"];

  const [
    { count: sourceCount, error: sourceError },
    { count: documentCount, error: documentError },
    { count: voiceCount, error: voiceError },
    { data: publishedRows, error: publishedError },
  ] = await Promise.all([
    client
      .from("data_sources")
      .select("*", { count: "exact", head: true })
      .eq("desaId", input.desaId)
      .returns<SupabaseCountRow[]>(),
    client
      .from("dokumen_publik")
      .select("*", { count: "exact", head: true })
      .eq("desaId", input.desaId)
      .returns<SupabaseCountRow[]>(),
    client
      .from("voices")
      .select("*", { count: "exact", head: true })
      .eq("desaId", input.desaId)
      .returns<SupabaseCountRow[]>(),
    client
      .from("data_desa")
      .select("fieldKey,componentId,fieldStandardId")
      .eq("desaId", input.desaId)
      .eq("status", "PUBLISHED")
      .eq("isActive", true)
      .in("componentId", safeComponentIds)
      .returns<SupabasePublishedRow[]>(),
  ]);

  if (sourceError) throw sourceError;
  if (documentError) throw documentError;
  if (voiceError) throw voiceError;
  if (publishedError) throw publishedError;

  return {
    sourceCount: sourceCount ?? 0,
    documentCount: documentCount ?? 0,
    voiceCount: voiceCount ?? 0,
    publishedRows: publishedRows ?? [],
  };
}

async function resolveDesaTemplateDirectViaSupabase(
  desaId: string,
): Promise<ResolvedTemplate | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data: assignment, error: assignmentError } = await client
    .from("desa_detail_template_assignments")
    .select("desaId,templateId,isActive")
    .eq("desaId", desaId)
    .maybeSingle<SupabaseTemplateAssignmentRow>();
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
      .eq("isDefault", true)
      .eq("status", "ACTIVE")
      .limit(1)
      .returns<SupabaseTemplateRow[]>();
    if (error) throw error;
    template = data?.[0] ?? null;
  }

  if (!template) return null;

  const [
    { data: components, error: componentsError },
    { data: fields, error: fieldsError },
    { data: visibilityRows, error: visibilityError },
  ] = await Promise.all([
    client
      .from("village_detail_components")
      .select("id,templateId,componentKey,label,displayOrder,isDefaultVisible")
      .eq("templateId", template.id)
      .eq("status", "ACTIVE")
      .order("displayOrder", { ascending: true })
      .returns<SupabaseComponentRow[]>(),
    client
      .from("detail_field_standards")
      .select("id,componentId,fieldKey,label,valueType,isPublishableNow,displayOrder")
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
  if (visibilityError) throw visibilityError;

  const fieldMap = new Map<string, SupabaseFieldRow[]>();
  for (const field of fields ?? []) {
    const list = fieldMap.get(field.componentId) ?? [];
    list.push(field);
    fieldMap.set(field.componentId, list);
  }

  const overrideMap = new Map(
    (visibilityRows ?? []).map((row) => [row.componentId, row.isVisible]),
  );
  const shouldOverlayCatalog = template.key === DEFAULT_TEMPLATE_KEY;

  const visibleComponents: ResolvedTemplate["visibleComponents"] = [];
  const hiddenComponents: ResolvedTemplate["hiddenComponents"] = [];

  for (const component of components ?? []) {
    const resolvedFields = (fieldMap.get(component.id) ?? [])
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((field) => ({
        componentId: component.id,
        fieldStandardId: field.id,
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
      }));

    const mergedFields = shouldOverlayCatalog
      ? mergeResolvedFieldsWithCatalogManifest({
          componentId: component.id,
          componentKey: component.componentKey,
          componentLabel: component.label,
          fields: resolvedFields,
        })
      : resolvedFields;

    const target =
      overrideMap.has(component.id)
        ? overrideMap.get(component.id) === true
          ? visibleComponents
          : hiddenComponents
        : component.isDefaultVisible
          ? visibleComponents
          : hiddenComponents;

    target.push({
      componentId: component.id,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      fields: mergedFields,
    });
  }

  return {
    templateId: template.id,
    templateKey: template.key,
    templateName: template.name,
    visibleComponents,
    hiddenComponents,
  };
}

function buildPerDesaResponse(input: {
  desaId: string;
  resolved: ResolvedTemplate;
  sourceCount: number;
  documentCount: number;
  voiceCount: number;
  publishedRows: SupabasePublishedRow[];
}) {
  const runtimeManifest = buildRuntimeTemplateManifest(input.resolved);
  const allComponents = toRuntimeProgressSources(runtimeManifest);
  const rowMatch = matchPublishedRowsToComponents({
    components: allComponents,
    publishedRows: input.publishedRows,
  });

  if (rowMatch.mismatchRows.length > 0 || rowMatch.unknownRows.length > 0) {
    console.warn(
      `[warn][internal-admin.village-data] desa=${input.desaId} mismatchPublishedRows=${rowMatch.mismatchRows.length} unknownPublishedRows=${rowMatch.unknownRows.length} route=field-standards`,
    );
  }

  const progress = buildComponentProgressLens({
    components: allComponents,
    publishedFieldKeys: rowMatch.validFieldKeys,
    sourceCount: input.sourceCount,
    documentCount: input.documentCount,
    voiceCount: input.voiceCount,
  });
  const progressMap = new Map(
    progress.components.map((component) => [component.componentId, component]),
  );

  return {
    templateKey: input.resolved.templateKey,
    templateName: input.resolved.templateName,
    source: "db" as const,
    visibleComponents: input.resolved.visibleComponents.map((component) => ({
      componentId: component.componentId,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      isVisible: true,
      fieldCount: progressMap.get(component.componentId)?.fieldCount ?? component.fields.length,
      filledFieldCount:
        progressMap.get(component.componentId)?.filledFieldCount ?? 0,
      totalFieldCount:
        progressMap.get(component.componentId)?.totalFieldCount ?? component.fields.length,
      completionStatus:
        progressMap.get(component.componentId)?.completionStatus ?? "empty",
      filledFieldLabels:
        progressMap.get(component.componentId)?.filledFieldLabels ?? [],
      missingFieldLabels:
        progressMap.get(component.componentId)?.missingFieldLabels ?? [],
      teaserLabels: progressMap.get(component.componentId)?.teaserLabels ?? [],
      derivedSignals: progressMap.get(component.componentId)?.derivedSignals ?? [],
      fields: component.fields,
    })),
    hiddenComponents: input.resolved.hiddenComponents.map((component) => ({
      componentId: component.componentId,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      isVisible: false,
      fieldCount: progressMap.get(component.componentId)?.fieldCount ?? component.fields.length,
      filledFieldCount:
        progressMap.get(component.componentId)?.filledFieldCount ?? 0,
      totalFieldCount:
        progressMap.get(component.componentId)?.totalFieldCount ?? component.fields.length,
      completionStatus:
        progressMap.get(component.componentId)?.completionStatus ?? "empty",
      filledFieldLabels:
        progressMap.get(component.componentId)?.filledFieldLabels ?? [],
      missingFieldLabels:
        progressMap.get(component.componentId)?.missingFieldLabels ?? [],
      teaserLabels: progressMap.get(component.componentId)?.teaserLabels ?? [],
      derivedSignals: progressMap.get(component.componentId)?.derivedSignals ?? [],
      fields: component.fields,
    })),
    totalFields: runtimeManifest.visibleFieldCount,
    filledFieldCount: progress.aggregateFilledFieldCount,
    filledSignalCount: progress.aggregateFilledSignalCount,
    totalSignalCount: progress.aggregateTotalSignalCount,
    publishableCount: runtimeManifest.publishableCount,
    mismatchPublishedFieldCount: rowMatch.mismatchRows.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const desaId = req.nextUrl.searchParams.get("desaId")?.trim() ?? "";

    if (desaId) {
      try {
        let resolved = await resolveDesaTemplate(desaId);
        if (resolved.templateId === "fallback") {
          const directResolved = await resolveDesaTemplateDirectViaSupabase(desaId);
          if (directResolved) resolved = directResolved;
        }

        if (resolved.templateId !== "fallback") {
          if (db) {
            const [desaMeta, voiceCount, publishedRows] = await Promise.all([
              db.desa.findUnique({
                where: { id: desaId },
                select: {
                  _count: {
                    select: {
                      dataSources: true,
                      dokumenPublik: true,
                    },
                  },
                },
              }),
              db.voice.count({ where: { desaId } }),
              db.dataDesa.findMany({
                where: {
                  desaId,
                  status: "PUBLISHED",
                  isActive: true,
                },
                select: {
                  fieldKey: true,
                  componentId: true,
                  fieldStandardId: true,
                },
              }),
            ]);

            return NextResponse.json(
              buildPerDesaResponse({
                desaId,
                resolved,
                sourceCount: desaMeta?._count.dataSources ?? 0,
                documentCount: desaMeta?._count.dokumenPublik ?? 0,
                voiceCount,
                publishedRows,
              }),
            );
          }

          const fallback = await getComponentProgressInputsViaSupabase({
            desaId,
            componentIds: [
              ...resolved.visibleComponents.map((component) => component.componentId),
              ...resolved.hiddenComponents.map((component) => component.componentId),
            ],
          });

          return NextResponse.json(
            buildPerDesaResponse({
              desaId,
              resolved,
              sourceCount: fallback.sourceCount,
              documentCount: fallback.documentCount,
              voiceCount: fallback.voiceCount,
              publishedRows: fallback.publishedRows,
            }),
          );
        }
      } catch {
        const directResolved = await resolveDesaTemplateDirectViaSupabase(desaId).catch(
          () => null,
        );
        if (directResolved) {
          const fallback = await getComponentProgressInputsViaSupabase({
            desaId,
            componentIds: [
              ...directResolved.visibleComponents.map((component) => component.componentId),
              ...directResolved.hiddenComponents.map((component) => component.componentId),
            ],
          });

          return NextResponse.json(
            buildPerDesaResponse({
              desaId,
              resolved: directResolved,
              sourceCount: fallback.sourceCount,
              documentCount: fallback.documentCount,
              voiceCount: fallback.voiceCount,
              publishedRows: fallback.publishedRows,
            }),
          );
        }
      }
    }

    if (db) {
      try {
        const defaultTemplate = await db.villageDetailTemplate.findFirst({
          where: { isDefault: true, status: "ACTIVE" },
          select: {
            key: true,
            name: true,
            components: {
              where: { status: "ACTIVE" },
              orderBy: { displayOrder: "asc" },
              select: {
                id: true,
                componentKey: true,
                label: true,
                displayOrder: true,
                fieldStandards: {
                  where: { status: "ACTIVE" },
                  orderBy: { displayOrder: "asc" },
                  select: {
                    fieldKey: true,
                    label: true,
                    valueType: true,
                    isPublishableNow: true,
                  },
                },
              },
            },
          },
        });

        if (defaultTemplate) {
          const runtimeManifest = buildRuntimeTemplateManifest({
            templateId: "default-db",
            templateKey: defaultTemplate.key,
            templateName: defaultTemplate.name,
            visibleComponents: defaultTemplate.components.map((component) => ({
              componentId: component.id,
              componentKey: component.componentKey,
              label: component.label,
              displayOrder: component.displayOrder,
              fields: mergeResolvedFieldsWithCatalogManifest({
                componentId: component.id,
                componentKey: component.componentKey,
                componentLabel: component.label,
                fields: component.fieldStandards.map((field) => ({
                  fieldKey: field.fieldKey,
                  label: field.label,
                  valueType: field.valueType,
                  isPublishableNow: field.isPublishableNow,
                  componentKey: component.componentKey,
                  componentLabel: component.label,
                })),
              }),
            })),
            hiddenComponents: [],
          });

          return NextResponse.json({
            templateKey: defaultTemplate.key,
            templateName: defaultTemplate.name,
            source: "db",
            visibleComponents: defaultTemplate.components.map((component) => ({
              componentId: component.id,
              componentKey: component.componentKey,
              label: component.label,
              displayOrder: component.displayOrder,
              fields: component.fieldStandards.map((field) => ({
                fieldKey: field.fieldKey,
                label: field.label,
                valueType: field.valueType,
                isPublishableNow: field.isPublishableNow,
                componentKey: component.componentKey,
                componentLabel: component.label,
              })),
            })),
            hiddenComponents: [],
            totalFields: runtimeManifest.visibleFieldCount,
            publishableCount: runtimeManifest.publishableCount,
            holdCount: runtimeManifest.visibleFieldCount - runtimeManifest.publishableCount,
          });
        }
      } catch {
        // fall through to hardcoded fallback
      }
    }

    const sections = DEFAULT_COMPONENT_CATALOG_MANIFEST.map((component) => ({
      sectionKey: component.componentKey,
      sectionLabel: component.label,
      fields: component.fields.map((field) => ({
        sectionKey: component.componentKey,
        sectionLabel: component.label,
        fieldKey: field.fieldKey,
        fieldLabel: field.label,
        publishableNow: field.isPublishableNow,
        aiDetectable: true,
        currentModelSource: "DataDesa",
        sourceRequirement: undefined,
        validationRequirement: undefined,
        deferredReason: field.isPublishableNow
          ? null
          : "Belum diaktifkan untuk template ini.",
      })),
    }));
    const publishableCount = DEFAULT_COMPONENT_CATALOG_MANIFEST.flatMap(
      (component) => component.fields,
    ).filter((field) => field.isPublishableNow).length;
    const holdCount = DEFAULT_COMPONENT_CATALOG_MANIFEST.flatMap(
      (component) => component.fields,
    ).filter((field) => !field.isPublishableNow).length;
    const totalFields = DEFAULT_COMPONENT_CATALOG_MANIFEST.reduce(
      (sum, component) => sum + component.fields.length,
      0,
    );

    return NextResponse.json({
      templateKey: DEFAULT_TEMPLATE_KEY,
      templateName: DEFAULT_TEMPLATE_NAME,
      source: "fallback",
      totalFields,
      publishableCount,
      holdCount,
      sections,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/village-data/field-standards");
  }
}
