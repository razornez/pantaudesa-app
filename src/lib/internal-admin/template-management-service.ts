import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import {
  getDatabaseUnavailableMessage,
  isDatabaseConnectivityError,
} from "@/lib/db-connectivity";
import {
  analyzeTemplateCompositionInput,
  isKnownTemplateComponentKey as isKnownComponentKey,
  normalizeTemplateNameToKey,
} from "@/lib/internal-admin/template-management-helpers";
import {
  filterActiveAdminDesaNotificationRecipients,
  notifyTemplateAssignmentChanged,
  notifyTemplateComponentsChanged,
} from "@/lib/admin-desa/template-change-notifications";
import {
  invalidateAllTemplateCaches,
  invalidateTemplateCache,
} from "@/lib/village-data/template-resolver";
import { DEFAULT_TEMPLATE_KEY } from "@/lib/village-data/template-constants";
import {
  DEFAULT_COMPONENT_CATALOG_BY_KEY,
  DEFAULT_COMPONENT_CATALOG_MANIFEST,
  type ComponentCatalogManifestEntry,
  type ComponentDetailSlot,
  type ComponentPreviewVariant,
  type ComponentRendererType,
  type RegisteredVillageComponentKey,
} from "@/lib/village-data/component-catalog-manifest";

export interface TemplateCatalogFieldSummary {
  fieldKey: string;
  label: string;
  valueType: string;
  isPublishableNow: boolean;
  displayOrder: number;
}

export interface TemplateCatalogComponentSummary {
  componentKey: RegisteredVillageComponentKey;
  label: string;
  description: string;
  componentType: string;
  isDefaultVisible: boolean;
  displayOrder: number;
  rendererType: ComponentRendererType;
  previewVariant: ComponentPreviewVariant;
  detailSlot: ComponentDetailSlot;
  navLabel: string;
  anchorId: string;
  publicGroupKey: string | null;
  publicTabKey: string | null;
  highlightFieldKeys?: string[];
  renderConfig: Record<string, unknown>;
  fieldCount: number;
  fields: TemplateCatalogFieldSummary[];
  source: "db" | "manifest";
}

export interface TemplateSummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: string;
  isDefault: boolean;
  version: number;
  componentCount: number;
  assignedDesaCount: number;
  updatedAt: string;
}

export interface TemplateEditorComponent {
  componentId: string | null;
  componentKey: RegisteredVillageComponentKey;
  label: string;
  description: string;
  componentType: string;
  displayOrder: number;
  isDefaultVisible: boolean;
  rendererType: ComponentRendererType;
  previewVariant: ComponentPreviewVariant;
  detailSlot: ComponentDetailSlot;
  navLabel: string;
  anchorId: string;
  publicGroupKey: string | null;
  publicTabKey: string | null;
  highlightFieldKeys?: string[];
  renderConfig: Record<string, unknown>;
  fieldCount: number;
  fields: TemplateCatalogFieldSummary[];
  source: "db" | "manifest";
}

export interface TemplateDetail extends TemplateSummary {
  components: TemplateEditorComponent[];
  deleteBlockedReason: string | null;
}

export interface TemplateWorkspaceData {
  templates: TemplateSummary[];
  selectedTemplateId: string | null;
  selectedTemplate: TemplateDetail | null;
  availableComponents: TemplateCatalogComponentSummary[];
  catalogSource: "db" | "manifest";
  readOnly?: boolean;
  readOnlyReason?: string | null;
}

export interface SaveTemplateComponentsInput {
  templateId: string;
  componentKeys: string[];
}

export interface TemplateMutationResult {
  templateId: string;
  message: string;
}

export class TemplateManagementError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "template_management_error") {
    super(message);
    this.name = "TemplateManagementError";
    this.status = status;
    this.code = code;
  }
}

function isMissingCatalogRelationColumnError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2022") return false;
  const column = typeof error.meta?.column === "string" ? error.meta.column : "";
  return (
    column.includes("catalogComponentId") ||
    column.includes("catalogFieldId")
  );
}

const LEGACY_DEFAULT_TEMPLATE_KEYS = new Set([
  "TEMPLATE_UMUM_DESA",
]);
const MANIFEST_FALLBACK_TEMPLATE_ID = "manifest:TEMPLATE_UMUM_DESA";
export const TEMPLATE_MUTATION_TRANSACTION_OPTIONS = {
  maxWait: 20_000,
  timeout: 120_000,
} as const;

