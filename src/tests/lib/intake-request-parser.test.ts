import { describe, expect, it } from "vitest";
import {
  buildFallbackTitle,
  buildPasteFileName,
  canContinueWithAiFallback,
  hasOpenAiDraftContent,
  isBinaryNeedingAi,
  type ParsedIntakeSubmission,
} from "@/lib/intake/request-parser";

describe("intake request parser helpers", () => {
  it("builds a paste filename from desa name", () => {
    const fileName = buildPasteFileName("Desa Maju Jaya");

    expect(fileName).toMatch(/^desa-maju-jaya-intake-\d{4}-\d{2}-\d{2}\.txt$/);
  });

  it("builds fallback title from filename when available", () => {
    const title = buildFallbackTitle({
      fileName: "laporan-apbdes-2025.pdf",
      inputSource: "file",
      desaName: "Desa Maju",
    });

    expect(title).toBe("laporan-apbdes-2025");
  });

  it("builds fallback title from desa name for paste input", () => {
    const title = buildFallbackTitle({
      fileName: "",
      inputSource: "paste",
      desaName: "Desa Maju",
    });

    expect(title).toBe("Intake manual Desa Maju");
  });

  it("detects binary inputs that require AI fallback", () => {
    const parsed = {
      inputSource: "file",
      buffer: Buffer.from("x"),
      fileName: "scan.png",
      fileType: "image/png",
      fileSize: 1,
      requestAiMapping: true,
      extractedText: "",
      extractMeta: { parser: "none", durationMs: 0 },
      extractFailed: true,
    } satisfies ParsedIntakeSubmission;

    expect(isBinaryNeedingAi(parsed)).toBe(true);
    expect(canContinueWithAiFallback(parsed)).toBe(true);
  });

  it("detects usable OpenAI draft content", () => {
    expect(
      hasOpenAiDraftContent({
        attempted: true,
        status: "success",
        usedInputMode: "image",
        reason: "ok",
        message: "ok",
        model: "gpt-5-mini",
        documentType: "unknown",
        confidence: "medium",
        knownPublishableFields: { websiteUrl: "https://desa.id" },
        knownFieldEvidence: [],
        detectedButNotPublishable: [],
        unknownUsefulFields: [],
        warnings: [],
      }),
    ).toBe(true);

    expect(
      hasOpenAiDraftContent({
        attempted: true,
        status: "success",
        usedInputMode: "text",
        reason: "ok",
        message: "ok",
        model: "gpt-5-mini",
        documentType: "unknown",
        confidence: "low",
        knownPublishableFields: {},
        knownFieldEvidence: [],
        detectedButNotPublishable: [],
        unknownUsefulFields: [],
        warnings: [],
      }),
    ).toBe(false);
  });
});
