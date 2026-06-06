import { db } from "@/lib/db";
import {
  getDatabaseUnavailableMessage,
  isDatabaseConnectivityError,
} from "@/lib/db-connectivity";
import { buildReviewCandidateForDocument, type ReviewCandidate } from "@/lib/internal-admin/review-candidate";
import { type IntakePipelineResult } from "@/lib/intake/pipeline";
import { normalizePersistedPipelineSnapshot } from "@/lib/intake/pipeline-snapshot";
import { buildDocumentPipelineSnapshotFromStorage } from "@/lib/internal-admin/document-pipeline-snapshot";
import type { InternalDocumentStatus } from "@/lib/internal-admin/page-params";
import { ensurePersistedSourceFetchSnapshot } from "@/lib/internal-admin/source-review-fetch";

export interface IntakeReviewDocument {
  id: string;
  title: string;
  category: string;
  inputMode: string;
  storageKey: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: InternalDocumentStatus;
  sourceTypeCode: string | null;
  sourceUrl: string | null;
  sourceRegistryId: string | null;
  sourceEvidenceJson: Record<string, unknown> | null;
  normalizedSourceText: string | null;
  structuredValuesJson: Record<string, unknown> | null;
  aiMappingStatus: string | null;
  aiMappingResult: IntakePipelineResult | null;
  reviewCandidate: ReviewCandidate | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  failedReason: string | null;
}

export interface IntakeReviewDesa {
  id: string;
  nama: string;
  slug: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}

export interface IntakeReviewPageData {
  document: IntakeReviewDocument;
  desa: IntakeReviewDesa;
}

async function ensurePipelineSnapshot(
  document: {
    id: string;
    desaId: string;
    storageKey: string | null;
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
    aiMappingResult: unknown;
  },
): Promise<IntakePipelineResult | null> {
  const existingSnapshot = normalizePersistedPipelineSnapshot(document.aiMappingResult);
  if (existingSnapshot) {
    return existingSnapshot;
  }

  if (!document.storageKey || !document.fileName || !document.fileType || document.fileSize === null) {
    return null;
  }

  const { pipelineJson } = await buildDocumentPipelineSnapshotFromStorage({
    desaId: document.desaId,
    storageKey: document.storageKey,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    existingAiMappingResult: document.aiMappingResult,
  });

  await db?.adminDesaDocument.update({
    where: { id: document.id },
    data: {
      aiMappingStatus: "DRAFT_READY_REVIEW",
      aiMappingResult: pipelineJson,
      updatedAt: new Date(),
    },
  });

  return normalizePersistedPipelineSnapshot(pipelineJson);
}

export async function loadIntakeReviewPageData(
  documentId: string,
): Promise<
  | { kind: "data"; data: IntakeReviewPageData }
  | { kind: "not_found" }
  | { kind: "unavailable"; message: string }
> {
  if (!db) {
    return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
  }

  try {
    const document = await db.adminDesaDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        category: true,
        desaId: true,
        inputMode: true,
        storageKey: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        sourceTypeCode: true,
        sourceUrl: true,
        sourceRegistryId: true,
        sourceEvidenceJson: true,
        structuredValuesJson: true,
        normalizedSourceText: true,
        aiMappingStatus: true,
        aiMappingResult: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        failedReason: true,
        desa: {
          select: {
            id: true,
            nama: true,
            slug: true,
            kecamatan: true,
            kabupaten: true,
            provinsi: true,
          },
        },
      },
    });

    if (!document) return { kind: "not_found" };
    const sourceSnapshot = await ensurePersistedSourceFetchSnapshot({
      db,
      document: {
        id: document.id,
        inputMode: document.inputMode,
        sourceUrl: document.sourceUrl,
        sourceEvidenceJson: document.sourceEvidenceJson,
        normalizedSourceText: document.normalizedSourceText,
      },
    });

    const sourceEvidenceJson =
      sourceSnapshot.sourceEvidenceJson && Object.keys(sourceSnapshot.sourceEvidenceJson).length > 0
        ? sourceSnapshot.sourceEvidenceJson
        : typeof document.sourceEvidenceJson === "object" && document.sourceEvidenceJson !== null
          ? (document.sourceEvidenceJson as Record<string, unknown>)
          : null;
    const normalizedSourceText = sourceSnapshot.normalizedSourceText;

    const aiMappingResult = await ensurePipelineSnapshot(document);
    const reviewCandidate = await buildReviewCandidateForDocument({
      desaId: document.desaId,
      inputMode: document.inputMode,
      sourceTypeCode: document.sourceTypeCode,
      sourceUrl: document.sourceUrl,
      sourceRegistryId: document.sourceRegistryId,
      sourceEvidenceJson,
      normalizedSourceText,
      structuredValuesJson: document.structuredValuesJson,
      aiMappingResult: document.aiMappingResult,
    });

    return {
      kind: "data",
      data: {
        document: {
          id: document.id,
          title: document.title,
          category: document.category,
          inputMode: document.inputMode,
          storageKey: document.storageKey,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          status: document.status,
          sourceTypeCode: document.sourceTypeCode,
          sourceUrl: document.sourceUrl,
          sourceRegistryId: document.sourceRegistryId,
          sourceEvidenceJson,
          normalizedSourceText,
          structuredValuesJson:
            typeof document.structuredValuesJson === "object" && document.structuredValuesJson !== null
              ? (document.structuredValuesJson as Record<string, unknown>)
              : null,
          aiMappingStatus: document.aiMappingStatus,
          aiMappingResult,
          reviewCandidate,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
          publishedAt: document.publishedAt?.toISOString() ?? null,
          failedReason: document.failedReason,
        },
        desa: document.desa,
      },
    };
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
    }
    throw error;
  }
}
