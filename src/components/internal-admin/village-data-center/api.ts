import type { AdminDesaFilter } from "@/components/internal-admin/AdminDesaFilterBar";
import type { TemplateFieldEngineViewModel } from "@/lib/village-data/template-field-contract";
import type {
  DesaComponentData,
  DesaRow,
  FieldStandard,
  FieldStandardsData,
  AuditRow,
  TemplateWorkspaceData,
  VersionRow,
} from "./types";

interface DbComponentPayload {
  componentId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  isVisible?: boolean;
  fieldCount?: number;
  filledFieldCount?: number;
  totalFieldCount?: number;
  completionStatus?: "empty" | "partial" | "complete";
  filledFieldLabels?: string[];
  missingFieldLabels?: string[];
  teaserLabels?: string[];
  derivedSignals?: string[];
  fields?: unknown[];
}

interface SectionPayload {
  sectionKey: string;
  sectionLabel: string;
  fields?: unknown[];
}

interface FieldStandardsPayload {
  templateKey: string;
  templateName: string;
  source: "db" | "fallback";
  totalFields: number;
  publishableCount: number;
  filledFieldCount?: number;
  filledSignalCount?: number;
  totalSignalCount?: number;
  mismatchPublishedFieldCount?: number;
  holdCount?: number;
  visibleComponents?: DbComponentPayload[];
  hiddenComponents?: DbComponentPayload[];
  sections?: SectionPayload[];
}

function toDbFieldArray(fields: unknown[] | undefined, component: DbComponentPayload): FieldStandard[] {
  return (fields ?? []).map(
    (field): FieldStandard => ({
      sectionKey: component.componentKey,
      sectionLabel: component.label,
      fieldKey:
        typeof field === "object" &&
        field !== null &&
        "fieldKey" in field &&
        typeof field.fieldKey === "string"
          ? field.fieldKey
          : "",
      fieldLabel:
        typeof field === "object" &&
        field !== null &&
        "label" in field &&
        typeof field.label === "string"
          ? field.label
          : "",
      publishableNow:
        typeof field === "object" &&
        field !== null &&
        "isPublishableNow" in field &&
        typeof field.isPublishableNow === "boolean"
          ? field.isPublishableNow
          : false,
      aiDetectable: true,
      currentModelSource: "DataDesa",
      sourceRequirement: undefined,
      validationRequirement: undefined,
      deferredReason:
        typeof field === "object" &&
        field !== null &&
        "isPublishableNow" in field &&
        field.isPublishableNow === true
          ? null
          : "Belum diaktifkan untuk template ini.",
    }),
  );
}

interface VersionsPayload {
  versions?: VersionRow[];
  auditEvents?: AuditRow[];
  total?: number;
}

interface DesaDataPayload {
  desa?: DesaRow[];
  total?: number;
}

const TEMPLATE_WORKSPACE_CACHE_MS = 750;
const templateWorkspaceInflight = new Map<string, Promise<TemplateWorkspaceData>>();
const templateWorkspaceRecent = new Map<
  string,
  { createdAt: number; payload: TemplateWorkspaceData }
>();

function templateWorkspaceCacheKey(templateId?: string | null) {
  return templateId ?? "__default__";
}

function clearTemplateWorkspaceClientCache() {
  templateWorkspaceInflight.clear();
  templateWorkspaceRecent.clear();
}

export interface DesaOptionPayload {
  id: string;
  nama: string;
  slug: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}

function buildFilterParams(filter: AdminDesaFilter, page?: number) {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.provinsi) params.set("provinsi", filter.provinsi);
  if (filter.kabupaten) params.set("kabupaten", filter.kabupaten);
  if (filter.kecamatan) params.set("kecamatan", filter.kecamatan);
  if (page) params.set("page", String(page));
  return params;
}

function normalizeFieldStandards(payload: FieldStandardsPayload): FieldStandardsData {
  if (payload.source === "db" && payload.visibleComponents) {
    const sections = payload.visibleComponents.map((component) => ({
      sectionKey: component.componentKey,
      sectionLabel: component.label,
      fields: toDbFieldArray(component.fields, component),
    }));

    return {
      templateKey: payload.templateKey,
      templateName: payload.templateName,
      source: "db",
      totalFields: payload.totalFields,
      publishableCount: payload.publishableCount,
      sections,
      holdCount: payload.holdCount ?? payload.totalFields - payload.publishableCount,
      visibleComponents: payload.visibleComponents.map((component) => ({
        componentId: component.componentId,
        componentKey: component.componentKey,
        label: component.label,
        displayOrder: component.displayOrder,
        fields: toDbFieldArray(component.fields, component).map((field) => ({
          fieldKey: field.fieldKey,
          label: field.fieldLabel,
          valueType: "unknown",
          isPublishableNow: field.publishableNow,
          componentKey: field.sectionKey,
          componentLabel: field.sectionLabel,
        })),
      })),
    };
  }

  return payload as FieldStandardsData;
}

