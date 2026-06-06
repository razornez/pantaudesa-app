import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const HISTORY_EVENT_TYPES = [
  "INTERNAL_INTAKE_SUBMITTED",
  "INTERNAL_AI_MAPPING_RUN",
  "INTERNAL_DOCUMENT_REVIEWED",
  "INTERNAL_DATA_PUBLISHED",
  "INTERNAL_DOCUMENT_FAILED",
] as const;

type DesaOptionRow = {
  id: string;
  nama: string;
  slug: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
};

type UserRoleRow = {
  role: string | null;
};

type DocumentRow = {
  id: string;
  desaId: string;
  uploadedById: string | null;
  title: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: "WAITING_VERIFIED_APPROVAL" | "PROCESSING" | "PUBLISHED" | "REJECTED" | "FAILED";
  approvedAt: string | null;
  publishedAt: string | null;
  failedReason: string | null;
  rejectedReason: string | null;
  aiMappingStatus: string | null;
  aiMappingResult: unknown;
  createdAt: string;
  updatedAt: string;
};

type DesaRow = {
  id: string;
  nama: string;
  kecamatan: string;
  kabupaten: string;
  dataPublishedAt?: string | null;
  dataSourceLabel?: string | null;
};

type UserRow = {
  id: string;
  nama: string | null;
  username: string | null;
  email: string;
};

type QueueDocumentFallback = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: "WAITING_VERIFIED_APPROVAL" | "PROCESSING" | "PUBLISHED" | "REJECTED" | "FAILED";
  approvedAt: string | null;
  publishedAt: string | null;
  failedReason: string | null;
  rejectedReason: string | null;
  aiMappingStatus: string | null;
  aiMappingResult: unknown;
  createdAt: string;
  updatedAt: string;
  desa: { id: string; nama: string; kecamatan: string; kabupaten: string };
  uploadedBy: { id: string; nama: string | null; username: string | null; email: string } | null;
};

type AuditRow = {
  id: string;
  entityId: string | null;
  eventType: string;
  nextStatus: string | null;
  reasonText: string | null;
  metadata: unknown;
  createdAt: string;
  desaId?: string | null;
  beforeSnapshotJson?: unknown;
  afterSnapshotJson?: unknown;
};

function requireClient() {
  const client = getSupabaseAdminClient();
  if (!client) throw new Error("Supabase admin fallback belum terkonfigurasi.");
  return client;
}

function lower(value: string | null | undefined): string {
  return value?.toLowerCase() ?? "";
}

function uniq(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export async function getDesaFilterOptionsViaSupabase(input: {
  provinsi: string;
  kabupaten: string;
}) {
  const client = requireClient();
  const { data, error } = await client
    .from("desa")
    .select("id,nama,slug,kecamatan,kabupaten,provinsi")
    .order("provinsi", { ascending: true })
    .order("kabupaten", { ascending: true })
    .order("kecamatan", { ascending: true })
    .returns<DesaOptionRow[]>();

  if (error) throw error;

  const rows = data ?? [];
  const filteredKabupaten = input.provinsi
    ? rows.filter((row) => lower(row.provinsi) === lower(input.provinsi))
    : rows;
  const filteredKecamatan = rows.filter((row) => {
    if (input.provinsi && lower(row.provinsi) !== lower(input.provinsi)) return false;
    if (input.kabupaten && lower(row.kabupaten) !== lower(input.kabupaten)) return false;
    return true;
  });

  return {
    provinsi: uniq(rows.map((row) => row.provinsi)).sort((a, b) => a.localeCompare(b, "id")),
    kabupaten: uniq(filteredKabupaten.map((row) => row.kabupaten)).sort((a, b) => a.localeCompare(b, "id")),
    kecamatan: uniq(filteredKecamatan.map((row) => row.kecamatan)).sort((a, b) => a.localeCompare(b, "id")),
  };
}

export async function getInternalAdminRoleViaSupabase(userId: string): Promise<string | null> {
  const client = requireClient();
  const { data, error } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle<UserRoleRow>();

  if (error) throw error;
  return data?.role ?? null;
}

export async function searchDesaOptionsViaSupabase(query: string, take: number) {
  const client = requireClient();
  const { data, error } = await client
    .from("desa")
    .select("id,nama,slug,kecamatan,kabupaten,provinsi")
    .order("nama", { ascending: true })
    .limit(Math.max(take * 4, 50))
    .returns<DesaOptionRow[]>();

  if (error) throw error;

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? (data ?? []).filter((item) => {
        const haystack = [
          item.nama,
          item.slug,
          item.kecamatan,
          item.kabupaten,
          item.provinsi,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalized);
      })
    : (data ?? []);

  return filtered.slice(0, take);
}

async function getDesaMapByIds(desaIds: string[]) {
  const client = requireClient();
  if (desaIds.length === 0) return new Map<string, DesaRow>();

  const { data, error } = await client
    .from("desa")
    .select("id,nama,kecamatan,kabupaten,dataPublishedAt,dataSourceLabel")
    .in("id", desaIds)
    .returns<DesaRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((item) => [item.id, item]));
}

