import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma";
import { AI_MAPPABLE_DESA_FIELDS, type AiMappableDesaField } from "@/lib/admin-claim/ai-mapping";
import { db } from "@/lib/db";
import {
  getChangedVersionFields,
  normalizeVersionSnapshot,
  type DesaVersionSnapshot,
} from "@/lib/versioning/desa-versioning";

type SqlExecutor = {
  $queryRaw<T = unknown>(query: Prisma.Sql): Promise<T>;
  $executeRaw(query: Prisma.Sql): Promise<number>;
};

type TableAvailabilityReason = "db_unavailable" | "table_missing" | "not_found" | "query_failed";

export type PersistedVillageDataVersionStatus =
  | "REVIEW_READY"
  | "PUBLISHED"
  | "REPLACED"
  | "REJECTED"
  | "FAILED";

export interface PersistedVillageDataVersion {
  id: string;
  desaId: string;
  sourceDocumentId: string | null;
  versionNumber: number;
  status: PersistedVillageDataVersionStatus;
  title: string;
  sourceLabel: string | null;
  reviewNote: string | null;
  changedFields: AiMappableDesaField[];
  proposedSnapshot: DesaVersionSnapshot;
  beforeSnapshot: DesaVersionSnapshot;
  publishedSnapshot: DesaVersionSnapshot;
  createdByUserId: string | null;
  publishedByUserId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesaDataAuditEventRecord {
  id: string;
  desaId: string;
  sourceDocumentId: string | null;
  villageDataVersionId: string | null;
  actorUserId: string | null;
  actorRole: string | null;
  eventType: string;
  eventLabel: string | null;
  previousStatus: string | null;
  nextStatus: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface VersionRow {
  id: string;
  desaId: string;
  sourceDocumentId: string | null;
  versionNumber: number;
  status: string;
  title: string;
  sourceLabel: string | null;
  reviewNote: string | null;
  changedFields: string[] | null;
  proposedSnapshotJson: unknown;
  beforeSnapshotJson: unknown;
  publishedSnapshotJson: unknown;
  createdByUserId: string | null;
  publishedByUserId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditRow {
  id: string;
  desaId: string;
  sourceDocumentId: string | null;
  villageDataVersionId: string | null;
  actorUserId: string | null;
  actorRole: string | null;
  eventType: string;
  eventLabel: string | null;
  previousStatus: string | null;
  nextStatus: string | null;
  note: string | null;
  metadata: unknown;
  createdAt: Date;
}

const VERSION_TABLE = "village_data_versions";
const AUDIT_TABLE = "desa_data_audit_events";

function getExecutor(executor?: SqlExecutor | null): SqlExecutor | null {
  return executor ?? db ?? null;
}

function createStoreId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function toTextArraySql(values: readonly string[]): Prisma.Sql {
  return values.length
    ? Prisma.sql`ARRAY[${Prisma.join(values)}]::TEXT[]`
    : Prisma.sql`ARRAY[]::TEXT[]`;
}

function toJsonbSql(value: unknown): Prisma.Sql {
  return Prisma.sql`CAST(${JSON.stringify(value ?? null)} AS JSONB)`;
}

function toNullableJsonbSql(value: unknown): Prisma.Sql {
  return value === null || value === undefined ? Prisma.sql`NULL` : toJsonbSql(value);
}

function asAuditMetadata(input: unknown): Record<string, unknown> | null {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

function normalizeChangedFields(input: readonly string[] | null | undefined): AiMappableDesaField[] {
  return (input ?? []).filter(
    (field): field is AiMappableDesaField =>
      (AI_MAPPABLE_DESA_FIELDS as readonly string[]).includes(field),
  );
}

function mapVersionRow(row: VersionRow): PersistedVillageDataVersion {
  return {
    id: row.id,
    desaId: row.desaId,
    sourceDocumentId: row.sourceDocumentId,
    versionNumber: row.versionNumber,
    status:
      row.status === "FAILED" || row.status === "REPLACED" || row.status === "REJECTED"
        ? row.status
        : row.status === "PUBLISHED"
        ? "PUBLISHED"
        : "REVIEW_READY",
    title: row.title,
    sourceLabel: row.sourceLabel,
    reviewNote: row.reviewNote,
    changedFields: normalizeChangedFields(row.changedFields),
    proposedSnapshot: normalizeVersionSnapshot(row.proposedSnapshotJson),
    beforeSnapshot: normalizeVersionSnapshot(row.beforeSnapshotJson),
    publishedSnapshot: normalizeVersionSnapshot(row.publishedSnapshotJson),
    createdByUserId: row.createdByUserId,
    publishedByUserId: row.publishedByUserId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAuditRow(row: AuditRow): DesaDataAuditEventRecord {
  return {
    id: row.id,
    desaId: row.desaId,
    sourceDocumentId: row.sourceDocumentId,
    villageDataVersionId: row.villageDataVersionId,
    actorUserId: row.actorUserId,
    actorRole: row.actorRole,
    eventType: row.eventType,
    eventLabel: row.eventLabel,
    previousStatus: row.previousStatus,
    nextStatus: row.nextStatus,
    note: row.note,
    metadata: asAuditMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
  };
}

async function doesTableExist(
  tableName: string,
  executor?: SqlExecutor | null,
): Promise<boolean> {
  const client = getExecutor(executor);
  if (!client) return false;

  try {
    const rows = await client.$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = ${tableName}
      ) AS "exists"
    `);

    return rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}

async function findVersionBySourceDocumentId(
  sourceDocumentId: string,
  executor?: SqlExecutor | null,
): Promise<PersistedVillageDataVersion | null> {
  const client = getExecutor(executor);
  if (!client) return null;

  const rows = await client.$queryRaw<VersionRow[]>(Prisma.sql`
    SELECT
      "id",
      "desaId",
      "sourceDocumentId",
      "versionNumber",
      "status",
      "title",
      "sourceLabel",
      "reviewNote",
      "changedFields",
      "proposedSnapshotJson",
      "beforeSnapshotJson",
      "publishedSnapshotJson",
      "createdByUserId",
      "publishedByUserId",
      "publishedAt",
      "createdAt",
      "updatedAt"
    FROM "village_data_versions"
    WHERE "sourceDocumentId" = ${sourceDocumentId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `);

  return rows[0] ? mapVersionRow(rows[0]) : null;
}

async function getNextVersionNumberFromTable(
  desaId: string,
  executor?: SqlExecutor | null,
): Promise<number> {
  const client = getExecutor(executor);
  if (!client) return 1;

  const rows = await client.$queryRaw<Array<{ nextVersionNumber: number | bigint | null }>>(
    Prisma.sql`
      SELECT COALESCE(MAX("versionNumber"), 0) + 1 AS "nextVersionNumber"
      FROM "village_data_versions"
      WHERE "desaId" = ${desaId}
    `,
  );

  const value = rows[0]?.nextVersionNumber;
  if (typeof value === "bigint") return Number(value);
  return typeof value === "number" && Number.isFinite(value) ? value : 1;
}

export async function hasVillageVersionTable(executor?: SqlExecutor | null): Promise<boolean> {
  return doesTableExist(VERSION_TABLE, executor);
}

export async function hasDesaDataAuditTable(executor?: SqlExecutor | null): Promise<boolean> {
  return doesTableExist(AUDIT_TABLE, executor);
}

export async function syncReviewReadyVillageVersion(
  input: {
    desaId: string;
    sourceDocumentId: string;
    title: string;
    sourceLabel?: string | null;
    reviewNote?: string | null;
    changedFields: AiMappableDesaField[];
    proposedSnapshot: DesaVersionSnapshot;
    beforeSnapshot?: DesaVersionSnapshot | null;
    createdByUserId?: string | null;
  },
  executor?: SqlExecutor | null,
): Promise<{ persisted: boolean; id?: string; versionNumber?: number; reason?: TableAvailabilityReason }> {
  const client = getExecutor(executor);
  if (!client) return { persisted: false, reason: "db_unavailable" };
  if (!(await doesTableExist(VERSION_TABLE, client))) {
    return { persisted: false, reason: "table_missing" };
  }

  try {
    const existing = await findVersionBySourceDocumentId(input.sourceDocumentId, client);
    const id = existing?.id ?? createStoreId("vdv");
    const versionNumber =
      existing?.versionNumber ?? (await getNextVersionNumberFromTable(input.desaId, client));
    const beforeSnapshot = normalizeVersionSnapshot(input.beforeSnapshot);
    const proposedSnapshot = normalizeVersionSnapshot(input.proposedSnapshot);
    const changedFields =
      input.changedFields.length > 0
        ? input.changedFields
        : getChangedVersionFields({ before: beforeSnapshot, after: proposedSnapshot });

    if (existing) {
      await client.$executeRaw(Prisma.sql`
        UPDATE "village_data_versions"
        SET
          "status" = 'REVIEW_READY',
          "title" = ${input.title},
          "sourceLabel" = ${input.sourceLabel ?? null},
          "reviewNote" = ${input.reviewNote ?? null},
          "changedFields" = ${toTextArraySql(changedFields)},
          "proposedSnapshotJson" = ${toJsonbSql(proposedSnapshot)},
          "beforeSnapshotJson" = ${toNullableJsonbSql(beforeSnapshot)},
          "updatedAt" = NOW()
        WHERE "id" = ${id}
      `);
    } else {
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "village_data_versions" (
          "id",
          "desaId",
          "sourceDocumentId",
          "versionNumber",
          "status",
          "title",
          "sourceLabel",
          "reviewNote",
          "changedFields",
          "proposedSnapshotJson",
          "beforeSnapshotJson",
          "createdByUserId",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${input.desaId},
          ${input.sourceDocumentId},
          ${versionNumber},
          'REVIEW_READY',
          ${input.title},
          ${input.sourceLabel ?? null},
          ${input.reviewNote ?? null},
          ${toTextArraySql(changedFields)},
          ${toJsonbSql(proposedSnapshot)},
          ${toNullableJsonbSql(beforeSnapshot)},
          ${input.createdByUserId ?? null},
          NOW(),
          NOW()
        )
      `);
    }

    return { persisted: true, id, versionNumber };
  } catch (error) {
    console.error("[village-version] sync review-ready failed", error);
    return { persisted: false, reason: "query_failed" };
  }
}

export async function publishVillageDataVersion(
  input: {
    desaId: string;
    sourceDocumentId?: string | null;
    title: string;
    sourceLabel?: string | null;
    reviewNote?: string | null;
    changedFields: AiMappableDesaField[];
    proposedSnapshot: DesaVersionSnapshot;
    beforeSnapshot?: DesaVersionSnapshot | null;
    publishedSnapshot: DesaVersionSnapshot;
    createdByUserId?: string | null;
    publishedByUserId?: string | null;
    publishedAt?: Date;
  },
  executor?: SqlExecutor | null,
): Promise<{ persisted: boolean; id?: string; versionNumber?: number; reason?: TableAvailabilityReason }> {
  const client = getExecutor(executor);
  if (!client) return { persisted: false, reason: "db_unavailable" };
  if (!(await doesTableExist(VERSION_TABLE, client))) {
    return { persisted: false, reason: "table_missing" };
  }

  try {
    const existing =
      input.sourceDocumentId ? await findVersionBySourceDocumentId(input.sourceDocumentId, client) : null;
    const id = existing?.id ?? createStoreId("vdv");
    const versionNumber =
      existing?.versionNumber ?? (await getNextVersionNumberFromTable(input.desaId, client));
    const beforeSnapshot =
      Object.keys(normalizeVersionSnapshot(input.beforeSnapshot)).length > 0
        ? normalizeVersionSnapshot(input.beforeSnapshot)
        : existing?.beforeSnapshot ?? {};
    const proposedSnapshot =
      Object.keys(normalizeVersionSnapshot(input.proposedSnapshot)).length > 0
        ? normalizeVersionSnapshot(input.proposedSnapshot)
        : existing?.proposedSnapshot ?? normalizeVersionSnapshot(input.publishedSnapshot);
    const publishedSnapshot = normalizeVersionSnapshot(input.publishedSnapshot);
    const changedFields =
      input.changedFields.length > 0
        ? input.changedFields
        : getChangedVersionFields({ before: beforeSnapshot, after: publishedSnapshot });

    if (existing) {
      await client.$executeRaw(Prisma.sql`
        UPDATE "village_data_versions"
        SET
          "status" = 'PUBLISHED',
          "title" = ${input.title},
          "sourceLabel" = ${input.sourceLabel ?? null},
          "reviewNote" = ${input.reviewNote ?? existing.reviewNote ?? null},
          "changedFields" = ${toTextArraySql(changedFields)},
          "proposedSnapshotJson" = ${toJsonbSql(proposedSnapshot)},
          "beforeSnapshotJson" = ${toNullableJsonbSql(beforeSnapshot)},
          "publishedSnapshotJson" = ${toJsonbSql(publishedSnapshot)},
          "publishedByUserId" = ${input.publishedByUserId ?? null},
          "publishedAt" = ${input.publishedAt ?? new Date()},
          "updatedAt" = NOW()
        WHERE "id" = ${id}
      `);
    } else {
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "village_data_versions" (
          "id",
          "desaId",
          "sourceDocumentId",
          "versionNumber",
          "status",
          "title",
          "sourceLabel",
          "reviewNote",
          "changedFields",
          "proposedSnapshotJson",
          "beforeSnapshotJson",
          "publishedSnapshotJson",
          "createdByUserId",
          "publishedByUserId",
          "publishedAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${input.desaId},
          ${input.sourceDocumentId ?? null},
          ${versionNumber},
          'PUBLISHED',
          ${input.title},
          ${input.sourceLabel ?? null},
          ${input.reviewNote ?? null},
          ${toTextArraySql(changedFields)},
          ${toJsonbSql(proposedSnapshot)},
          ${toNullableJsonbSql(beforeSnapshot)},
          ${toJsonbSql(publishedSnapshot)},
          ${input.createdByUserId ?? null},
          ${input.publishedByUserId ?? null},
          ${input.publishedAt ?? new Date()},
          NOW(),
          NOW()
        )
      `);
    }

    return { persisted: true, id, versionNumber };
  } catch (error) {
    console.error("[village-version] publish failed", error);
    return { persisted: false, reason: "query_failed" };
  }
}

export async function failVillageDataVersionForDocument(
  input: {
    sourceDocumentId: string;
    reason?: string | null;
  },
  executor?: SqlExecutor | null,
): Promise<{ persisted: boolean; id?: string; versionNumber?: number; reason?: TableAvailabilityReason }> {
  const client = getExecutor(executor);
  if (!client) return { persisted: false, reason: "db_unavailable" };
  if (!(await doesTableExist(VERSION_TABLE, client))) {
    return { persisted: false, reason: "table_missing" };
  }

  try {
    const existing = await findVersionBySourceDocumentId(input.sourceDocumentId, client);
    if (!existing) return { persisted: false, reason: "not_found" };

    await client.$executeRaw(Prisma.sql`
      UPDATE "village_data_versions"
      SET
        "status" = 'FAILED',
        "reviewNote" = ${input.reason ?? existing.reviewNote ?? null},
        "updatedAt" = NOW()
      WHERE "id" = ${existing.id}
    `);

    return {
      persisted: true,
      id: existing.id,
      versionNumber: existing.versionNumber,
    };
  } catch (error) {
    console.error("[village-version] mark failed failed", error);
    return { persisted: false, reason: "query_failed" };
  }
}

export async function listPublishedVillageDataVersions(input: {
  desaId: string;
  limit?: number;
}): Promise<{ available: boolean; versions: PersistedVillageDataVersion[] }> {
  const client = getExecutor();
  if (!client || !(await doesTableExist(VERSION_TABLE, client))) {
    return { available: false, versions: [] };
  }

  try {
    const limit = Math.max(1, Math.min(input.limit ?? 10, 50));
    const rows = await client.$queryRaw<VersionRow[]>(Prisma.sql`
      SELECT
        "id",
        "desaId",
        "sourceDocumentId",
        "versionNumber",
        "status",
        "title",
        "sourceLabel",
        "reviewNote",
        "changedFields",
        "proposedSnapshotJson",
        "beforeSnapshotJson",
        "publishedSnapshotJson",
        "createdByUserId",
        "publishedByUserId",
        "publishedAt",
        "createdAt",
        "updatedAt"
      FROM "village_data_versions"
      WHERE "desaId" = ${input.desaId}
        AND "status" = 'PUBLISHED'
      ORDER BY "versionNumber" DESC, "createdAt" DESC
      LIMIT ${limit}
    `);

    return { available: true, versions: rows.map(mapVersionRow) };
  } catch (error) {
    console.error("[village-version] list published versions failed", error);
    return { available: false, versions: [] };
  }
}

export async function writeDesaDataAuditEvent(
  input: {
    desaId: string;
    sourceDocumentId?: string | null;
    villageDataVersionId?: string | null;
    actorUserId?: string | null;
    actorRole?: string | null;
    eventType: string;
    eventLabel?: string | null;
    previousStatus?: string | null;
    nextStatus?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
  },
  executor?: SqlExecutor | null,
): Promise<{ persisted: boolean; id?: string; reason?: TableAvailabilityReason }> {
  const client = getExecutor(executor);
  if (!client) return { persisted: false, reason: "db_unavailable" };
  if (!(await doesTableExist(AUDIT_TABLE, client))) {
    return { persisted: false, reason: "table_missing" };
  }

  const id = createStoreId("dda");

  try {
    await client.$executeRaw(Prisma.sql`
      INSERT INTO "desa_data_audit_events" (
        "id",
        "desaId",
        "sourceDocumentId",
        "villageDataVersionId",
        "actorUserId",
        "actorRole",
        "eventType",
        "eventLabel",
        "previousStatus",
        "nextStatus",
        "note",
        "metadata",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${input.desaId},
        ${input.sourceDocumentId ?? null},
        ${input.villageDataVersionId ?? null},
        ${input.actorUserId ?? null},
        ${input.actorRole ?? null},
        ${input.eventType},
        ${input.eventLabel ?? null},
        ${input.previousStatus ?? null},
        ${input.nextStatus ?? null},
        ${input.note ?? null},
        ${toNullableJsonbSql(input.metadata ?? null)},
        NOW(),
        NOW()
      )
    `);

    return { persisted: true, id };
  } catch (error) {
    console.error("[desa-data-audit] write failed", error);
    return { persisted: false, reason: "query_failed" };
  }
}

export async function listDesaDataAuditEventsForDocuments(input: {
  documentIds: string[];
  limit?: number;
}): Promise<{ available: boolean; events: DesaDataAuditEventRecord[] }> {
  const client = getExecutor();
  if (!client || input.documentIds.length === 0 || !(await doesTableExist(AUDIT_TABLE, client))) {
    return { available: false, events: [] };
  }

  try {
    const limit = Math.max(1, Math.min(input.limit ?? 12, 50));
    const rows = await client.$queryRaw<AuditRow[]>(Prisma.sql`
      SELECT
        "id",
        "desaId",
        "sourceDocumentId",
        "villageDataVersionId",
        "actorUserId",
        "actorRole",
        "eventType",
        "eventLabel",
        "previousStatus",
        "nextStatus",
        "note",
        "metadata",
        "createdAt"
      FROM "desa_data_audit_events"
      WHERE "sourceDocumentId" IN (${Prisma.join(input.documentIds)})
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `);

    return { available: true, events: rows.map(mapAuditRow) };
  } catch (error) {
    console.error("[desa-data-audit] list events failed", error);
    return { available: false, events: [] };
  }
}
