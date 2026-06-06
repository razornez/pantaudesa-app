import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  DashboardRankingRepositoryPayload,
  DashboardSummaryRepositoryPayload,
} from "./dashboard-repository";

type DesaRow = DashboardSummaryRepositoryPayload["desaRows"][number];
type PublishedFieldRow = DashboardSummaryRepositoryPayload["publishedFieldRows"][number];
type MemberRow = DashboardSummaryRepositoryPayload["memberRows"][number];
type DocumentRow = DashboardSummaryRepositoryPayload["documentRows"][number];
type VoiceRow = DashboardSummaryRepositoryPayload["voiceRows"][number];
type ComponentCatalogRow = DashboardSummaryRepositoryPayload["componentCatalogRows"][number];

type DesaApiRow = {
  id: string;
  nama: string;
  slug: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  dataStatus: string;
  dataPublishedAt: string | null;
};

type DataDesaApiRow = {
  desaId: string;
  sourceId: string | null;
  componentId: string;
  status: string;
  isActive: boolean;
};

type MemberApiRow = {
  desaId: string;
  status: string;
  revokedAt: string | null;
};

type DocumentApiRow = {
  desaId: string;
  status: string;
};

type VoiceApiRow = {
  desaId: string;
  status: string;
};

type ComponentApiRow = {
  id: string;
  templateId: string;
  componentKey: string;
  label: string;
  isDefaultVisible: boolean;
  status: string;
};

type FieldStandardApiRow = {
  id: string;
  componentId: string;
  status: string;
};

type AssignmentApiRow = {
  desaId: string;
  templateId: string;
  isActive: boolean;
};

type VisibilityApiRow = {
  desaId: string;
  componentId: string;
  isVisible: boolean;
};

function requireClient() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin fallback belum terkonfigurasi.");
  }
  return client;
}

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

function mapDesaRows(rows: DesaApiRow[]): DesaRow[] {
  return rows.map((row) => ({
    ...row,
    dataPublishedAt: toDate(row.dataPublishedAt),
  }));
}

function buildComponentMaps(components: ComponentApiRow[], fieldStandards: FieldStandardApiRow[]) {
  const componentById = new Map(components.map((row) => [row.id, row]));
  const fieldCountByComponentId = new Map<string, number>();

  for (const row of fieldStandards) {
    if (row.status !== "ACTIVE") continue;
    fieldCountByComponentId.set(
      row.componentId,
      (fieldCountByComponentId.get(row.componentId) ?? 0) + 1,
    );
  }

  return { componentById, fieldCountByComponentId };
}

