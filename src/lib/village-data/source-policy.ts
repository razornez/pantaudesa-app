import type { ResolvedField } from "@/lib/village-data/template-resolver";

export const REVIEW_INPUT_MODES = {
  DOCUMENT_UPLOAD: "DOCUMENT_UPLOAD",
  STRUCTURED_SUBMISSION: "STRUCTURED_SUBMISSION",
  INTERNAL_SOURCE_ENTRY: "INTERNAL_SOURCE_ENTRY",
  SOURCE_INGESTION: "SOURCE_INGESTION",
} as const;

export const SOURCE_TYPE_CODES = {
  ADMIN_DESA_SUBMISSION: "ADMIN_DESA_SUBMISSION",
  DOCUMENT_UPLOAD: "DOCUMENT_UPLOAD",
  SOURCE_INGESTION: "SOURCE_INGESTION",
  OFFICIAL_WEBSITE: "OFFICIAL_WEBSITE",
  GOVERNMENT_SOURCE: "GOVERNMENT_SOURCE",
  TRUSTED_GOVERNANCE_SOURCE: "TRUSTED_GOVERNANCE_SOURCE",
  PROVINCE_PARTNER: "PROVINCE_PARTNER",
  INTERNAL_ADMIN_REVIEW_NOTE: "INTERNAL_ADMIN_REVIEW_NOTE",
} as const;

export type ReviewInputMode = (typeof REVIEW_INPUT_MODES)[keyof typeof REVIEW_INPUT_MODES];
export type SourceTypeCode = (typeof SOURCE_TYPE_CODES)[keyof typeof SOURCE_TYPE_CODES];

export interface FieldSourcePolicy {
  allowedSourceTypes: SourceTypeCode[];
  requiresEvidence: boolean;
  canUseAdminDesaSubmission: boolean;
  canUseCitizenVoiceSignal: boolean;
  canUseInternalAdminManualInput: boolean;
  sourcePriority: SourceTypeCode[];
}

function parsePolicy(input: unknown): FieldSourcePolicy | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const allowedSourceTypes = Array.isArray(record.allowedSourceTypes)
    ? record.allowedSourceTypes.filter((value): value is SourceTypeCode => typeof value === "string")
    : [];
  const sourcePriority = Array.isArray(record.sourcePriority)
    ? record.sourcePriority.filter((value): value is SourceTypeCode => typeof value === "string")
    : [];

  if (allowedSourceTypes.length === 0 && sourcePriority.length === 0) return null;

  return {
    allowedSourceTypes,
    requiresEvidence: record.requiresEvidence === true,
    canUseAdminDesaSubmission: record.canUseAdminDesaSubmission !== false,
    canUseCitizenVoiceSignal: record.canUseCitizenVoiceSignal === true,
    canUseInternalAdminManualInput: record.canUseInternalAdminManualInput === true,
    sourcePriority,
  };
}

export function buildFallbackFieldSourcePolicy(field: ResolvedField): FieldSourcePolicy {
  const shared = {
    canUseCitizenVoiceSignal: false,
    canUseInternalAdminManualInput: false,
  } satisfies Pick<
    FieldSourcePolicy,
    "canUseCitizenVoiceSignal" | "canUseInternalAdminManualInput"
  >;

  switch (field.componentKey) {
    case "anggaran":
    case "pendapatan":
    case "kinerja":
      return {
        allowedSourceTypes: [
          SOURCE_TYPE_CODES.GOVERNMENT_SOURCE,
          SOURCE_TYPE_CODES.PROVINCE_PARTNER,
          SOURCE_TYPE_CODES.OFFICIAL_WEBSITE,
          SOURCE_TYPE_CODES.TRUSTED_GOVERNANCE_SOURCE,
          SOURCE_TYPE_CODES.DOCUMENT_UPLOAD,
        ],
        requiresEvidence: true,
        canUseAdminDesaSubmission: true,
        sourcePriority: [
          SOURCE_TYPE_CODES.GOVERNMENT_SOURCE,
          SOURCE_TYPE_CODES.PROVINCE_PARTNER,
          SOURCE_TYPE_CODES.TRUSTED_GOVERNANCE_SOURCE,
          SOURCE_TYPE_CODES.OFFICIAL_WEBSITE,
          SOURCE_TYPE_CODES.DOCUMENT_UPLOAD,
          SOURCE_TYPE_CODES.ADMIN_DESA_SUBMISSION,
        ],
        ...shared,
      };
    case "profil_desa":
    case "identitas":
    case "demografi":
      return {
        allowedSourceTypes: [
          SOURCE_TYPE_CODES.OFFICIAL_WEBSITE,
          SOURCE_TYPE_CODES.ADMIN_DESA_SUBMISSION,
          SOURCE_TYPE_CODES.DOCUMENT_UPLOAD,
          SOURCE_TYPE_CODES.GOVERNMENT_SOURCE,
          SOURCE_TYPE_CODES.PROVINCE_PARTNER,
        ],
        requiresEvidence: field.valueType === "url" || field.valueType === "number",
        canUseAdminDesaSubmission: true,
        sourcePriority: [
          SOURCE_TYPE_CODES.GOVERNMENT_SOURCE,
          SOURCE_TYPE_CODES.PROVINCE_PARTNER,
          SOURCE_TYPE_CODES.OFFICIAL_WEBSITE,
          SOURCE_TYPE_CODES.DOCUMENT_UPLOAD,
          SOURCE_TYPE_CODES.ADMIN_DESA_SUBMISSION,
        ],
        ...shared,
      };
    default:
      return {
        allowedSourceTypes: [
          SOURCE_TYPE_CODES.DOCUMENT_UPLOAD,
          SOURCE_TYPE_CODES.OFFICIAL_WEBSITE,
          SOURCE_TYPE_CODES.GOVERNMENT_SOURCE,
          SOURCE_TYPE_CODES.ADMIN_DESA_SUBMISSION,
        ],
        requiresEvidence: false,
        canUseAdminDesaSubmission: true,
        sourcePriority: [
          SOURCE_TYPE_CODES.GOVERNMENT_SOURCE,
          SOURCE_TYPE_CODES.OFFICIAL_WEBSITE,
          SOURCE_TYPE_CODES.DOCUMENT_UPLOAD,
          SOURCE_TYPE_CODES.ADMIN_DESA_SUBMISSION,
        ],
        ...shared,
      };
  }
}

export function resolveFieldSourcePolicy(field: ResolvedField): FieldSourcePolicy {
  return parsePolicy(field.sourcePolicy) ?? buildFallbackFieldSourcePolicy(field);
}

export function sourceTypeNeedsUrl(sourceType: SourceTypeCode) {
  return (
    sourceType === SOURCE_TYPE_CODES.OFFICIAL_WEBSITE ||
    sourceType === SOURCE_TYPE_CODES.GOVERNMENT_SOURCE ||
    sourceType === SOURCE_TYPE_CODES.TRUSTED_GOVERNANCE_SOURCE ||
    sourceType === SOURCE_TYPE_CODES.PROVINCE_PARTNER
  );
}
