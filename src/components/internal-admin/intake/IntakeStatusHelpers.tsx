/**
 * Status helper functions for Intake Workbench
 * Computed status values based on pipeline result
 */

import { AI_MAPPABLE_DESA_FIELDS } from "@/lib/admin-claim/ai-mapping";
import type { AiMappableDesaField } from "@/lib/admin-claim/ai-mapping";
import type { PipelineResult, StatusBadgeInfo } from "./types";
import { BADGE_COLORS } from "./constants";
import { hasErrors, hasWarnings } from "./utils";

// ============================================================================
// Mapping Status
// ============================================================================

export function getMappingStatus(result: PipelineResult): StatusBadgeInfo {
  if (result.mapping.evidence.length === 0) {
    return {
      label: "Perlu dicek",
      note: "Belum ada field yang berhasil terbaca otomatis.",
      className: BADGE_COLORS.mappingNeedCheck,
    };
  }

  if (result.mapping.unmatched.length > 0) {
    return {
      label: "Sebagian terbaca",
      note: "Masih ada field yang belum terdeteksi otomatis.",
      className: BADGE_COLORS.mappingPartial,
    };
  }

  return {
    label: "Sudah terbaca",
    note: "Field utama berhasil dibaca dari dokumen atau teks.",
    className: BADGE_COLORS.mappingSuccess,
  };
}

// ============================================================================
// Validation Status
// ============================================================================

export function getValidationStatus(result: PipelineResult): StatusBadgeInfo {
  if (hasErrors(result)) {
    return {
      label: "Perlu diperbaiki",
      note: "Masih ada data yang belum valid dan perlu dibetulkan dulu.",
      className: BADGE_COLORS.validationError,
    };
  }

  if (hasWarnings(result)) {
    return {
      label: "Perlu dicek",
      note: "Tidak ada error fatal, tapi masih ada warning yang sebaiknya ditinjau.",
      className: BADGE_COLORS.validationWarning,
    };
  }

  return {
    label: "Sudah benar",
    note: "Validasi dasar lolos tanpa error maupun warning.",
    className: BADGE_COLORS.validationOk,
  };
}

// ============================================================================
// Review Status
// ============================================================================

export function getReviewStatus(result: PipelineResult): StatusBadgeInfo {
  if (hasErrors(result)) {
    return {
      label: "Belum siap direview",
      note: "Selesaikan error validasi dulu sebelum dibawa ke review internal.",
      className: BADGE_COLORS.reviewNotReady,
    };
  }

  if (result.diff?.hasChanges) {
    return {
      label: "Siap direview",
      note: "Perubahan sudah terlihat dan bisa dibahas oleh internal admin.",
      className: BADGE_COLORS.reviewReady,
    };
  }

  if (getReviewableContentCount(result) === 0) {
    return {
      label: "Belum cukup terbaca",
      note: "Belum ada hasil yang cukup kuat untuk dibawa ke review internal.",
      className: BADGE_COLORS.reviewNotEnough,
    };
  }

  return {
    label: "Siap dicek ulang",
    note: "Preview aman dicek, tapi belum ada perubahan yang terlihat dibanding data saat ini.",
    className: BADGE_COLORS.reviewSafe,
  };
}

// ============================================================================
// OpenAI Status
// ============================================================================

export function getOpenAiStatus(result: PipelineResult): StatusBadgeInfo {
  switch (result.openai.status) {
    case "success":
      return {
        label: "AI membantu",
        note: result.openai.message,
        className: BADGE_COLORS.openaiSuccess,
      };
    case "missing_key":
      return {
        label: "AI belum tersedia",
        note: result.openai.message,
        className: BADGE_COLORS.openaiUnavailable,
      };
    case "rate_limited":
    case "quota_limited":
    case "error":
    case "invalid_json":
      return {
        label: "AI fallback",
        note: result.openai.message,
        className: BADGE_COLORS.openaiFallback,
      };
    default:
      return {
        label: "Parser lokal",
        note: result.openai.message,
        className: BADGE_COLORS.openaiLocal,
      };
  }
}

// ============================================================================
// Computed Lists
// ============================================================================

export function getMappedFieldEntries(result: PipelineResult) {
  return AI_MAPPABLE_DESA_FIELDS.filter(
    (field) => result.mapping.fields[field] !== undefined
  ).map((field) => ({
    field,
    value: result.mapping.fields[field],
  }));
}

export function getChangedFieldList(result: PipelineResult): AiMappableDesaField[] {
  if (result.versionCandidate && result.versionCandidate.changedFields.length > 0) {
    return result.versionCandidate.changedFields;
  }

  if (result.diff) {
    return result.diff.entries
      .filter((entry) => entry.deltaType !== "unchanged")
      .map((entry) => entry.field);
  }

  return [];
}

export function getReviewableContentCount(result: PipelineResult): number {
  return (
    getMappedFieldEntries(result).length +
    (result.fieldCoverage?.detectedButNotPublishable.length ?? 0) +
    (result.fieldCoverage?.unknownUsefulFields.length ?? 0)
  );
}

export function canSubmitToReview(
  result: PipelineResult | null,
  selectedDesa: { id: string } | null,
  submittedReview: unknown
): boolean {
  if (!result || !selectedDesa || submittedReview) return false;
  if (!result.validation.ok) return false;
  return getReviewableContentCount(result) > 0;
}