async function readCommonDashboardRows() {
  const client = requireClient();

  const [
    desaResult,
    dataDesaResult,
    memberResult,
    documentResult,
    voiceResult,
    componentResult,
    fieldStandardResult,
  ] = await Promise.all([
    client
      .from("desa")
      .select("id,nama,slug,provinsi,kabupaten,kecamatan,dataStatus,dataPublishedAt")
      .returns<DesaApiRow[]>(),
    client
      .from("data_desa")
      .select("desaId,sourceId,componentId,status,isActive")
      .eq("status", "PUBLISHED")
      .eq("isActive", true)
      .returns<DataDesaApiRow[]>(),
    client
      .from("desa_admin_members")
      .select("desaId,status,revokedAt")
      .in("status", ["LIMITED", "VERIFIED"])
      .is("revokedAt", null)
      .returns<MemberApiRow[]>(),
    client
      .from("admin_desa_documents")
      .select("desaId,status")
      .returns<DocumentApiRow[]>(),
    client
      .from("voice")
      .select("desaId,status")
      .returns<VoiceApiRow[]>(),
    client
      .from("village_detail_components")
      .select("id,templateId,componentKey,label,isDefaultVisible,status")
      .eq("status", "ACTIVE")
      .returns<ComponentApiRow[]>(),
    client
      .from("detail_field_standards")
      .select("id,componentId,status")
      .eq("status", "ACTIVE")
      .returns<FieldStandardApiRow[]>(),
  ]);

  for (const result of [
    desaResult,
    dataDesaResult,
    memberResult,
    documentResult,
    voiceResult,
    componentResult,
    fieldStandardResult,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    desaRows: mapDesaRows(desaResult.data ?? []),
    dataDesaRows: dataDesaResult.data ?? [],
    memberRows: (memberResult.data ?? []).map<MemberRow>((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    documentRows: (documentResult.data ?? []).map<DocumentRow>((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    voiceRows: (voiceResult.data ?? []).map<VoiceRow>((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    componentRows: componentResult.data ?? [],
    fieldStandardRows: fieldStandardResult.data ?? [],
  };
}

export async function readDashboardSummaryRepositoryPayloadViaSupabase(): Promise<DashboardSummaryRepositoryPayload> {
  const common = await readCommonDashboardRows();
  const { componentById, fieldCountByComponentId } = buildComponentMaps(
    common.componentRows,
    common.fieldStandardRows,
  );

  const publishedFieldRows: PublishedFieldRow[] = common.dataDesaRows
    .map((row) => {
      const component = componentById.get(row.componentId);
      if (!component) return null;
      return {
        desaId: row.desaId,
        sourceId: row.sourceId,
        componentKey: component.componentKey,
        componentLabel: component.label,
      };
    })
    .filter((row): row is PublishedFieldRow => Boolean(row));

  const componentCatalogRows: ComponentCatalogRow[] = common.componentRows.map((row) => ({
    componentKey: row.componentKey,
    label: row.label,
    fieldCount: fieldCountByComponentId.get(row.id) ?? 0,
  }));

  return {
    desaRows: common.desaRows,
    publishedFieldRows,
    memberRows: common.memberRows,
    documentRows: common.documentRows,
    voiceRows: common.voiceRows,
    componentCatalogRows,
  };
}

export async function readDashboardRankingRepositoryPayloadViaSupabase(input: {
  q: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
}): Promise<DashboardRankingRepositoryPayload> {
  const common = await readCommonDashboardRows();
  const normalizedQuery = input.q.trim().toLowerCase();

  const desaRows = common.desaRows.filter((row) => {
    if (normalizedQuery) {
      const haystack = [row.nama, row.kecamatan, row.kabupaten, row.provinsi].join(" ");
      if (!matchesQuery(haystack, normalizedQuery)) return false;
    }

    if (input.provinsi && row.provinsi.toLowerCase() !== input.provinsi.toLowerCase()) return false;
    if (input.kabupaten && row.kabupaten.toLowerCase() !== input.kabupaten.toLowerCase()) return false;
    if (input.kecamatan && row.kecamatan.toLowerCase() !== input.kecamatan.toLowerCase()) return false;
    return true;
  });

  const desaIds = new Set(desaRows.map((row) => row.id));
  if (desaRows.length === 0) {
    return {
      desaRows: [],
      publishedFieldRows: [],
      memberRows: [],
      documentRows: [],
      voiceRows: [],
      assignments: [],
      overrides: [],
    };
  }

  const client = requireClient();
  const [assignmentResult, visibilityResult] = await Promise.all([
    client
      .from("desa_detail_template_assignments")
      .select("desaId,templateId,isActive")
      .in("desaId", [...desaIds])
      .returns<AssignmentApiRow[]>(),
    client
      .from("desa_detail_component_visibility")
      .select("desaId,componentId,isVisible")
      .in("desaId", [...desaIds])
      .returns<VisibilityApiRow[]>(),
  ]);

  if (assignmentResult.error) throw assignmentResult.error;
  if (visibilityResult.error) throw visibilityResult.error;

  const { componentById, fieldCountByComponentId } = buildComponentMaps(
    common.componentRows,
    common.fieldStandardRows,
  );

  const componentsByTemplateId = new Map<string, ComponentApiRow[]>();
  for (const row of common.componentRows) {
    const bucket = componentsByTemplateId.get(row.templateId) ?? [];
    bucket.push(row);
    componentsByTemplateId.set(row.templateId, bucket);
  }

  const publishedFieldRows: PublishedFieldRow[] = common.dataDesaRows
    .filter((row) => desaIds.has(row.desaId))
    .map((row) => {
      const component = componentById.get(row.componentId);
      if (!component) return null;
      return {
        desaId: row.desaId,
        sourceId: row.sourceId,
        componentKey: component.componentKey,
        componentLabel: component.label,
      };
    })
    .filter((row): row is PublishedFieldRow => Boolean(row));

  return {
    desaRows,
    publishedFieldRows,
    memberRows: common.memberRows.filter((row) => desaIds.has(row.desaId)),
    documentRows: common.documentRows.filter((row) => desaIds.has(row.desaId)),
    voiceRows: common.voiceRows.filter((row) => desaIds.has(row.desaId)),
    assignments: (assignmentResult.data ?? [])
      .filter((row) => row.isActive)
      .map((row) => ({
        desaId: row.desaId,
        components: (componentsByTemplateId.get(row.templateId) ?? []).map((component) => ({
          id: component.id,
          componentKey: component.componentKey,
          label: component.label,
          isDefaultVisible: component.isDefaultVisible,
          fieldCount: fieldCountByComponentId.get(component.id) ?? 0,
        })),
      })),
    overrides: (visibilityResult.data ?? []).map((row) => ({
      desaId: row.desaId,
      componentId: row.componentId,
      isVisible: row.isVisible,
    })),
  };
}