async function getUserMapByIds(userIds: string[]) {
  const client = requireClient();
  if (userIds.length === 0) return new Map<string, UserRow>();

  const { data, error } = await client
    .from("users")
    .select("id,nama,username,email")
    .in("id", userIds)
    .returns<UserRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((item) => [item.id, item]));
}

export async function listInternalDocumentsViaSupabase(
  statusFilter?: string | null,
): Promise<QueueDocumentFallback[]> {
  const client = requireClient();

  let query = client
    .from("admin_desa_documents")
    .select(
      "id,desaId,uploadedById,title,category,fileName,fileType,fileSize,status,approvedAt,publishedAt,failedReason,rejectedReason,aiMappingStatus,aiMappingResult,createdAt,updatedAt",
    )
    .order("status", { ascending: true })
    .order("updatedAt", { ascending: false })
    .limit(100);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query.returns<DocumentRow[]>();
  if (error) throw error;

  const rows = data ?? [];
  const desaMap = await getDesaMapByIds(uniq(rows.map((item) => item.desaId)));
  const userMap = await getUserMapByIds(uniq(rows.map((item) => item.uploadedById)));

  return rows.map((item) => ({
    ...item,
    approvedAt: item.approvedAt,
    publishedAt: item.publishedAt,
    desa: desaMap.get(item.desaId)
      ? {
          id: desaMap.get(item.desaId)!.id,
          nama: desaMap.get(item.desaId)!.nama,
          kecamatan: desaMap.get(item.desaId)!.kecamatan,
          kabupaten: desaMap.get(item.desaId)!.kabupaten,
        }
      : {
          id: item.desaId,
          nama: "Desa",
          kecamatan: "-",
          kabupaten: "-",
        },
    uploadedBy: item.uploadedById && userMap.get(item.uploadedById)
      ? {
          id: userMap.get(item.uploadedById)!.id,
          nama: userMap.get(item.uploadedById)!.nama,
          username: userMap.get(item.uploadedById)!.username,
          email: userMap.get(item.uploadedById)!.email,
        }
      : null,
  }));
}