function normalizeDesaComponentData(payload: FieldStandardsPayload): DesaComponentData {
  if (payload.source === "db" && payload.visibleComponents) {
    return {
      templateKey: payload.templateKey,
      templateName: payload.templateName,
      source: "db",
      visibleComponents: payload.visibleComponents.map((component) => ({
        componentId: component.componentId,
        componentKey: component.componentKey,
        label: component.label,
        displayOrder: component.displayOrder,
        isVisible: component.isVisible ?? true,
        fieldCount:
          component.fieldCount ??
          component.totalFieldCount ??
          (Array.isArray(component.fields) ? component.fields.length : 0),
        filledFieldCount: component.filledFieldCount ?? 0,
        totalFieldCount:
          component.totalFieldCount ??
          component.fieldCount ??
          (Array.isArray(component.fields) ? component.fields.length : 0),
        completionStatus: component.completionStatus ?? "empty",
        filledFieldLabels: component.filledFieldLabels ?? [],
        missingFieldLabels: component.missingFieldLabels ?? [],
        teaserLabels: component.teaserLabels ?? [],
        derivedSignals: component.derivedSignals ?? [],
      })),
      hiddenComponents: (payload.hiddenComponents ?? []).map((component) => ({
        componentId: component.componentId,
        componentKey: component.componentKey,
        label: component.label,
        displayOrder: component.displayOrder,
        isVisible: component.isVisible ?? false,
        fieldCount:
          component.fieldCount ??
          component.totalFieldCount ??
          (Array.isArray(component.fields) ? component.fields.length : 0),
        filledFieldCount: component.filledFieldCount ?? 0,
        totalFieldCount:
          component.totalFieldCount ??
          component.fieldCount ??
          (Array.isArray(component.fields) ? component.fields.length : 0),
        completionStatus: component.completionStatus ?? "empty",
        filledFieldLabels: component.filledFieldLabels ?? [],
        missingFieldLabels: component.missingFieldLabels ?? [],
        teaserLabels: component.teaserLabels ?? [],
        derivedSignals: component.derivedSignals ?? [],
      })),
      totalFields: payload.totalFields,
      publishableCount: payload.publishableCount,
      filledFieldCount: payload.filledFieldCount ?? 0,
      filledSignalCount: payload.filledSignalCount ?? 0,
      totalSignalCount: payload.totalSignalCount ?? 0,
      mismatchPublishedFieldCount: payload.mismatchPublishedFieldCount ?? 0,
    };
  }

  const visibleComponents = (payload.sections ?? []).map((section, index) => {
    const totalFieldCount = Array.isArray(section.fields) ? section.fields.length : 0;
    return {
      componentId: `fallback-${section.sectionKey}`,
      componentKey: section.sectionKey,
      label: section.sectionLabel,
      displayOrder: index + 1,
      isVisible: true,
      fieldCount: totalFieldCount,
      filledFieldCount: 0,
      totalFieldCount,
      completionStatus: "empty" as const,
      filledFieldLabels: [],
      missingFieldLabels: [],
      teaserLabels: [],
      derivedSignals: [],
    };
  });

  return {
    templateKey: payload.templateKey,
    templateName: payload.templateName,
    source: "fallback",
    visibleComponents,
    hiddenComponents: [],
    totalFields: payload.totalFields,
    publishableCount: payload.publishableCount,
    filledFieldCount: 0,
    filledSignalCount: 0,
    totalSignalCount: 0,
    mismatchPublishedFieldCount: 0,
  };
}

export async function fetchFieldStandards(): Promise<FieldStandardsData> {
  const response = await fetch("/api/internal-admin/village-data/field-standards");
  if (!response.ok) {
    throw new Error("Gagal memuat standar field.");
  }

  return normalizeFieldStandards((await response.json()) as FieldStandardsPayload);
}

export async function fetchDesaComponentData(desaId: string): Promise<DesaComponentData> {
  const response = await fetch(
    `/api/internal-admin/village-data/field-standards?desaId=${encodeURIComponent(desaId)}`,
  );
  if (!response.ok) {
    throw new Error("Gagal memuat visibilitas komponen.");
  }

  return normalizeDesaComponentData((await response.json()) as FieldStandardsPayload);
}

export async function saveComponentVisibility(input: {
  desaId: string;
  componentId: string;
  isVisible: boolean;
}): Promise<void> {
  const response = await fetch("/api/internal-admin/village-data/component-visibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Gagal memperbarui visibilitas komponen.");
  }
}

export async function fetchDesaData(
  filter: AdminDesaFilter,
  page: number,
): Promise<Required<DesaDataPayload>> {
  const response = await fetch(
    `/api/internal-admin/village-data/desa-data?${buildFilterParams(filter, page).toString()}`,
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Gagal memuat data desa.");
  }

  const payload = (await response.json()) as DesaDataPayload;
  return {
    desa: payload.desa ?? [],
    total: payload.total ?? 0,
  };
}

