/**
 * Sprint 05 Batch 3 - Document Intake Extractors
 *
 * Server-side only. Converts an uploaded file or pasted text into normalized
 * plain text plus a small `meta` payload describing the source.
 *
 * Guardrails:
 *  - never persists files,
 *  - never writes to DB,
 *  - never echoes user identifiers,
 *  - returns `{ text, meta }` only,
 *  - failure is reported, not silenced.
 */

import { join } from "node:path";
import { pathToFileURL } from "node:url";

export type IntakeKind = "txt" | "docx" | "xlsx" | "pdf" | "csv" | "image" | "unknown";

export interface IntakeExtractResult {
  ok: boolean;
  kind: IntakeKind;
  text: string;
  meta: {
    fileName?: string;
    mimeType?: string;
    size?: number;
    pages?: number;
    sheets?: string[];
    parser: string;
    durationMs: number;
    truncated?: boolean;
  };
  error?: string;
}

const MAX_TEXT_LENGTH = 200_000;
let pdfWorkerConfigured = false;

function detectKindFromName(fileName?: string, mimeType?: string): IntakeKind {
  const lowerName = (fileName ?? "").toLowerCase();
  const lowerMime = (mimeType ?? "").toLowerCase();
  if (lowerName.endsWith(".txt") || lowerMime === "text/plain") return "txt";
  if (lowerName.endsWith(".docx") || lowerMime.includes("officedocument.wordprocessingml")) return "docx";
  if (lowerName.endsWith(".xlsx") || lowerMime.includes("officedocument.spreadsheetml") || lowerMime === "application/vnd.ms-excel") return "xlsx";
  if (lowerName.endsWith(".pdf") || lowerMime === "application/pdf") return "pdf";
  if (lowerName.endsWith(".csv") || lowerMime === "text/csv") return "csv";
  if (lowerMime.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/.test(lowerName)) return "image";
  return "unknown";
}

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_TEXT_LENGTH) return { text, truncated: false };
  return { text: text.slice(0, MAX_TEXT_LENGTH), truncated: true };
}

async function extractTxt(buf: Buffer): Promise<string> {
  return buf.toString("utf-8");
}

async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value ?? "";
}

async function extractXlsx(buf: Buffer): Promise<{ text: string; sheets: string[] }> {
  const xlsxMod = await import("xlsx");
  const wb = xlsxMod.read(buf, { type: "buffer" });
  const lines: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    lines.push(`# Sheet: ${sheetName}`);
    const csv = xlsxMod.utils.sheet_to_csv(sheet);
    lines.push(csv.trim());
    lines.push("");
  }
  return { text: lines.join("\n"), sheets: wb.SheetNames };
}

async function extractPdf(buf: Buffer): Promise<{ text: string; pages: number }> {
  const { PDFParse } = await import("pdf-parse");

  if (!pdfWorkerConfigured) {
    const workerPath = join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "dist",
      "pdf-parse",
      "esm",
      "pdf.worker.mjs",
    );
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    pdfWorkerConfigured = true;
  }

  const parser = new PDFParse({ data: new Uint8Array(buf) });

  try {
    const result = await parser.getText();
    return {
      text: result.text ?? "",
      pages: result.total ?? result.pages.length,
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractCsv(buf: Buffer): Promise<string> {
  // CSV is already plain text; we just normalize line endings.
  return buf.toString("utf-8").replace(/\r\n/g, "\n");
}

export async function extractFromFile(input: {
  buffer: Buffer;
  fileName?: string;
  mimeType?: string;
  size?: number;
}): Promise<IntakeExtractResult> {
  const startedAt = Date.now();
  const kind = detectKindFromName(input.fileName, input.mimeType);
  const baseMeta = {
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
  };

  try {
    if (kind === "txt") {
      const text = await extractTxt(input.buffer);
      const t = truncate(text);
      return {
        ok: true, kind, text: t.text,
        meta: { ...baseMeta, parser: "buffer.toString('utf-8')", durationMs: Date.now() - startedAt, truncated: t.truncated },
      };
    }
    if (kind === "csv") {
      const text = await extractCsv(input.buffer);
      const t = truncate(text);
      return {
        ok: true, kind, text: t.text,
        meta: { ...baseMeta, parser: "csv (utf-8 normalized)", durationMs: Date.now() - startedAt, truncated: t.truncated },
      };
    }
    if (kind === "docx") {
      const text = await extractDocx(input.buffer);
      const t = truncate(text);
      return {
        ok: true, kind, text: t.text,
        meta: { ...baseMeta, parser: "mammoth.extractRawText", durationMs: Date.now() - startedAt, truncated: t.truncated },
      };
    }
    if (kind === "xlsx") {
      const r = await extractXlsx(input.buffer);
      const t = truncate(r.text);
      return {
        ok: true, kind, text: t.text,
        meta: { ...baseMeta, sheets: r.sheets, parser: "xlsx.sheet_to_csv", durationMs: Date.now() - startedAt, truncated: t.truncated },
      };
    }
    if (kind === "pdf") {
      const r = await extractPdf(input.buffer);
      const t = truncate(r.text);
      return {
        ok: true, kind, text: t.text,
        meta: { ...baseMeta, pages: r.pages, parser: "pdf-parse", durationMs: Date.now() - startedAt, truncated: t.truncated },
      };
    }
    if (kind === "image") {
      // Sprint 05 Batch 3: OCR explicitly deferred (see report). We return a
      // structured failure so the UI surfaces this instead of silently passing.
      return {
        ok: false, kind, text: "",
        meta: { ...baseMeta, parser: "ocr (not configured)", durationMs: Date.now() - startedAt },
        error: "OCR belum dikonfigurasi di batch ini. Coba dokumen teks (DOCX/PDF/TXT/XLSX/CSV) atau salin teks ke kolom paste.",
      };
    }
    return {
      ok: false, kind: "unknown", text: "",
      meta: { ...baseMeta, parser: "none", durationMs: Date.now() - startedAt },
      error: "Format file belum didukung. Gunakan TXT, DOCX, XLSX, PDF, CSV, atau paste teks.",
    };
  } catch (err) {
    return {
      ok: false, kind, text: "",
      meta: { ...baseMeta, parser: "error", durationMs: Date.now() - startedAt },
      error: err instanceof Error ? err.message : "Gagal membaca file.",
    };
  }
}

export function extractFromText(text: string): IntakeExtractResult {
  const startedAt = Date.now();
  const t = truncate(text ?? "");
  return {
    ok: true, kind: "txt", text: t.text,
    meta: { parser: "manual paste", durationMs: Date.now() - startedAt, truncated: t.truncated },
  };
}
