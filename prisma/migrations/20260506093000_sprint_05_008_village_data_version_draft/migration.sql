-- Draft migration for Sprint 05-008 Village Data Versioning.
-- Do not apply to production/shared DB without owner approval.

CREATE TYPE "VillageDataVersionStatus" AS ENUM (
  'REVIEW_READY',
  'PUBLISHED',
  'REPLACED',
  'REJECTED',
  'FAILED'
);

CREATE TABLE "village_data_versions" (
  "id"                    TEXT NOT NULL,
  "desaId"                TEXT NOT NULL,
  "sourceDocumentId"      TEXT,
  "versionNumber"         INTEGER NOT NULL,
  "status"                "VillageDataVersionStatus" NOT NULL DEFAULT 'REVIEW_READY',
  "title"                 TEXT NOT NULL,
  "sourceLabel"           TEXT,
  "reviewNote"            TEXT,
  "changedFields"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "proposedSnapshotJson"  JSONB NOT NULL,
  "beforeSnapshotJson"    JSONB,
  "publishedSnapshotJson" JSONB,
  "createdByUserId"       TEXT,
  "publishedByUserId"     TEXT,
  "publishedAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "village_data_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "village_data_versions_desaId_fkey"
    FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "village_data_versions_sourceDocumentId_fkey"
    FOREIGN KEY ("sourceDocumentId") REFERENCES "admin_desa_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "village_data_versions_desaId_versionNumber_key"
  ON "village_data_versions"("desaId", "versionNumber");

CREATE INDEX "village_data_versions_desaId_status_createdAt_idx"
  ON "village_data_versions"("desaId", "status", "createdAt");

CREATE INDEX "village_data_versions_sourceDocumentId_idx"
  ON "village_data_versions"("sourceDocumentId");

CREATE INDEX "village_data_versions_publishedAt_idx"
  ON "village_data_versions"("publishedAt");

ALTER TABLE "village_data_versions" ENABLE ROW LEVEL SECURITY;
