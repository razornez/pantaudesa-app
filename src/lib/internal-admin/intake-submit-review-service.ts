import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { db } from "@/lib/db";
import { autoMapFromText } from "@/lib/intake/auto-mapping";
import {
  AI_OFF_BINARY_MESSAGE,
  PROCESSING_QUEUE_URL,
} from "@/lib/intake/constants";
import { maybeMapWithOpenAI } from "@/lib/intake/openai-mapping";
import { buildIntakePipelineResult, toIntakeReviewJson } from "@/lib/intake/pipeline";
import {
  buildFallbackTitle,
  buildPasteFileName,
  canContinueWithAiFallback,
  hasOpenAiDraftContent,
  isBinaryNeedingAi,
  parseIntakeSubmission,
} from "@/lib/intake/request-parser";
import { perfLog, perfStart } from "@/lib/perf";
import {
  buildDocumentStoragePath,
  deleteDocumentObject,
  getStorageConfigurationErrorMessage,
  getStorageConfigurationStatus,
  uploadDocumentBuffer,
} from "@/lib/storage/supabase-storage";
import {
  syncReviewReadyVillageVersion,
  writeDesaDataAuditEvent,
} from "@/lib/versioning/village-data-persistence";

type DbClient = Exclude<typeof db, null>;

type ServiceResult =
  | { ok: true; status: number; body: Record<string, unknown> }
  | { ok: false; status: number; body: Record<string, unknown> };

function response(status: number, body: Record<string, unknown>, ok = false): ServiceResult {
  return { ok, status, body };
}

function getRequestActorMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function submitIntakeReview(params: {
  request: NextRequest;
  actorUserId: string;
  db: DbClient;
}): Promise<ServiceResult> {
  const storageStatus = getStorageConfigurationStatus();
  if (!storageStatus.configured) {
    return response(
      503,
      {
        error: getStorageConfigurationErrorMessage(storageStatus),
        code: "STORAGE_NOT_CONFIGURED",
        bucket: storageStatus.bucket,
        missingEnvVars: storageStatus.missingEnvVars,
        invalidEnvVars: storageStatus.invalidEnvVars,
      },
      false,
    );
  }

  const parsed = await parseIntakeSubmission(params.request, {
    requireDesaId: true,
    allowTitle: true,
  });

  if ("status" in parsed) {
    const body = await parsed.json();
    return response(parsed.status, body as Record<string, unknown>, false);
  }

  const desaId = parsed.desaId;
  if (!desaId) {
    return response(
      400,
      { error: "Pilih desa target sebelum submit ke review internal." },
      false,
    );
  }

  if (parsed.extractFailed && !canContinueWithAiFallback(parsed)) {
    if (isBinaryNeedingAi(parsed)) {
      return response(
        422,
        {
          error: AI_OFF_BINARY_MESSAGE,
          meta: {
            ...parsed.extractMeta,
            aiOffForBinary: true,
            openaiStatus: "skipped",
          },
        },
        false,
      );
    }

    return response(
      422,
      { error: parsed.extractError ?? "Gagal membaca file.", meta: parsed.extractMeta },
      false,
    );
  }

  const desa = await params.db.desa.findUnique({
    where: { id: desaId },
    select: { id: true, nama: true },
  });

  if (!desa) {
    return response(404, { error: "Desa target tidak ditemukan." }, false);
  }

  const perf = perfStart();
  const fileName =
    parsed.inputSource === "paste" ? buildPasteFileName(desa.nama) : parsed.fileName;
  const localMapping = autoMapFromText(parsed.extractedText);
  const heuristicConfidenceLow =
    localMapping.evidence.length < 2 && parsed.extractedText.trim().length > 0;

  const openaiResult = await maybeMapWithOpenAI({
    extractedText: parsed.extractedText,
    fileName,
    mimeType: parsed.fileType,
    fileBuffer: parsed.inputSource === "file" ? parsed.buffer : undefined,
    explicitRequest: parsed.requestAiMapping,
    heuristicConfidenceLow,
    localExtractFailed: parsed.extractFailed,
  });

  const pipeline = await buildIntakePipelineResult({
    inputSource: parsed.inputSource,
    extractedText: parsed.extractedText,
    extractMeta: {
      ...parsed.extractMeta,
      ...(parsed.inputSource === "paste" ? { fileName, mimeType: parsed.fileType } : {}),
    },
    desaId: parsed.desaId,
    localMapping,
    openaiResult,
  });
  perfLog("internal-admin.intake.submit-review", "pipeline", perf);

  if (!parsed.extractedText.trim() && !hasOpenAiDraftContent(openaiResult)) {
    return response(
      422,
      {
        error:
          openaiResult.status === "missing_key"
            ? "Dokumen ini butuh bantuan AI untuk dibaca, tetapi OPENAI_API_KEY tidak tersedia. Coba tempel teks manual atau gunakan dokumen teks."
            : openaiResult.message || parsed.extractError || "Dokumen belum bisa dibaca.",
        meta: {
          parser: pipeline.extract.parser,
          ...(parsed.extractError ? { extractError: parsed.extractError } : {}),
          openaiStatus: openaiResult.status,
          ...(openaiResult.proof ? { openaiProof: openaiResult.proof } : {}),
        },
      },
      false,
    );
  }

  if (!pipeline.validation.ok) {
    return response(
      422,
      {
        error:
          "Hasil intake belum siap disubmit ke review. Perbaiki error validasi lalu jalankan lagi.",
        validation: pipeline.validation,
      },
      false,
    );
  }

  const documentId = `intake_${randomBytes(12).toString("hex")}`;
  const finalTitle =
    parsed.title ??
    buildFallbackTitle({ fileName, inputSource: parsed.inputSource, desaName: desa.nama });
  const storageKey = buildDocumentStoragePath(desaId, documentId, fileName);
  const requestMeta = getRequestActorMeta(params.request);

  let uploaded = false;
  try {
    await uploadDocumentBuffer(storageKey, parsed.buffer, parsed.fileType);
    uploaded = true;

    const document = await params.db.adminDesaDocument.create({
      data: {
        id: documentId,
        desaId,
        uploadedById: params.actorUserId,
        title: finalTitle,
        category: "intake_workbench",
        storageKey,
        fileName: fileName.slice(0, 200),
        fileType: parsed.fileType.slice(0, 120),
        fileSize: parsed.fileSize,
        status: "PROCESSING",
        aiMappingStatus: "DRAFT_READY_REVIEW",
        aiMappingResult: toIntakeReviewJson(pipeline),
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    const reviewReadyVersion = pipeline.versionCandidate
      ? await syncReviewReadyVillageVersion({
          desaId,
          sourceDocumentId: document.id,
          title: document.title,
          sourceLabel: "Intake workbench",
          reviewNote: pipeline.guardrailNote,
          changedFields: pipeline.versionCandidate.changedFields,
          proposedSnapshot: pipeline.versionCandidate.proposedSnapshot,
          beforeSnapshot: pipeline.versionCandidate.baseSnapshot,
          createdByUserId: params.actorUserId,
        })
      : { persisted: false as const };

    await writeAuditEvent({
      eventType: AUDIT_EVENT.INTERNAL_INTAKE_SUBMITTED,
      desaId,
      actorUserId: params.actorUserId,
      actorRole: "INTERNAL_ADMIN",
      entityType: "AdminDesaDocument",
      entityId: document.id,
      nextStatus: document.status,
      metadata: {
        inputSource: parsed.inputSource,
        parser: pipeline.extract.parser,
        fileType: parsed.fileType,
        fileSize: parsed.fileSize,
        hasDiff: pipeline.diff?.hasChanges ?? false,
        validationIssueCount: pipeline.validation.issues.length,
        openaiStatus: pipeline.openai.status,
        title: document.title,
        versionNumber: reviewReadyVersion.versionNumber ?? null,
      },
      ...requestMeta,
    });

    await writeDesaDataAuditEvent({
      desaId,
      sourceDocumentId: document.id,
      villageDataVersionId: reviewReadyVersion.id ?? null,
      actorUserId: params.actorUserId,
      actorRole: "INTERNAL_ADMIN",
      eventType: AUDIT_EVENT.INTERNAL_INTAKE_SUBMITTED,
      eventLabel: "Disubmit ke review internal",
      nextStatus: document.status,
      note: pipeline.guardrailNote,
      metadata: {
        inputSource: parsed.inputSource,
        parser: pipeline.extract.parser,
        openaiStatus: pipeline.openai.status,
        title: document.title,
        versionNumber: reviewReadyVersion.versionNumber ?? null,
      },
    });

    return response(
      200,
      {
        ok: true,
        documentId: document.id,
        title: document.title,
        newStatus: document.status,
        queuedAt: document.createdAt.toISOString(),
        queueUrl: PROCESSING_QUEUE_URL,
      },
      true,
    );
  } catch (error) {
    if (uploaded) {
      await deleteDocumentObject(storageKey).catch(() => undefined);
    }
    throw error;
  }
}