export async function fetchVersionsData(
  filter: AdminDesaFilter,
  extra?: { pageSize?: number },
): Promise<Required<VersionsPayload>> {
  const params = buildFilterParams(filter);
  if (extra?.pageSize) params.set("pageSize", String(extra.pageSize));

  const response = await fetch(`/api/internal-admin/village-data/versions?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Gagal memuat riwayat versi.");
  }

  const payload = (await response.json()) as VersionsPayload;
  return {
    versions: payload.versions ?? [],
    auditEvents: payload.auditEvents ?? [],
    total: payload.total ?? 0,
  };
}

export async function fetchDesaSearchOptions(query: string): Promise<DesaOptionPayload[]> {
  const response = await fetch(
    `/api/internal-admin/desa-options?q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error("Gagal memuat opsi desa.");
  }
  const payload = (await response.json()) as { desa?: DesaOptionPayload[] };
  return payload.desa ?? [];
}

export async function fetchTemplateFields(desaId: string): Promise<TemplateFieldEngineViewModel> {
  const response = await fetch(
    `/api/internal-admin/village-data/template-fields?desaId=${encodeURIComponent(desaId)}`,
  );
  if (!response.ok) {
    throw new Error("Gagal memuat field template desa.");
  }
  return (await response.json()) as TemplateFieldEngineViewModel;
}

export async function fetchTemplateWorkspace(
  templateId?: string | null,
): Promise<TemplateWorkspaceData> {
  const cacheKey = templateWorkspaceCacheKey(templateId);
  const recent = templateWorkspaceRecent.get(cacheKey);
  if (recent && Date.now() - recent.createdAt < TEMPLATE_WORKSPACE_CACHE_MS) {
    return recent.payload;
  }

  const inflight = templateWorkspaceInflight.get(cacheKey);
  if (inflight) return inflight;

  const params = new URLSearchParams();
  if (templateId) params.set("templateId", templateId);

  const request = fetch(
    `/api/internal-admin/village-data/templates${params.size ? `?${params.toString()}` : ""}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Gagal memuat workspace template.");
      }
      const payload = (await response.json()) as TemplateWorkspaceData;
      templateWorkspaceRecent.set(cacheKey, { createdAt: Date.now(), payload });
      return payload;
    })
    .finally(() => {
      templateWorkspaceInflight.delete(cacheKey);
    });

  templateWorkspaceInflight.set(cacheKey, request);
  return request;
}

export async function createTemplateWorkspace(input: {
  name: string;
  description?: string;
}): Promise<{ templateId: string; message: string }> {
  const response = await fetch("/api/internal-admin/village-data/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | { templateId?: string; message?: string; error?: string }
    | null;

  if (!response.ok || !payload?.templateId || !payload.message) {
    throw new Error(payload?.error ?? "Gagal membuat template.");
  }

  clearTemplateWorkspaceClientCache();
  return { templateId: payload.templateId, message: payload.message };
}

export async function updateTemplateWorkspaceMeta(input: {
  templateId: string;
  name: string;
  description?: string | null;
}): Promise<{ templateId: string; message: string }> {
  const response = await fetch(
    `/api/internal-admin/village-data/templates/${encodeURIComponent(input.templateId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        description: input.description ?? null,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { templateId?: string; message?: string; error?: string }
    | null;

  if (!response.ok || !payload?.templateId || !payload.message) {
    throw new Error(payload?.error ?? "Gagal memperbarui template.");
  }

  clearTemplateWorkspaceClientCache();
  return { templateId: payload.templateId, message: payload.message };
}

export async function saveTemplateWorkspaceComponents(input: {
  templateId: string;
  componentKeys: string[];
}): Promise<{ templateId: string; message: string }> {
  const response = await fetch(
    `/api/internal-admin/village-data/templates/${encodeURIComponent(input.templateId)}/components`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentKeys: input.componentKeys }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { templateId?: string; message?: string; error?: string }
    | null;

  if (!response.ok || !payload?.templateId || !payload.message) {
    throw new Error(payload?.error ?? "Gagal menyimpan komponen template.");
  }

  clearTemplateWorkspaceClientCache();
  return { templateId: payload.templateId, message: payload.message };
}

export async function deleteTemplateWorkspace(
  templateId: string,
): Promise<{ templateId: string; message: string }> {
  const response = await fetch(
    `/api/internal-admin/village-data/templates/${encodeURIComponent(templateId)}`,
    {
      method: "DELETE",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { templateId?: string; message?: string; error?: string }
    | null;

  if (!response.ok || !payload?.templateId || !payload.message) {
    throw new Error(payload?.error ?? "Gagal menghapus template.");
  }

  clearTemplateWorkspaceClientCache();
  return { templateId: payload.templateId, message: payload.message };
}

export async function switchDesaTemplate(input: {
  desaId: string;
  templateId: string;
}): Promise<{ templateId: string; message: string }> {
  const response = await fetch("/api/internal-admin/village-data/template-assignment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | { templateId?: string; message?: string; error?: string }
    | null;

  if (!response.ok || !payload?.templateId || !payload.message) {
    throw new Error(payload?.error ?? "Gagal mengganti template desa.");
  }

  return { templateId: payload.templateId, message: payload.message };
}
