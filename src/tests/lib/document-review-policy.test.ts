import { describe, expect, test } from "vitest";
import {
  validateDraftGenerationStatus,
  validateDraftSaveStatus,
  validateFailStatus,
  validatePublishStatus,
} from "@/lib/internal-admin/document-review-policy";
import {
  parseDraftMappingPatchBody,
  parseFailedReason,
  parsePublishReviewBody,
} from "@/lib/internal-admin/document-review-validation";

describe("document review policy", () => {
  test("draft and publish actions stay available for reviewable statuses", () => {
    expect(validateDraftGenerationStatus("PROCESSING")).toBeNull();
    expect(validateDraftGenerationStatus("WAITING_VERIFIED_APPROVAL")).toBeNull();
    expect(validateDraftSaveStatus("PROCESSING")).toBeNull();
    expect(validateDraftSaveStatus("WAITING_VERIFIED_APPROVAL")).toBeNull();
    expect(validatePublishStatus("PROCESSING")).toBeNull();
    expect(validatePublishStatus("WAITING_VERIFIED_APPROVAL")).toBeNull();
    expect(validatePublishStatus("REJECTED")).toEqual({
      status: 422,
      error: "Hanya dokumen yang masih bisa direview yang dapat dipublikasikan. Status saat ini: REJECTED.",
    });
    expect(validatePublishStatus("FAILED")).toEqual({
      status: 422,
      error: "Hanya dokumen yang masih bisa direview yang dapat dipublikasikan. Status saat ini: FAILED.",
    });
  });

  test("final failed statuses stay blocked", () => {
    expect(validateFailStatus("WAITING_VERIFIED_APPROVAL")).toBeNull();
    expect(validateFailStatus("REJECTED")).toEqual({
      status: 422,
      error: "Dokumen sudah dalam status final: REJECTED.",
    });
    expect(validateFailStatus("PUBLISHED")).toEqual({
      status: 422,
      error: "Dokumen sudah dalam status final: PUBLISHED.",
    });
  });
});

describe("document review validation", () => {
  test("draft patch body trims notes", () => {
    expect(parseDraftMappingPatchBody({ fields: { websiteUrl: "x" }, notes: " note " })).toEqual({
      fields: { websiteUrl: "x" },
      notes: "note",
    });
  });

  test("publish note and failed reason keep safe boundaries", () => {
    expect(parsePublishReviewBody({ fields: {}, note: " publish " })).toEqual({
      fields: {},
      note: "publish",
    });
    expect(parseFailedReason({ reason: " too bad " })).toEqual({
      ok: true,
      reason: "too bad",
    });
    expect(parseFailedReason({ reason: "" })).toEqual({
      ok: false,
      error: "reason is required",
      status: 400,
    });
  });
});