export function isTemplateComponentRemovalBlocked(input: {
  dataDesaCount: number;
  visibilityOverrideCount: number;
}) {
  void input.visibilityOverrideCount;
  return input.dataDesaCount > 0;
}

let catalogSupportCache: boolean | null = null;
let catalogRelationSupportCache:
  | {
      catalogComponentId: boolean;
      catalogFieldId: boolean;
    }
  | null = null;

function createFallbackCatalogComponent(
  component: ComponentCatalogManifestEntry,
): TemplateCatalogComponentSummary {
  return {
    componentKey: component.componentKey,
    label: component.label,
    description: component.description,
    componentType: component.componentType,
    isDefaultVisible: component.isDefaultVisible,
    displayOrder: component.displayOrder,
    rendererType: component.rendererType,
    previewVariant: component.previewVariant,
    detailSlot: component.detailSlot,
    navLabel: component.navLabel ?? component.label,
    anchorId: component.anchorId ?? component.componentKey.replaceAll("_", "-"),
    publicGroupKey: component.publicGroupKey ?? component.detailSlot,
    publicTabKey: component.publicTabKey ?? component.componentKey,
    highlightFieldKeys: component.highlightFieldKeys,
    renderConfig: component.renderConfig ?? {},
    fieldCount: component.fields.length,
    fields: component.fields.map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
      valueType: field.valueType,
      isPublishableNow: field.isPublishableNow,
      displayOrder: field.displayOrder,
    })),
    source: "manifest",
  };
}

function toStringArray(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const values = input.filter((item): item is string => typeof item === "string");
  return values.length > 0 ? values : undefined;
}

function toRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function getDefaultCatalogList(): TemplateCatalogComponentSummary[] {
  return DEFAULT_COMPONENT_CATALOG_MANIFEST.map(createFallbackCatalogComponent).sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
}

function buildManifestTemplateDetail(
  catalogComponents: TemplateCatalogComponentSummary[],
): TemplateDetail {
  const updatedAt = new Date().toISOString();
  return {
    id: MANIFEST_FALLBACK_TEMPLATE_ID,
    key: DEFAULT_TEMPLATE_KEY,
    name: "Template Umum Desa",
    description:
      "Fallback manifest lokal saat koneksi database runtime belum tersedia.",
    status: "READ_ONLY",
    isDefault: true,
    version: 1,
    componentCount: catalogComponents.length,
    assignedDesaCount: 0,
    updatedAt,
    deleteBlockedReason:
      "Mode fallback manifest bersifat read-only. Pulihkan koneksi database untuk menghapus template.",
    components: catalogComponents.map((component, index) => ({
      componentId: null,
      ...component,
      displayOrder: index + 1,
    })),
  };
}

function buildReadOnlyManifestWorkspace(
  catalog: {
    source: "db" | "manifest";
    components: TemplateCatalogComponentSummary[];
  },
  reason = getDatabaseUnavailableMessage(),
): TemplateWorkspaceData {
  const components =
    catalog.components.length > 0 ? catalog.components : getDefaultCatalogList();
  const selectedTemplate = buildManifestTemplateDetail(components);

  return {
    templates: [selectedTemplate],
    selectedTemplateId: selectedTemplate.id,
    selectedTemplate,
    availableComponents: components,
    catalogSource: catalog.source,
    readOnly: true,
    readOnlyReason: reason,
  };
}

async function loadActiveTemplateAssignmentRecipients(templateId: string) {
  if (!db) return [];
  const assignments = await db.desaDetailTemplateAssignment.findMany({
    where: { templateId, isActive: true },
    select: {
      desaId: true,
      desa: {
        select: {
          desaAdminMembers: {
            select: { userId: true, status: true },
          },
        },
      },
    },
  });

  return assignments.map((assignment) => ({
    desaId: assignment.desaId,
    recipientUserIds: filterActiveAdminDesaNotificationRecipients(
      assignment.desa.desaAdminMembers,
    ),
  }));
}

async function loadActiveDesaTemplateRecipients(desaId: string) {
  if (!db) return [];
  const members = await db.desaAdminMember.findMany({
    where: { desaId, status: { in: ["LIMITED", "VERIFIED"] } },
    select: { userId: true, status: true },
  });

  return filterActiveAdminDesaNotificationRecipients(members);
}