export async function getIntakeHistoryViaSupabase() {
  const client = requireClient();
  const { data: submissions, error: submissionError } = await client
    .from("admin_desa_documents")
    .select(
      "id,title,status,aiMappingStatus,fileName,fileType,fileSize,failedReason,rejectedReason,publishedAt,createdAt,updatedAt,desaId",
    )
    .eq("category", "intake_workbench")
    .order("updatedAt", { ascending: false })
    .order("createdAt", { ascending: false })
    .limit(8)
    .returns<Array<DocumentRow & { desaId: string }>>();

  if (submissionError) throw submissionError;

  const submissionRows = submissions ?? [];
  const desaMap = await getDesaMapByIds(uniq(submissionRows.map((item) => item.desaId)));
  const submissionIds = submissionRows.map((item) => item.id);

  let activityRows: AuditRow[] = [];
  if (submissionIds.length > 0) {
    const { data: audits, error: auditError } = await client
      .from("admin_claim_audits")
      .select("id,entityId,eventType,nextStatus,reasonText,metadata,createdAt")
      .eq("entityType", "AdminDesaDocument")
      .in("entityId", submissionIds)
      .in("eventType", [...HISTORY_EVENT_TYPES])
      .order("createdAt", { ascending: false })
      .limit(12)
      .returns<AuditRow[]>();

    if (auditError) throw auditError;
    activityRows = audits ?? [];
  }

  const titleById = new Map(submissionRows.map((item) => [item.id, item.title]));
  const desaNameById = new Map(
    submissionRows.map((item) => [item.id, desaMap.get(item.desaId)?.nama ?? "Desa"]),
  );

  return {
    storage: {
      mode: "audit_fallback",
      dedicatedTableActive: false,
      note:
        "Aktivitas intake dibaca lewat Supabase Data API fallback karena koneksi Prisma lokal ke pooler sedang gagal.",
    },
    submissions: submissionRows.map((item) => ({
      ...item,
      desa: desaMap.get(item.desaId)
        ? {
            id: desaMap.get(item.desaId)!.id,
            nama: desaMap.get(item.desaId)!.nama,
            kabupaten: desaMap.get(item.desaId)!.kabupaten,
          }
        : { id: item.desaId, nama: "Desa", kabupaten: "" },
    })),
    activity: activityRows.map((item) => ({
      id: item.id,
      documentId: item.entityId,
      title: item.entityId ? titleById.get(item.entityId) ?? "Dokumen intake" : "Dokumen intake",
      desaName: item.entityId ? desaNameById.get(item.entityId) ?? "Desa" : "Desa",
      eventType: item.eventType,
      label: item.eventType,
      nextStatus: item.nextStatus ?? null,
      reasonText: item.reasonText ?? null,
      createdAt: item.createdAt,
    })),
  };
}

export async function getDesaVersionHistoryViaSupabase(desaId: string) {
  const client = requireClient();

  const { data: desa, error: desaError } = await client
    .from("desa")
    .select("id,nama,kabupaten,dataPublishedAt,dataSourceLabel")
    .eq("id", desaId)
    .maybeSingle<DesaRow>();

  if (desaError) throw desaError;
  if (!desa) return null;

  const { data: audits, error: auditError } = await client
    .from("admin_claim_audits")
    .select("id,entityId,eventType,reasonText,metadata,createdAt,beforeSnapshotJson,afterSnapshotJson")
    .eq("desaId", desaId)
    .eq("eventType", "INTERNAL_DATA_PUBLISHED")
    .order("createdAt", { ascending: false })
    .limit(10)
    .returns<AuditRow[]>();

  if (auditError) throw auditError;

  return {
    storage: {
      mode: "audit_fallback",
      dedicatedTableActive: false,
      note:
        "Riwayat versi dibaca lewat Supabase Data API fallback karena koneksi Prisma lokal ke pooler sedang gagal.",
    },
    desa,
    audits: audits ?? [],
  };
}

export async function listClaimsSummaryViaSupabase() {
  const client = requireClient();
  const { count, error } = await client
    .from("desa_admin_claims")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function listRenewalsSummaryViaSupabase() {
  const client = requireClient();
  const { count, error } = await client
    .from("desa_admin_members")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export function matchesSearch(item: DesaOptionRow, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [item.nama, item.slug, item.kecamatan, item.kabupaten, item.provinsi]
    .map((value) => lower(value))
    .some((value) => value.includes(normalized));
}
