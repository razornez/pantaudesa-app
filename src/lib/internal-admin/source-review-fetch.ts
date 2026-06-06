import { Prisma, type PrismaClient } from "@/generated/prisma";
import { fetchSourceIngestionPreview } from "@/lib/internal-admin/source-ingestion";

type UnknownRecord = Record<string, unknown>;

export interface SourceFetchState {
  status: "idle" | "success" | "error";
  attemptedAt: string | null;
  error: string | null;
  suggestedValues: Record<string, unknown>;
  extractedMeta: Record<string, unknown> | null;
}

function isRecord(input: unknown): input is UnknownRecord {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function normalizeObject(input: unknown): UnknownRecord {
  return isRecord(input) ? input : {};
}

export function readSourceFetchState(sourceEvidenceJson: unknown): SourceFetchState {
  const evidence = normalizeObject(sourceEvidenceJson);
  const fetchState = normalizeObject(evidence.sourceFetch);
  const suggestedValues = normalizeObject(fetchState.suggestedValues);
  const extractedMeta = isRecord(fetchState.extractedMeta) ? fetchState.extractedMeta : null;
  const status =
    fetchState.status === "success" || fetchState.status === "error"
      ? fetchState.status
      : "idle";

  return {
    status,
    attemptedAt: typeof fetchState.attemptedAt === "string" ? fetchState.attemptedAt : null,
    error: typeof fetchState.error === "string" ? fetchState.error : null,
    suggestedValues,
    extractedMeta,
  };
}

export async function ensurePersistedSourceFetchSnapshot(params: {
  db: PrismaClient;
  document: {
    id: string;
    inputMode: string;
    sourceUrl: string | null;
    sourceEvidenceJson: unknown;
    normalizedSourceText: string | null;
  };
  force?: boolean;
}) {
  const eligible =
    params.document.inputMode === "INTERNAL_SOURCE_ENTRY" ||
    params.document.inputMode === "SOURCE_INGESTION";
  if (!eligible || !params.document.sourceUrl) {
    return {
      updated: false as const,
      sourceEvidenceJson: normalizeObject(params.document.sourceEvidenceJson),
      normalizedSourceText: params.document.normalizedSourceText,
    };
  }

  const evidence = normalizeObject(params.document.sourceEvidenceJson);
  const fetchState = readSourceFetchState(evidence);
  if (!params.force && fetchState.status !== "idle") {
    return {
      updated: false as const,
      sourceEvidenceJson: evidence,
      normalizedSourceText: params.document.normalizedSourceText,
    };
  }

  const preview = await fetchSourceIngestionPreview(params.document.sourceUrl);
  const attemptedAt = new Date().toISOString();
  const nextEvidence: UnknownRecord = {
    ...evidence,
    sourceFetch: preview.ok
      ? {
          status: "success",
          attemptedAt,
          sourceUrl: preview.sourceUrl,
          contentType: preview.contentType,
          suggestedValues: preview.suggestedValues,
          extractedMeta: preview.extractedMeta,
          error: null,
        }
      : {
          status: "error",
          attemptedAt,
          sourceUrl: params.document.sourceUrl,
          suggestedValues: {},
          extractedMeta: null,
          error: preview.error,
        },
  };

  const normalizedSourceText = preview.ok
    ? preview.extractedText
    : params.document.normalizedSourceText;

  await params.db.adminDesaDocument.update({
    where: { id: params.document.id },
    data: {
      sourceEvidenceJson: nextEvidence as Prisma.InputJsonValue,
      normalizedSourceText,
      updatedAt: new Date(),
    },
  });

  return {
    updated: true as const,
    sourceEvidenceJson: nextEvidence,
    normalizedSourceText,
  };
}
