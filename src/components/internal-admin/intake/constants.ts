import type { IntakeMode } from "./types";
import {
  BADGE_COLORS,
  DELTA_LABELS,
  FIELD_LABELS,
  FIELD_SECTION_MAP,
  FIELD_SECTION_ORDER,
  getDiffBadgeClasses,
} from "./field-metadata";
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_MIME_TYPES,
  buildSampleDiffText,
  MAX_FILE_SIZE_MB,
  SAMPLE_COMPLEX_TEXT,
  SAMPLE_VALID_TEXT,
} from "./samples";
import { INTAKE_COPY } from "./copy";

export {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_MIME_TYPES,
  BADGE_COLORS,
  DELTA_LABELS,
  FIELD_LABELS,
  FIELD_SECTION_MAP,
  FIELD_SECTION_ORDER,
  getDiffBadgeClasses,
  INTAKE_COPY,
  MAX_FILE_SIZE_MB,
  SAMPLE_COMPLEX_TEXT,
  SAMPLE_VALID_TEXT,
  buildSampleDiffText,
};

export function formatReviewStatusLabel(status: string | null): string | null {
  if (!status) return null;
  if (status === "DRAFT_READY_REVIEW" || status === "DRAFT_PENDING_REVIEW") {
    return "Siap direview";
  }
  if (status === "DONE") return "Selesai";
  if (status === "FAILED") return "Gagal";
  if (status === "PENDING") return "Menunggu review";
  return status;
}

export function buildSuggestedReviewTitle(input: {
  mode: IntakeMode;
  selectedFile: File | null;
  selectedDesa: { nama: string } | null;
}) {
  if (input.mode === "upload" && input.selectedFile?.name) {
    return input.selectedFile.name.replace(/\.[^.]+$/, "");
  }

  if (input.selectedDesa) {
    return `Intake ${input.selectedDesa.nama}`;
  }

  return "Intake review internal";
}

export function formatDesaSearchValue(option: {
  nama: string;
  kecamatan: string;
  kabupaten: string;
}) {
  return `${option.nama} - ${option.kecamatan}, ${option.kabupaten}`;
}

export const REVIEW_QUEUE_STATUSES = [
  "WAITING_VERIFIED_APPROVAL",
  "PROCESSING",
  "PUBLISHED",
  "REJECTED",
  "FAILED",
] as const;

export function isReviewQueueStatus(
  value: string,
): value is (typeof REVIEW_QUEUE_STATUSES)[number] {
  return REVIEW_QUEUE_STATUSES.includes(value as (typeof REVIEW_QUEUE_STATUSES)[number]);
}

export function buildQueueFocusHref(input: { status: string; documentId: string }) {
  const params = new URLSearchParams();
  if (isReviewQueueStatus(input.status)) params.set("status", input.status);
  params.set("focus", input.documentId);
  return `/internal-admin/documents?${params.toString()}`;
}
