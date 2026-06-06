import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma";
import type { AuditEventType } from "@/lib/admin-claim/audit-events";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { buildStructuredPipelineSnapshot } from "@/lib/internal-admin/document-pipeline-snapshot";
import { syncReviewReadyVillageVersion, writeDesaDataAuditEvent } from "@/lib/versioning/village-data-persistence";
import type { ReviewInputMode, SourceTypeCode } from "@/lib/village-data/source-policy";

function buildStructuredDocumentId(prefix: "sds" | "src") {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export async function createSourceBackedReviewDocument(params: {
  db: PrismaClient;
  desaId: string;
  actorUserId: string;
  actorRole: string;
  title: string;
  category: string;
  status: "WAITING_VERIFIED_APPROVAL" | "PROCESSING";
  inputMode: ReviewInputMode;
  sourceTypeCode: SourceTypeCode;
  sourceUrl?: string | null;
  sourceRegistryId?: string | null;
  sourceEvidenceJson?: Record<string, unknown> | null;
  structuredValues: Record<string, unknown>;
  sourceLabel?: string | null;
  auditLabel: string;
  auditType: AuditEventType;
}) {
  const documentId = buildStructuredDocumentId(
    params.inputMode === "STRUCTURED_SUBMISSION" ? "sds" : "src",
  );

  const snapshot = await buildStructuredPipelineSnapshot({
    desaId: params.desaId,
    title: params.title,
    sourceLabel: params.sourceLabel ?? params.sourceTypeCode,
    sourceUrl: params.sourceUrl ?? null,
    values: params.structuredValues,
  });

  const document = await params.db.adminDesaDocument.create({
    data: {
      id: documentId,
      desaId: params.desaId,
      uploadedById: params.actorUserId,
      title: params.title,
      category: params.category,
      inputMode: params.inputMode,
      status: params.status,
      sourceTypeCode: params.sourceTypeCode,
      sourceUrl: params.sourceUrl ?? null,
      sourceRegistryId: params.sourceRegistryId ?? null,
      sourceEvidenceJson:
        params.sourceEvidenceJson === null
          ? Prisma.JsonNull
          : ((params.sourceEvidenceJson ?? undefined) as Prisma.InputJsonValue | undefined),
      structuredValuesJson: params.structuredValues as Prisma.InputJsonValue,
      normalizedSourceText: snapshot.normalizedSourceText,
      aiMappingStatus: snapshot.aiMappingStatus,
      aiMappingResult: snapshot.pipelineJson,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  const reviewReadyVersion = snapshot.pipeline.versionCandidate
    ? await syncReviewReadyVillageVersion({
        desaId: params.desaId,
        sourceDocumentId: document.id,
        title: document.title,
        sourceLabel: params.sourceLabel ?? params.sourceTypeCode,
        reviewNote: snapshot.pipeline.guardrailNote,
        changedFields: snapshot.pipeline.versionCandidate.changedFields,
        proposedSnapshot: snapshot.pipeline.versionCandidate.proposedSnapshot,
        beforeSnapshot: snapshot.pipeline.versionCandidate.baseSnapshot,
        createdByUserId: params.actorUserId,
      })
    : { persisted: false as const };

  await writeAuditEvent({
    eventType: params.auditType,
    desaId: params.desaId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    entityType: "AdminDesaDocument",
    entityId: document.id,
    nextStatus: document.status,
    metadata: {
      title: document.title,
      inputMode: params.inputMode,
      sourceTypeCode: params.sourceTypeCode,
      sourceUrl: params.sourceUrl ?? null,
      fieldCount: Object.keys(params.structuredValues).length,
      versionNumber: reviewReadyVersion.versionNumber ?? null,
    },
  });

  await writeDesaDataAuditEvent({
    desaId: params.desaId,
    sourceDocumentId: document.id,
    villageDataVersionId: reviewReadyVersion.id ?? null,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    eventType: params.auditType,
    eventLabel: params.auditLabel,
    nextStatus: document.status,
    note: snapshot.pipeline.guardrailNote,
    metadata: {
      title: document.title,
      inputMode: params.inputMode,
      sourceTypeCode: params.sourceTypeCode,
      sourceUrl: params.sourceUrl ?? null,
      fieldCount: Object.keys(params.structuredValues).length,
      versionNumber: reviewReadyVersion.versionNumber ?? null,
    },
  });

  return {
    documentId: document.id,
    title: document.title,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
  };
}