async function supportsComponentCatalogTables(): Promise<boolean> {
  if (!db) return false;
  if (catalogSupportCache !== null) return catalogSupportCache;

  try {
    await db.$queryRawUnsafe(
      "SELECT 1 FROM village_component_catalog LIMIT 1",
    );
    catalogSupportCache = true;
  } catch {
    catalogSupportCache = false;
  }

  return catalogSupportCache;
}

async function getCatalogRelationColumnSupport() {
  if (!db || !(await supportsComponentCatalogTables())) {
    return {
      catalogComponentId: false,
      catalogFieldId: false,
    };
  }

  if (catalogRelationSupportCache) return catalogRelationSupportCache;

  try {
    const rows = (await db.$queryRawUnsafe(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'village_detail_components' AND column_name = 'catalogComponentId')
          OR
          (table_name = 'detail_field_standards' AND column_name = 'catalogFieldId')
        )
    `)) as Array<{ table_name: string; column_name: string }>;

    const hasComponentId = rows.some(
      (row) =>
        row.table_name === "village_detail_components" &&
        row.column_name === "catalogComponentId",
    );
    const hasFieldId = rows.some(
      (row) =>
        row.table_name === "detail_field_standards" &&
        row.column_name === "catalogFieldId",
    );

    catalogRelationSupportCache = {
      catalogComponentId: hasComponentId,
      catalogFieldId: hasFieldId,
    };
  } catch {
    catalogRelationSupportCache = {
      catalogComponentId: false,
      catalogFieldId: false,
    };
  }

  return catalogRelationSupportCache;
}

async function loadCatalogComponents(): Promise<{
  source: "db" | "manifest";
  components: TemplateCatalogComponentSummary[];
}> {
  if (!db) {
    return { source: "manifest", components: getDefaultCatalogList() };
  }

  if (!(await supportsComponentCatalogTables())) {
    return { source: "manifest", components: getDefaultCatalogList() };
  }

  try {
    const rows = await db.villageComponentCatalog.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ componentKey: "asc" }],
      select: {
        componentKey: true,
        label: true,
        description: true,
        componentType: true,
        isDefaultVisible: true,
        displayOrder: true,
        rendererType: true,
        previewVariant: true,
        detailSlot: true,
        navLabel: true,
        anchorId: true,
        publicGroupKey: true,
        publicTabKey: true,
        highlightFieldKeys: true,
        renderConfigJson: true,
        fields: {
          where: { status: "ACTIVE" },
          orderBy: [{ displayOrder: "asc" }],
          select: {
            fieldKey: true,
            label: true,
            valueType: true,
            isPublishableNow: true,
            displayOrder: true,
          },
        },
      },
    });

    const components = rows.flatMap((row) => {
      if (!isKnownComponentKey(row.componentKey)) return [];
        const fallback = DEFAULT_COMPONENT_CATALOG_BY_KEY.get(row.componentKey)!;
        return [{
          componentKey: row.componentKey,
          label: row.label,
          description: row.description ?? fallback.description,
          componentType: row.componentType,
          isDefaultVisible: row.isDefaultVisible,
          displayOrder: row.displayOrder,
          rendererType: row.rendererType as ComponentRendererType,
          previewVariant: row.previewVariant as ComponentPreviewVariant,
          detailSlot: row.detailSlot as ComponentDetailSlot,
          navLabel: row.navLabel ?? fallback.navLabel ?? row.label,
          anchorId:
            row.anchorId ??
            fallback.anchorId ??
            row.componentKey.replaceAll("_", "-"),
          publicGroupKey: row.publicGroupKey ?? fallback.publicGroupKey ?? row.detailSlot,
          publicTabKey: row.publicTabKey ?? fallback.publicTabKey ?? row.componentKey,
          highlightFieldKeys:
            toStringArray(row.highlightFieldKeys) ?? fallback.highlightFieldKeys,
          renderConfig: toRecord(row.renderConfigJson),
          fieldCount: row.fields.length,
          fields: row.fields.map((field) => ({
            fieldKey: field.fieldKey,
            label: field.label,
            valueType: field.valueType,
            isPublishableNow: field.isPublishableNow,
            displayOrder: field.displayOrder,
          })),
          source: "db" as const,
        } satisfies TemplateCatalogComponentSummary];
      })
      .sort((left, right) => left.displayOrder - right.displayOrder);

    if (components.length > 0) {
      return { source: "db", components };
    }
  } catch (error) {
    if (isDatabaseConnectivityError(error)) throw error;
  }

  return { source: "manifest", components: getDefaultCatalogList() };
}

function toTemplateSummary(row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: string;
  isDefault: boolean;
  version: number;
  updatedAt: Date;
  _count?: {
    components?: number;
    desaAssignments?: number;
  };
}): TemplateSummary {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    status: row.status,
    isDefault: row.isDefault,
    version: row.version,
    componentCount: row._count?.components ?? 0,
    assignedDesaCount: row._count?.desaAssignments ?? 0,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildDeleteBlockedReason(summary: TemplateSummary): string | null {
  if (summary.assignedDesaCount > 0) {
    return `Template ini masih dipakai oleh ${summary.assignedDesaCount} desa. Pindahkan dulu assignment desanya sebelum dihapus.`;
  }
  if (summary.isDefault || LEGACY_DEFAULT_TEMPLATE_KEYS.has(summary.key)) {
    return "Template default tidak bisa dihapus langsung. Jadikan template lain sebagai default atau kosongkan assignment lebih dulu.";
  }
  return null;
}

async function buildTemplateDetail(
  templateId: string,
  catalogMap: Map<RegisteredVillageComponentKey, TemplateCatalogComponentSummary>,
): Promise<TemplateDetail | null> {
  if (!db) return null;

  const template = await db.villageDetailTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      status: true,
      isDefault: true,
      version: true,
      updatedAt: true,
      _count: {
        select: {
          components: true,
          desaAssignments: true,
        },
      },
      components: {
        where: { status: "ACTIVE" },
        orderBy: [{ displayOrder: "asc" }],
        select: {
          id: true,
          componentKey: true,
          label: true,
          description: true,
          componentType: true,
          isDefaultVisible: true,
          displayOrder: true,
          fieldStandards: {
            where: { status: "ACTIVE" },
            orderBy: [{ displayOrder: "asc" }],
            select: {
              fieldKey: true,
              label: true,
              valueType: true,
              isPublishableNow: true,
              displayOrder: true,
            },
          },
        },
      },
    },
  });

  if (!template) return null;

  return {
    ...toTemplateSummary(template),
    deleteBlockedReason: buildDeleteBlockedReason(toTemplateSummary(template)),
    components: template.components.flatMap((component) => {
        if (!isKnownComponentKey(component.componentKey)) return [];
        const fallback = catalogMap.get(component.componentKey);
        const existingFields = new Map(
          component.fieldStandards.map((field) => [
            field.fieldKey,
            {
              fieldKey: field.fieldKey,
              label: field.label,
              valueType: field.valueType,
              isPublishableNow: field.isPublishableNow,
              displayOrder: field.displayOrder,
            },
          ]),
        );
        const fields =
          template.key === DEFAULT_TEMPLATE_KEY
            ? fallback?.fields.map((field) => existingFields.get(field.fieldKey) ?? field) ??
              [...existingFields.values()]
            : [...existingFields.values()];

        return [{
          componentId: component.id,
          componentKey: component.componentKey,
          label: component.label,
          description: component.description ?? fallback?.description ?? "",
          componentType: component.componentType,
          displayOrder: component.displayOrder,
          isDefaultVisible: component.isDefaultVisible,
          rendererType: fallback?.rendererType ?? "identity_grid",
          previewVariant: fallback?.previewVariant ?? "identity",
          detailSlot: fallback?.detailSlot ?? "first_view",
          navLabel: fallback?.navLabel ?? component.label,
          anchorId: fallback?.anchorId ?? component.componentKey.replaceAll("_", "-"),
          publicGroupKey: fallback?.publicGroupKey ?? fallback?.detailSlot ?? null,
          publicTabKey: fallback?.publicTabKey ?? component.componentKey,
          highlightFieldKeys: fallback?.highlightFieldKeys,
          renderConfig: fallback?.renderConfig ?? {},
          fieldCount: fields.length,
          fields,
          source: fallback?.source ?? "manifest",
        } satisfies TemplateEditorComponent];
      }),
  };
}

async function ensureTemplateExists(templateId: string) {
  if (!db) {
    throw new TemplateManagementError("Database template belum tersedia.", 503, "db_unavailable");
  }

  const template = await db.villageDetailTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, key: true, name: true, status: true, isDefault: true },
  });

  if (!template) {
    throw new TemplateManagementError("Template tidak ditemukan.", 404, "template_not_found");
  }

  return template;
}

async function ensureUniqueTemplateKey(baseKey: string, excludeTemplateId?: string) {
  if (!db) return baseKey;

  let candidate = baseKey;
  let suffix = 2;

  for (;;) {
    const existing = await db.villageDetailTemplate.findFirst({
      where: {
        key: candidate,
        ...(excludeTemplateId ? { id: { not: excludeTemplateId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    candidate = `${baseKey}_${suffix}`;
    suffix += 1;
  }
}

function createTemplateComponentInput(
  templateId: string,
  component: TemplateCatalogComponentSummary,
  displayOrder: number,
  withCatalogComponentId: boolean,
  catalogIdMap: Map<RegisteredVillageComponentKey, string>,
) {
  return {
    templateId,
    componentKey: component.componentKey,
    label: component.label,
    description: component.description,
    componentType: component.componentType,
    isDefaultVisible: component.isDefaultVisible,
    displayOrder,
    status: "ACTIVE",
    ...(withCatalogComponentId
      ? { catalogComponentId: catalogIdMap.get(component.componentKey) ?? null }
      : {}),
  };
}

function createFieldStandardInput(
  templateId: string,
  componentId: string,
  component: TemplateCatalogComponentSummary,
  field: TemplateCatalogFieldSummary,
  withCatalogFieldId: boolean,
  catalogFieldIdMap: Map<string, string>,
) {
  return {
    templateId,
    componentId,
    fieldKey: field.fieldKey,
    label: field.label,
    valueType: field.valueType,
    isPublishableNow: field.isPublishableNow,
    isRequired: false,
    isPublicVisible: true,
    displayOrder: field.displayOrder,
    status: "ACTIVE",
    sourcePolicyJson: Prisma.JsonNull,
    validationRules: Prisma.JsonNull,
    ...(withCatalogFieldId
      ? { catalogFieldId: catalogFieldIdMap.get(`${component.componentKey}:${field.fieldKey}`) ?? null }
      : {}),
  };
}

async function buildCatalogIdMaps() {
  const componentIdMap = new Map<RegisteredVillageComponentKey, string>();
  const fieldIdMap = new Map<string, string>();

  if (!db || !(await supportsComponentCatalogTables())) {
    return {
      componentIdMap,
      fieldIdMap,
      componentCatalogIdsSupported: false,
      fieldCatalogIdsSupported: false,
    };
  }

  const columnSupport = await getCatalogRelationColumnSupport();

  const rows = await db.villageComponentCatalog.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      componentKey: true,
      fields: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          fieldKey: true,
        },
      },
    },
  });

  for (const row of rows) {
    if (!isKnownComponentKey(row.componentKey)) continue;
    componentIdMap.set(row.componentKey, row.id);
    for (const field of row.fields) {
      fieldIdMap.set(`${row.componentKey}:${field.fieldKey}`, field.id);
    }
  }

  return {
    componentIdMap,
    fieldIdMap,
    componentCatalogIdsSupported: columnSupport.catalogComponentId,
    fieldCatalogIdsSupported: columnSupport.catalogFieldId,
  };
}

export async function getTemplateWorkspace(
  selectedTemplateId?: string | null,
): Promise<TemplateWorkspaceData> {
  let catalog: {
    source: "db" | "manifest";
    components: TemplateCatalogComponentSummary[];
  };

  try {
    catalog = await loadCatalogComponents();
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return buildReadOnlyManifestWorkspace({
        source: "manifest",
        components: getDefaultCatalogList(),
      });
    }
    throw error;
  }

  if (!db) {
    return buildReadOnlyManifestWorkspace(
      catalog,
      "Database belum dikonfigurasi. Workspace template ditampilkan dari manifest lokal.",
    );
  }

  try {
    const templates = (
      await db.villageDetailTemplate.findMany({
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          status: true,
          isDefault: true,
          version: true,
          updatedAt: true,
          _count: {
            select: {
              components: true,
              desaAssignments: true,
            },
          },
        },
      })
    ).map(toTemplateSummary);

    const effectiveTemplateId =
      selectedTemplateId && templates.some((template) => template.id === selectedTemplateId)
        ? selectedTemplateId
        : templates[0]?.id ?? null;

    const selectedTemplate = effectiveTemplateId
      ? await buildTemplateDetail(
          effectiveTemplateId,
          new Map(catalog.components.map((component) => [component.componentKey, component])),
        )
      : null;

    return {
      templates,
      selectedTemplateId: effectiveTemplateId,
      selectedTemplate,
      availableComponents: catalog.components,
      catalogSource: catalog.source,
      readOnly: false,
      readOnlyReason: null,
    };
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return buildReadOnlyManifestWorkspace(catalog);
    }
    throw error;
  }
}

export async function createTemplate(input: {
  name: string;
  description?: string | null;
}): Promise<TemplateMutationResult> {
  if (!db) {
    throw new TemplateManagementError(
      "Database tidak tersedia untuk membuat template.",
      503,
      "db_unavailable",
    );
  }

  const name = input.name.trim();
  if (name.length < 3) {
    throw new TemplateManagementError("Nama template minimal 3 karakter.", 400, "invalid_name");
  }

  const key = await ensureUniqueTemplateKey(normalizeTemplateNameToKey(name));
  const template = await db.villageDetailTemplate.create({
    data: {
      key,
      name,
      description: input.description?.trim() || null,
      status: "ACTIVE",
      isDefault: false,
      version: 1,
    },
    select: { id: true },
  });

  return {
    templateId: template.id,
    message: "Template baru siap dirakit dari canvas kosong.",
  };
}

export async function updateTemplateMeta(input: {
  templateId: string;
  name: string;
  description?: string | null;
}): Promise<TemplateMutationResult> {
  if (!db) {
    throw new TemplateManagementError(
      "Database tidak tersedia untuk memperbarui template.",
      503,
      "db_unavailable",
    );
  }

  const name = input.name.trim();
  if (name.length < 3) {
    throw new TemplateManagementError("Nama template minimal 3 karakter.", 400, "invalid_name");
  }

  await ensureTemplateExists(input.templateId);
  const key = await ensureUniqueTemplateKey(
    normalizeTemplateNameToKey(name),
    input.templateId,
  );

  await db.villageDetailTemplate.update({
    where: { id: input.templateId },
    data: {
      key,
      name,
      description: input.description?.trim() || null,
      version: { increment: 1 },
    },
  });

  invalidateAllTemplateCaches();

  return {
    templateId: input.templateId,
    message: "Nama dan ringkasan template berhasil diperbarui.",
  };
}

export async function replaceTemplateComponents(
  input: SaveTemplateComponentsInput,
): Promise<TemplateMutationResult> {
  if (!db) {
    throw new TemplateManagementError(
      "Database tidak tersedia untuk menyimpan susunan template.",
      503,
      "db_unavailable",
    );
  }

  const template = await ensureTemplateExists(input.templateId);
  const composition = analyzeTemplateCompositionInput(input.componentKeys);
  if (composition.duplicateKeys.length > 0) {
    throw new TemplateManagementError(
      `Komponen ${composition.duplicateKeys.join(", ")} muncul lebih dari sekali dalam urutan template.`,
      409,
      "duplicate_component_key",
    );
  }
  if (composition.unknownKeys.length > 0) {
    throw new TemplateManagementError(
      `Komponen ${composition.unknownKeys.join(", ")} belum terdaftar di registry.`,
      400,
      "component_not_registered",
    );
  }

  const normalizedKeys = composition.normalizedKeys;
  const catalog = await loadCatalogComponents();
  const catalogMap = new Map(
    catalog.components.map((component) => [component.componentKey, component]),
  );

  const desiredComponents = normalizedKeys.map((key) => {
    const component = catalogMap.get(key);
    if (!component) {
      throw new TemplateManagementError(
        `Komponen ${key} belum terdaftar di registry.`,
        400,
        "component_not_registered",
      );
    }
    return component;
  });
  const previousComponentsForNotification = await db.villageDetailComponent.findMany({
    where: { templateId: input.templateId },
    select: { componentKey: true, label: true },
  });
  const previousComponentKeys = new Set(previousComponentsForNotification.map((component) => component.componentKey));
  const desiredComponentKeys = new Set<string>(
    desiredComponents.map((component) => component.componentKey),
  );
  const addedComponentLabels = desiredComponents
    .filter((component) => !previousComponentKeys.has(component.componentKey))
    .map((component) => component.label);
  const removedComponentLabels = previousComponentsForNotification
    .filter((component) => !desiredComponentKeys.has(component.componentKey))
    .map((component) => component.label);
  const shouldNotifyComponentChange =
    addedComponentLabels.length > 0 || removedComponentLabels.length > 0;
  const assignmentRecipients = shouldNotifyComponentChange
    ? await loadActiveTemplateAssignmentRecipients(input.templateId)
    : [];

  const withCatalogIds = await buildCatalogIdMaps();

  const persistComposition = async (catalogIdsSupported: {
    componentCatalogIdsSupported: boolean;
    fieldCatalogIdsSupported: boolean;
    componentIdMap: Map<RegisteredVillageComponentKey, string>;
    fieldIdMap: Map<string, string>;
  }) => {
    await db.$transaction(async (tx) => {
      const existingComponents = await tx.villageDetailComponent.findMany({
        where: {
          templateId: input.templateId,
        },
        orderBy: [{ displayOrder: "asc" }],
        select: {
          id: true,
          componentKey: true,
          label: true,
          description: true,
          componentType: true,
          isDefaultVisible: true,
          fieldStandards: {
            select: {
              id: true,
              fieldKey: true,
            },
          },
          _count: {
            select: {
              dataDesa: true,
              desaVisibility: true,
            },
          },
        },
      });

      const existingByKey = new Map(
        existingComponents
          .flatMap((component) =>
            isKnownComponentKey(component.componentKey)
              ? [[component.componentKey, component] as const]
              : [],
          ),
      );

      const componentsToRemove = existingComponents.filter(
        (component) =>
          isKnownComponentKey(component.componentKey) &&
          !normalizedKeys.includes(component.componentKey),
      );

      const blockedRemovals = componentsToRemove.filter(
        (component) =>
          isTemplateComponentRemovalBlocked({
            dataDesaCount: component._count.dataDesa,
            visibilityOverrideCount: component._count.desaVisibility,
          }),
      );

      if (blockedRemovals.length > 0) {
        throw new TemplateManagementError(
          `Komponen ${blockedRemovals
            .map((component) => component.label)
            .join(", ")} tidak bisa dilepas karena masih punya data publik aktif.`,
          409,
          "component_removal_blocked",
        );
      }

      for (const component of componentsToRemove) {
        await tx.desaDetailComponentVisibility.deleteMany({
          where: { componentId: component.id },
        });
        await tx.detailFieldStandard.deleteMany({
          where: { componentId: component.id },
        });
        await tx.villageDetailComponent.delete({
          where: { id: component.id },
        });
      }

      for (const [index, component] of desiredComponents.entries()) {
        const existing = existingByKey.get(component.componentKey) ?? null;
        const displayOrder = index + 1;

        if (!existing) {
          const created = await tx.villageDetailComponent.create({
            data: createTemplateComponentInput(
              input.templateId,
              component,
              displayOrder,
              catalogIdsSupported.componentCatalogIdsSupported,
              catalogIdsSupported.componentIdMap,
            ),
            select: { id: true },
          });

          if (component.fields.length > 0) {
            await tx.detailFieldStandard.createMany({
              data: component.fields.map((field) =>
                createFieldStandardInput(
                  input.templateId,
                  created.id,
                  component,
                  field,
                  catalogIdsSupported.fieldCatalogIdsSupported,
                  catalogIdsSupported.fieldIdMap,
                ),
              ),
            });
          }
          continue;
        }

        await tx.villageDetailComponent.update({
          where: { id: existing.id },
          data: {
            label: component.label,
            description: component.description,
            componentType: component.componentType,
            isDefaultVisible: component.isDefaultVisible,
            displayOrder,
            status: "ACTIVE",
            ...(catalogIdsSupported.componentCatalogIdsSupported
              ? {
                  catalogComponentId:
                    catalogIdsSupported.componentIdMap.get(component.componentKey) ?? null,
                }
              : {}),
          },
          select: { id: true },
        });
      }

      await tx.villageDetailTemplate.update({
        where: { id: input.templateId },
        data: { version: { increment: 1 } },
      });
    }, TEMPLATE_MUTATION_TRANSACTION_OPTIONS);
  };

  try {
    await persistComposition(withCatalogIds);
  } catch (error) {
    if (!isMissingCatalogRelationColumnError(error)) throw error;

    catalogRelationSupportCache = {
      catalogComponentId: false,
      catalogFieldId: false,
    };

    await persistComposition({
      ...withCatalogIds,
      componentCatalogIdsSupported: false,
      fieldCatalogIdsSupported: false,
    });
  }

  invalidateAllTemplateCaches();
  if (shouldNotifyComponentChange) {
    await Promise.all(
      assignmentRecipients.map((assignment) =>
        notifyTemplateComponentsChanged({
          desaId: assignment.desaId,
          templateId: template.id,
          templateName: template.name,
          recipientUserIds: assignment.recipientUserIds,
          addedComponentLabels,
          removedComponentLabels,
        }),
      ),
    );
  }

  return {
    templateId: template.id,
    message:
      desiredComponents.length > 0
        ? "Susunan komponen template berhasil diperbarui."
        : "Template disimpan dalam keadaan kosong.",
  };
}

export async function deleteTemplate(
  templateId: string,
): Promise<TemplateMutationResult> {
  if (!db) {
    throw new TemplateManagementError(
      "Database tidak tersedia untuk menghapus template.",
      503,
      "db_unavailable",
    );
  }

  const template = await ensureTemplateExists(templateId);
  const assignmentCount = await db.desaDetailTemplateAssignment.count({
    where: { templateId, isActive: true },
  });

  if (assignmentCount > 0) {
    throw new TemplateManagementError(
      `Template ini masih dipakai oleh ${assignmentCount} desa.`,
      409,
      "template_in_use",
    );
  }

  const componentIds = (
    await db.villageDetailComponent.findMany({
      where: { templateId },
      select: { id: true },
    })
  ).map((component) => component.id);

  if (componentIds.length > 0) {
    const [dataCount, visibilityCount] = await Promise.all([
      db.dataDesa.count({
        where: { templateId },
      }),
      db.desaDetailComponentVisibility.count({
        where: { templateId },
      }),
    ]);

    if (dataCount > 0 || visibilityCount > 0) {
      throw new TemplateManagementError(
        "Template ini masih punya data historis atau override komponen yang aktif, jadi belum aman dihapus.",
        409,
        "template_has_history",
      );
    }
  }

  await db.$transaction(async (tx) => {
    await tx.detailFieldStandard.deleteMany({ where: { templateId } });
    await tx.villageDetailComponent.deleteMany({ where: { templateId } });
    await tx.villageDetailTemplate.delete({ where: { id: templateId } });
  }, TEMPLATE_MUTATION_TRANSACTION_OPTIONS);

  invalidateAllTemplateCaches();

  return {
    templateId: template.id,
    message: "Template berhasil dihapus.",
  };
}

export async function switchTemplateForDesa(input: {
  desaId: string;
  templateId: string;
}): Promise<TemplateMutationResult> {
  if (!db) {
    throw new TemplateManagementError(
      "Database tidak tersedia untuk mengganti template desa.",
      503,
      "db_unavailable",
    );
  }

  if (!input.desaId || !input.templateId) {
    throw new TemplateManagementError(
      "desaId dan templateId wajib diisi.",
      400,
      "invalid_assignment",
    );
  }

  const template = await ensureTemplateExists(input.templateId);
  if (template.status !== "ACTIVE") {
    throw new TemplateManagementError(
      "Template yang dipilih tidak aktif.",
      409,
      "template_inactive",
    );
  }

  const desa = await db.desa.findUnique({
    where: { id: input.desaId },
    select: { id: true, nama: true },
  });
  if (!desa) {
    throw new TemplateManagementError("Desa tidak ditemukan.", 404, "desa_not_found");
  }
  const recipientUserIds = await loadActiveDesaTemplateRecipients(input.desaId);

  await db.$transaction(async (tx) => {
    await tx.desaDetailTemplateAssignment.upsert({
      where: { desaId: input.desaId },
      create: {
        desaId: input.desaId,
        templateId: input.templateId,
        isActive: true,
        reason: "Switched from internal admin village data center",
      },
      update: {
        templateId: input.templateId,
        isActive: true,
        reason: "Switched from internal admin village data center",
      },
    });

    await tx.desaDetailComponentVisibility.deleteMany({
      where: { desaId: input.desaId },
    });
  }, TEMPLATE_MUTATION_TRANSACTION_OPTIONS);

  invalidateTemplateCache(input.desaId);
  await notifyTemplateAssignmentChanged({
    desaId: input.desaId,
    templateId: input.templateId,
    templateName: template.name,
    recipientUserIds,
  });

  return {
    templateId: input.templateId,
    message: `Template desa ${desa.nama} berhasil diganti ke ${template.name}.`,
  };
}
