import { describe, expect, it } from "vitest";
import {
  getAcceptedFileInputValue,
  getAllowedFormatLabels,
  normalizeUploadMimeType,
  validateUpload,
} from "@/lib/storage/upload-validation";

describe("admin desa upload validation", () => {
  it("accepts office and text formats aligned with intake", () => {
    expect(validateUpload({
      name: "dokumen.docx",
      size: 1024,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })).toEqual({ ok: true });

    expect(validateUpload({
      name: "data.xlsx",
      size: 1024,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })).toEqual({ ok: true });

    expect(validateUpload({
      name: "catatan.txt",
      size: 1024,
      type: "text/plain",
    })).toEqual({ ok: true });

    expect(validateUpload({
      name: "rekap.csv",
      size: 1024,
      type: "text/csv",
    })).toEqual({ ok: true });
  });

  it("accepts valid extension even when browser omits mime type", () => {
    expect(normalizeUploadMimeType("lampiran.docx", "")).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(validateUpload({
      name: "lampiran.docx",
      size: 1024,
      type: "",
    })).toEqual({ ok: true });
  });

  it("rejects unsupported extensions", () => {
    expect(validateUpload({
      name: "script.js",
      size: 1024,
      type: "application/javascript",
    })).toEqual({
      ok: false,
      code: "MIME_NOT_ALLOWED",
      message: "Tipe file application/javascript tidak diizinkan. Format yang diizinkan: PDF, DOCX, XLSX, XLS, TXT, CSV, JPG, JPEG, PNG, WEBP.",
    });
  });

  it("builds accept input and format labels for UI", () => {
    const accept = getAcceptedFileInputValue();
    expect(accept).toContain(".docx");
    expect(accept).toContain("text/plain");
    expect(getAllowedFormatLabels()).toEqual(["PDF", "DOCX", "XLSX", "XLS", "TXT", "CSV", "JPG", "JPEG", "PNG", "WEBP"]);
  });
});
