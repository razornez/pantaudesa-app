import type { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import {
  AI_MAPPABLE_DESA_FIELDS,
  AI_MAPPABLE_DESA_SELECT,
  type AiMappableDesaField,
  type AiMappingFieldValue,
  type AiMappingFields,
} from "@/lib/admin-claim/ai-mapping";

export type DesaVersionSnapshot = Partial<Record<AiMappableDesaField, AiMappingFieldValue>>;
export type VillageDataVersionStatus = "REVIEW_READY" | "PUBLISHED";

export interface VillageDataVersionCandidate {
  schemaVersion: 1;
  status: VillageDataVersionStatus;
  desaId: string;
  createdAt: string;
  changedFields: AiMappableDesaField[];
  baseSnapshot: DesaVersionSnapshot;
  proposedSnapshot: DesaVersionSnapshot;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isVersionFieldValue(input: unknown): input is AiMappingFieldValue {
  return input === null || typeof input === "string" || typeof input === "number";
}

export function normalizeVersionSnapshot(input: unknown): DesaVersionSnapshot {
  if (!isRecord(input)) return {};

  const snapshot: DesaVersionSnapshot = {};
  for (const field of AI_MAPPABLE_DESA_FIELDS) {
    const value = input[field];
    if (isVersionFieldValue(value)) {
      snapshot[field] = value;
    }
  }

  return snapshot;
}

function toVersionSnapshotJson(snapshot: DesaVersionSnapshot): Prisma.InputJsonObject {
  const out: Record<string, Prisma.InputJsonValue | null> = {};
  for (const field of AI_MAPPABLE_DESA_FIELDS) {
    const value = snapshot[field];
    if (value !== undefined) {
      out[field] = value;
    }
  }
  return out;
}

export async function getDesaVersionSnapshot(desaId: string): Promise<DesaVersionSnapshot | null> {
  if (!db) return null;

  try {
    const desa = await db.desa.findUnique({
      where: { id: desaId },
      select: AI_MAPPABLE_DESA_SELECT,
    });

    if (!desa) return null;

    return {
      websiteUrl: desa.websiteUrl ?? null,
      kategori: desa.kategori ?? null,
      tahunData: desa.tahunData ?? null,
      jumlahPenduduk: desa.jumlahPenduduk ?? null,
      kecamatan: desa.kecamatan ?? null,
      kabupaten: desa.kabupaten ?? null,
      provinsi: desa.provinsi ?? null,
    };
  } catch {
    return null;
  }
}

export function getChangedVersionFields(input: {
  before: DesaVersionSnapshot;
  after: DesaVersionSnapshot;
}): AiMappableDesaField[] {
  return AI_MAPPABLE_DESA_FIELDS.filter((field) => {
    const beforeValue = input.before[field];
    const afterValue = input.after[field];
    return beforeValue !== afterValue;
  });
}

export function buildVillageVersionCandidate(input: {
  desaId: string;
  beforeSnapshot: DesaVersionSnapshot;
  mappedFields: AiMappingFields;
  createdAt?: string;
}): VillageDataVersionCandidate {
  const baseSnapshot = normalizeVersionSnapshot(input.beforeSnapshot);
  const proposedUpdates = normalizeVersionSnapshot(input.mappedFields);
  const proposedSnapshot: DesaVersionSnapshot = {
    ...baseSnapshot,
    ...proposedUpdates,
  };

  return {
    schemaVersion: 1,
    status: "REVIEW_READY",
    desaId: input.desaId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    changedFields: getChangedVersionFields({
      before: baseSnapshot,
      after: proposedSnapshot,
    }),
    baseSnapshot,
    proposedSnapshot,
  };
}

export async function buildVillageVersionCandidateForDesa(input: {
  desaId: string;
  mappedFields: AiMappingFields;
  createdAt?: string;
}): Promise<VillageDataVersionCandidate | null> {
  const beforeSnapshot = await getDesaVersionSnapshot(input.desaId);
  if (!beforeSnapshot) return null;

  return buildVillageVersionCandidate({
    desaId: input.desaId,
    beforeSnapshot,
    mappedFields: input.mappedFields,
    createdAt: input.createdAt,
  });
}

export function toVillageVersionCandidateJson(
  candidate: VillageDataVersionCandidate,
): Prisma.InputJsonObject {
  return {
    schemaVersion: candidate.schemaVersion,
    status: candidate.status,
    desaId: candidate.desaId,
    createdAt: candidate.createdAt,
    changedFields: [...candidate.changedFields],
    baseSnapshot: toVersionSnapshotJson(candidate.baseSnapshot),
    proposedSnapshot: toVersionSnapshotJson(candidate.proposedSnapshot),
  };
}

export function readVillageVersionCandidate(input: unknown): VillageDataVersionCandidate | null {
  if (!isRecord(input) || !isRecord(input.versionCandidate)) return null;

  const versionCandidate = input.versionCandidate;
  const desaId =
    typeof versionCandidate.desaId === "string" ? versionCandidate.desaId.trim() : "";
  if (!desaId) return null;

  const status = versionCandidate.status === "PUBLISHED" ? "PUBLISHED" : "REVIEW_READY";
  const changedFields = Array.isArray(versionCandidate.changedFields)
    ? versionCandidate.changedFields.filter(
        (field): field is AiMappableDesaField =>
          typeof field === "string" &&
          (AI_MAPPABLE_DESA_FIELDS as readonly string[]).includes(field),
      )
    : [];

  return {
    schemaVersion: 1,
    status,
    desaId,
    createdAt:
      typeof versionCandidate.createdAt === "string"
        ? versionCandidate.createdAt
        : new Date().toISOString(),
    changedFields,
    baseSnapshot: normalizeVersionSnapshot(versionCandidate.baseSnapshot),
    proposedSnapshot: normalizeVersionSnapshot(versionCandidate.proposedSnapshot),
  };
}

export async function getNextDesaVersionNumber(desaId: string): Promise<number> {
  if (!db) return 1;

  const publishedCount = await db.adminClaimAudit.count({
    where: {
      desaId,
      eventType: "INTERNAL_DATA_PUBLISHED",
    },
  });

  return publishedCount + 1;
}
