-- Draft migration for Sprint 05-009 General Data Audit Trail.
-- Do not apply to production/shared DB without owner approval.

CREATE TABLE "desa_data_audit_events" (
  "id"                   TEXT NOT NULL,
  "desaId"               TEXT NOT NULL,
  "sourceDocumentId"     TEXT,
  "villageDataVersionId" TEXT,
  "actorUserId"          TEXT,
  "actorRole"            TEXT,
  "eventType"            TEXT NOT NULL,
  "eventLabel"           TEXT,
  "previousStatus"       TEXT,
  "nextStatus"           TEXT,
  "note"                 TEXT,
  "metadata"             JSONB,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "desa_data_audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "desa_data_audit_events_desaId_fkey"
    FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "desa_data_audit_events_sourceDocumentId_fkey"
    FOREIGN KEY ("sourceDocumentId") REFERENCES "admin_desa_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "desa_data_audit_events_villageDataVersionId_fkey"
    FOREIGN KEY ("villageDataVersionId") REFERENCES "village_data_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "desa_data_audit_events_desaId_createdAt_idx"
  ON "desa_data_audit_events"("desaId", "createdAt");

CREATE INDEX "desa_data_audit_events_sourceDocumentId_createdAt_idx"
  ON "desa_data_audit_events"("sourceDocumentId", "createdAt");

CREATE INDEX "desa_data_audit_events_villageDataVersionId_createdAt_idx"
  ON "desa_data_audit_events"("villageDataVersionId", "createdAt");

CREATE INDEX "desa_data_audit_events_eventType_createdAt_idx"
  ON "desa_data_audit_events"("eventType", "createdAt");

ALTER TABLE "desa_data_audit_events" ENABLE ROW LEVEL SECURITY;
