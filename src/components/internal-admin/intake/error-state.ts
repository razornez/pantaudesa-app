import type { PipelineError } from "./types";

export type ErrorTone = "info" | "warn" | "danger";

export interface ErrorState {
  message: string;
  tone: ErrorTone;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function readMeta(error: PipelineError | null | undefined): Record<string, unknown> {
  return isRecord(error?.meta) ? error.meta : {};
}

export function classifyPipelineError(error: PipelineError): ErrorState {
  const meta = readMeta(error);

  if (meta.aiOffForBinary === true) {
    return {
      message: error.error || "Gambar belum bisa dibaca tanpa AI.",
      tone: "info",
    };
  }

  const openAiStatus =
    typeof meta.openaiStatus === "string" ? meta.openaiStatus : null;

  if (openAiStatus === "quota_limited" || openAiStatus === "rate_limited") {
    return {
      message:
        error.error || "Layanan AI sedang sibuk. Coba lagi atau pakai parser lokal.",
      tone: "warn",
    };
  }

  return {
    message: error.error || "Terjadi kesalahan.",
    tone: "danger",
  };
}

export function noticeClassForTone(tone: ErrorTone): string {
  if (tone === "info") return "notice-card notice-info";
  if (tone === "warn") return "notice-card notice-warn";
  return "notice-card notice-danger";
}
