import type {
  AI_MAPPABLE_DESA_FIELDS,
  AiMappableDesaField,
  AiMappingDraft,
} from "@/lib/admin-claim/ai-mapping";
import type { readVillageVersionCandidate } from "@/lib/versioning/desa-versioning";

export type DocStatus =
  | "WAITING_VERIFIED_APPROVAL"
  | "PROCESSING"
  | "PUBLISHED"
  | "REJECTED"
  | "FAILED";

export interface DocRow {
  id: string;
  title: string;
  category: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: DocStatus;
  approvedAt: string | null;
  publishedAt: string | null;
  failedReason: string | null;
  rejectedReason: string | null;
  aiMappingStatus: string | null;
  aiMappingResult?: unknown;
  sourceTypeCode?: string | null;
  createdAt: string;
  updatedAt: string;
  desa: { id: string; nama: string; kecamatan: string; kabupaten: string };
  uploadedBy: {
    id: string;
    nama: string | null;
    username: string | null;
    email: string;
  } | null;
}

export interface PublishApiPayload {
  ok: boolean;
  documentId: string;
  newStatus: string;
  versionNumber?: number;
  appliedFields?: string[];
}

export interface TemplateRibbonInfo {
  templateName: string;
  templateKey: string;
  source: string;
  visibleCount: number;
  hiddenCount: number;
}

export type CoverageHiddenItem = {
  fieldLabel: string;
  componentLabel: string;
};

export type CoverageOutsideItem = {
  fieldLabel: string;
  fieldKey: string;
  uploadedValuePreview: string;
};

export type ReviewFieldName = (typeof AI_MAPPABLE_DESA_FIELDS)[number];

export interface DraftSummary {
  draft: AiMappingDraft;
  filledCount: number;
}

export interface VersionCandidateSummary {
  candidate: ReturnType<typeof readVillageVersionCandidate>;
  changedCount: number;
}

export interface FieldReviewContext {
  publicValue: string | number | null | undefined;
  draftValue: string | number | null | undefined;
  hasDraftValue: boolean;
  isChangedFromPublic: boolean;
}

export interface NextStepCopy {
  title: string;
  note: string;
  tone: "warn" | "info" | "ok" | "danger";
}

export type FieldLabelMap = Record<AiMappableDesaField, string>;
