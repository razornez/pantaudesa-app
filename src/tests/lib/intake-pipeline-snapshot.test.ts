import { describe, expect, it } from "vitest";
import { normalizePersistedPipelineSnapshot } from "@/lib/intake/pipeline-snapshot";

function buildSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    inputSource: "file",
    extract: { parser: "mammoth", durationMs: 12 },
    mapping: {
      fields: { websiteUrl: "https://desa.id" },
      evidence: [],
      unmatched: [],
      source: "local",
      generatedAt: "2026-05-17T00:00:00.000Z",
    },
    validation: {
      ok: true,
      issues: [],
      checkedAt: "2026-05-17T00:00:00.000Z",
    },
    diff: null,
    fieldCoverage: null,
    versionCandidate: null,
    guardrailNote: "test",
    openai: {
      attempted: false,
      status: "skipped",
      usedInputMode: "text",
      knownPublishableFields: {},
      knownFieldEvidence: [],
      detectedButNotPublishable: [],
      unknownUsefulFields: [],
      warnings: [],
    },
    ...overrides,
  };
}

describe("normalizePersistedPipelineSnapshot", () => {
  it("accepts new snapshots that already store ok true", () => {
    const result = normalizePersistedPipelineSnapshot(buildSnapshot({ ok: true }));

    expect(result?.ok).toBe(true);
    expect(result?.extract.parser).toBe("mammoth");
  });

  it("accepts legacy stored snapshots without root ok", () => {
    const result = normalizePersistedPipelineSnapshot(buildSnapshot());

    expect(result?.ok).toBe(true);
    expect(result?.mapping.fields.websiteUrl).toBe("https://desa.id");
  });

  it("rejects values that are not pipeline snapshots", () => {
    expect(normalizePersistedPipelineSnapshot(null)).toBeNull();
    expect(normalizePersistedPipelineSnapshot({})).toBeNull();
    expect(normalizePersistedPipelineSnapshot(buildSnapshot({ ok: false }))).toBeNull();
  });
});
