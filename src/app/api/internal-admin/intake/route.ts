import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { autoMapFromText } from "@/lib/intake/auto-mapping";
import { AI_OFF_BINARY_MESSAGE } from "@/lib/intake/constants";
import { maybeMapWithOpenAI } from "@/lib/intake/openai-mapping";
import { buildIntakePipelineResult } from "@/lib/intake/pipeline";
import {
  canContinueWithAiFallback,
  hasOpenAiDraftContent,
  isBinaryNeedingAi,
  parseIntakeSubmission,
} from "@/lib/intake/request-parser";
import { perfLog, perfStart } from "@/lib/perf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionResult = await requireInternalAdminSession();
  if (sessionResult instanceof NextResponse) return sessionResult;

  const t = perfStart();

  try {
    const parsed = await parseIntakeSubmission(req, {
      requireDesaId: false,
      allowTitle: false,
    });
    if (parsed instanceof NextResponse) return parsed;

    const {
      inputSource,
      extractedText,
      extractMeta,
      desaId,
      requestAiMapping,
      fileName,
      fileType,
      buffer: fileBuffer,
      extractFailed,
      extractError,
    } = parsed;

    if (extractFailed && !canContinueWithAiFallback(parsed)) {
      if (isBinaryNeedingAi(parsed)) {
        return NextResponse.json(
          {
            error: AI_OFF_BINARY_MESSAGE,
            meta: {
              ...extractMeta,
              aiOffForBinary: true,
              openaiStatus: "skipped",
            },
          },
          { status: 422 },
        );
      }

      return NextResponse.json(
        { error: extractError ?? "Gagal membaca file.", meta: extractMeta },
        { status: 422 },
      );
    }

    perfLog("internal-admin.intake", "extract", t);

    const localMapping = autoMapFromText(extractedText);
    const heuristicConfidenceLow =
      localMapping.evidence.length < 2 && extractedText.trim().length > 0;

    const aiTimer = perfStart();
    const openaiResult = await maybeMapWithOpenAI({
      extractedText,
      fileName,
      mimeType: fileType,
      fileBuffer: inputSource === "file" ? fileBuffer : undefined,
      explicitRequest: requestAiMapping,
      heuristicConfidenceLow,
      localExtractFailed: extractFailed,
    });
    perfLog("internal-admin.intake", "openai", aiTimer);

    const hasRecoverableOutput =
      extractedText.trim().length > 0 || hasOpenAiDraftContent(openaiResult);

    if (!hasRecoverableOutput) {
      return NextResponse.json(
        {
          error:
            openaiResult.status === "missing_key"
              ? "Dokumen ini butuh bantuan AI untuk dibaca, tetapi OPENAI_API_KEY tidak tersedia. Coba tempel teks manual atau gunakan dokumen teks."
              : openaiResult.message || extractError || "Dokumen belum bisa dibaca.",
          meta: {
            parser: extractMeta.parser,
            ...(extractError ? { extractError } : {}),
            openaiStatus: openaiResult.status,
            ...(openaiResult.proof ? { openaiProof: openaiResult.proof } : {}),
          },
        },
        { status: 422 },
      );
    }

    const pipeline = await buildIntakePipelineResult({
      inputSource,
      extractedText,
      extractMeta,
      desaId,
      localMapping,
      openaiResult,
    });

    perfLog("internal-admin.intake", "full-pipeline", t);

    return NextResponse.json(pipeline);
  } catch (err) {
    console.error("[internal-admin][intake] unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan tak terduga saat memproses intake." },
      { status: 500 },
    );
  }
}
