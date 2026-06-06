import { describe, expect, it } from "vitest";
import {
  classifyPipelineError,
  noticeClassForTone,
} from "@/components/internal-admin/intake/error-state";

describe("intake error state helpers", () => {
  it("classifies binary AI-off errors as info", () => {
    const result = classifyPipelineError({
      error: "Gambar belum bisa dibaca tanpa AI.",
      meta: { aiOffForBinary: true },
    });

    expect(result).toEqual({
      message: "Gambar belum bisa dibaca tanpa AI.",
      tone: "info",
    });
  });

  it("classifies quota-limited errors as warn", () => {
    const result = classifyPipelineError({
      error: "Kuota sedang habis.",
      meta: { openaiStatus: "quota_limited" },
    });

    expect(result).toEqual({
      message: "Kuota sedang habis.",
      tone: "warn",
    });
  });

  it("falls back to danger for unknown errors", () => {
    const result = classifyPipelineError({
      error: "",
      meta: { openaiStatus: "error" },
    });

    expect(result).toEqual({
      message: "Terjadi kesalahan.",
      tone: "danger",
    });
  });

  it("maps notice class by tone", () => {
    expect(noticeClassForTone("info")).toBe("notice-card notice-info");
    expect(noticeClassForTone("warn")).toBe("notice-card notice-warn");
    expect(noticeClassForTone("danger")).toBe("notice-card notice-danger");
  });
});
