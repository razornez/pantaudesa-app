import { NextRequest, NextResponse } from "next/server";
import { extractFromFile, extractFromText } from "@/lib/intake/extractors";
import {
  MAX_INTAKE_FILE_SIZE,
  MAX_INTAKE_REVIEW_TITLE_LENGTH,
  SCANNED_PDF_MIME,
} from "@/lib/intake/constants";
import type { OpenAIResult } from "@/lib/intake/types";

export type ParsedIntakeSubmission =
  | {
      inputSource: "file";
      buffer: Buffer;
      fileName: string;
      fileType: string;
      fileSize: number;
      desaId?: string;
      title?: string;
      requestAiMapping: boolean;
      extractedText: string;
      extractMeta: Awaited<ReturnType<typeof extractFromFile>>["meta"];
      extractFailed: boolean;
      extractError?: string;
    }
  | {
      inputSource: "paste";
      buffer: Buffer;
      fileName: string;
      fileType: string;
      fileSize: number;
      desaId?: string;
      title?: string;
      requestAiMapping: boolean;
      extractedText: string;
      extractMeta: ReturnType<typeof extractFromText>["meta"];
      extractFailed: boolean;
      extractError?: string;
    };

function trimOptionalText(input: unknown, maxLength: number): string | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim().slice(0, maxLength);
  return value ? value : undefined;
}

export function buildPasteFileName(desaName: string): string {
  const slug = desaName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const stamp = new Date().toISOString().slice(0, 10);
  return `${slug || "desa"}-intake-${stamp}.txt`;
}

export function buildFallbackTitle(input: {
  fileName: string;
  inputSource: ParsedIntakeSubmission["inputSource"];
  desaName: string;
}): string {
  const withoutExtension = input.fileName.replace(/\.[^.]+$/, "").trim();
  if (withoutExtension) {
    return withoutExtension.slice(0, MAX_INTAKE_REVIEW_TITLE_LENGTH);
  }

  if (input.inputSource === "paste") {
    return `Intake manual ${input.desaName}`.slice(0, MAX_INTAKE_REVIEW_TITLE_LENGTH);
  }

  return `Intake ${input.desaName}`.slice(0, MAX_INTAKE_REVIEW_TITLE_LENGTH);
}

export function canContinueWithAiFallback(parsed: ParsedIntakeSubmission): boolean {
  return parsed.requestAiMapping;
}

export function isBinaryNeedingAi(parsed: ParsedIntakeSubmission): boolean {
  const lower = parsed.fileType.toLowerCase();
  return lower.startsWith("image/") || lower === SCANNED_PDF_MIME;
}

export function hasOpenAiDraftContent(result: OpenAIResult): boolean {
  return (
    Object.keys(result.knownPublishableFields).length > 0 ||
    result.detectedButNotPublishable.length > 0 ||
    result.unknownUsefulFields.length > 0
  );
}

export async function parseIntakeSubmission(
  req: NextRequest,
  options: { requireDesaId: boolean; allowTitle?: boolean },
): Promise<ParsedIntakeSubmission | NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    const desaId = trimOptionalText(formData.get("desaId"), 200);
    const title = options.allowTitle
      ? trimOptionalText(formData.get("title"), MAX_INTAKE_REVIEW_TITLE_LENGTH)
      : undefined;
    const requestAiMapping = formData.get("useAiMapping") === "true";

    if (options.requireDesaId && !desaId) {
      return NextResponse.json(
        { error: "Pilih desa target sebelum submit ke review internal." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }
    if (file.size > MAX_INTAKE_FILE_SIZE) {
      return NextResponse.json({ error: "File terlalu besar (maks 10 MB)." }, { status: 422 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractFromFile({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    return {
      inputSource: "file",
      buffer,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      desaId,
      title,
      requestAiMapping,
      extractedText: extracted.ok ? extracted.text : "",
      extractMeta: extracted.meta,
      extractFailed: !extracted.ok,
      ...(extracted.ok ? {} : { extractError: extracted.error ?? "Gagal membaca file." }),
    };
  }

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      text?: unknown;
      desaId?: unknown;
      title?: unknown;
      useAiMapping?: unknown;
    };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const desaId = trimOptionalText(body.desaId, 200);
    const title = options.allowTitle
      ? trimOptionalText(body.title, MAX_INTAKE_REVIEW_TITLE_LENGTH)
      : undefined;
    const requestAiMapping = body.useAiMapping === true;

    if (options.requireDesaId && !desaId) {
      return NextResponse.json(
        { error: "Pilih desa target sebelum submit ke review internal." },
        { status: 400 },
      );
    }
    if (!text) {
      return NextResponse.json({ error: "Teks wajib diisi." }, { status: 400 });
    }

    const extracted = extractFromText(text);
    const buffer = Buffer.from(text, "utf-8");

    return {
      inputSource: "paste",
      buffer,
      fileName: "intake-manual.txt",
      fileType: "text/plain",
      fileSize: buffer.byteLength,
      desaId,
      title,
      requestAiMapping,
      extractedText: extracted.text,
      extractMeta: extracted.meta,
      extractFailed: false,
    };
  }

  return NextResponse.json(
    {
      error: "Content-Type tidak didukung. Gunakan multipart/form-data atau application/json.",
    },
    { status: 415 },
  );
}
