ALTER TABLE "admin_desa_documents"
  ADD COLUMN "inputMode" TEXT NOT NULL DEFAULT 'DOCUMENT_UPLOAD',
  ADD COLUMN "sourceTypeCode" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceRegistryId" TEXT,
  ADD COLUMN "sourceEvidenceJson" JSONB,
  ADD COLUMN "structuredValuesJson" JSONB,
  ADD COLUMN "normalizedSourceText" TEXT;

ALTER TABLE "admin_desa_documents"
  ALTER COLUMN "storageKey" DROP NOT NULL,
  ALTER COLUMN "fileName" DROP NOT NULL,
  ALTER COLUMN "fileType" DROP NOT NULL,
  ALTER COLUMN "fileSize" DROP NOT NULL;

ALTER TABLE "village_detail_components"
  ADD COLUMN "sourcePolicyJson" JSONB;

ALTER TABLE "detail_field_standards"
  ADD COLUMN "sourcePolicyJson" JSONB;

ALTER TABLE "data_desa"
  ADD COLUMN "sourceDocumentId" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceRegistryId" TEXT,
  ADD COLUMN "sourceTypeCode" TEXT,
  ADD COLUMN "sourceEvidenceJson" JSONB,
  ADD COLUMN "sourceLabel" TEXT,
  ADD COLUMN "reviewNote" TEXT;

ALTER TABLE "data_desa"
  ADD CONSTRAINT "data_desa_sourceDocumentId_fkey"
  FOREIGN KEY ("sourceDocumentId") REFERENCES "admin_desa_documents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "data_desa_sourceDocumentId_idx" ON "data_desa"("sourceDocumentId");

CREATE TABLE "data_source_fetch_runs" (
  "id" TEXT NOT NULL,
  "dataSourceId" TEXT,
  "desaId" TEXT,
  "inputMode" TEXT NOT NULL DEFAULT 'SOURCE_INGESTION',
  "sourceTypeCode" TEXT,
  "sourceName" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "requestLabel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "fetchedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "httpStatus" INTEGER,
  "contentType" TEXT,
  "rawText" TEXT,
  "extractedMetaJson" JSONB,
  "errorMessage" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "data_source_fetch_runs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "data_source_fetch_runs"
  ADD CONSTRAINT "data_source_fetch_runs_dataSourceId_fkey"
  FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "data_source_fetch_runs"
  ADD CONSTRAINT "data_source_fetch_runs_desaId_fkey"
  FOREIGN KEY ("desaId") REFERENCES "desa"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "data_source_fetch_runs_dataSourceId_createdAt_idx"
  ON "data_source_fetch_runs"("dataSourceId", "createdAt");

CREATE INDEX "data_source_fetch_runs_desaId_createdAt_idx"
  ON "data_source_fetch_runs"("desaId", "createdAt");

CREATE INDEX "data_source_fetch_runs_status_createdAt_idx"
  ON "data_source_fetch_runs"("status", "createdAt");
