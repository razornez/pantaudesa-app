import type { AiMappableDesaField, AiMappingFields } from "@/lib/admin-claim/ai-mapping";

export type IntakeDocumentType =
  | "profil_desa"
  | "anggaran"
  | "perangkat_desa"
  | "fasilitas"
  | "potensi"
  | "kontak"
  | "dokumen_publik"
  | "unknown";

export type IntakeConfidence = "low" | "medium" | "high";

export type OpenAIStatus =
  | "success"
  | "skipped"
  | "missing_key"
  | "rate_limited"
  | "quota_limited"
  | "error"
  | "invalid_json";

export interface KnownFieldEvidence {
  field: AiMappableDesaField;
  evidenceSnippet?: string;
  sourceReference?: string;
}

export interface DetectedDetailField {
  sectionKey: string;
  sectionLabel: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  reason: string;
  sourceRequirement: string;
  validationRequirement: string;
  evidenceSnippet?: string;
  sourceReference?: string;
}

export interface UnknownUsefulField {
  label: string;
  value: string;
  possibleCategory: string;
  evidenceSnippet?: string;
}

export interface OpenAIProof {
  httpStatus?: number;
  errorCode?: string | null;
  errorType?: string | null;
  requestId?: string | null;
  usageUrl?: string;
  limitsUrl?: string;
  docsUrl?: string;
}

export interface OpenAIResult {
  attempted: boolean;
  status: OpenAIStatus;
  usedInputMode: "text" | "image" | "file";
  reason: string;
  message: string;
  model: string | null;
  documentType: IntakeDocumentType;
  confidence: IntakeConfidence;
  knownPublishableFields: AiMappingFields;
  knownFieldEvidence: KnownFieldEvidence[];
  detectedButNotPublishable: DetectedDetailField[];
  unknownUsefulFields: UnknownUsefulField[];
  warnings: string[];
  proof?: OpenAIProof;
}

export type CurrentValueStatus = "filled" | "empty";
export type UploadedCoverageStatus =
  | "covered"
  | "missing"
  | "detected_not_publishable"
  | "component_hidden"
  | "outside_template";

export interface DetailFieldCoverageEntry {
  sectionKey: string;
  sectionLabel: string;
  fieldKey: string;
  fieldLabel: string;
  currentModelSource: string;
  currentValueStatus: CurrentValueStatus;
  currentValuePreview: string;
  currentlyMappable: boolean;
  aiDetectable: boolean;
  publishableNow: boolean;
  shouldBeMappableInSprint05: boolean;
  deferredReason: string | null;
  sourceRequirement: string;
  validationRequirement: string;
  uploadedCoverageStatus: UploadedCoverageStatus;
  uploadedValuePreview: string | null;
}

export interface CoverageTemplateInfo {
  templateKey: string;
  templateName: string;
  source: "db" | "fallback";
  visibleComponentCount: number;
  hiddenComponentCount: number;
  totalFieldCount: number;
}

export interface DetailFieldCoverageSummary {
  entries: DetailFieldCoverageEntry[];
  filledCount: number;
  emptyCount: number;
  coveredCount: number;
  detectedNotPublishableCount: number;
  publishableNowCount: number;
  detectedButNotPublishable: DetectedDetailField[];
  unknownUsefulFields: UnknownUsefulField[];
  templateInfo?: CoverageTemplateInfo;
}

export interface ExtractMeta {
  fileName?: string;
  mimeType?: string;
  size?: number;
  pages?: number;
  sheets?: string[];
  parser: string;
  durationMs: number;
  truncated?: boolean;
}

export interface SubmitReviewSuccess {
  ok: boolean;
  documentId: string;
  title: string;
  newStatus: string;
  queuedAt: string;
  queueUrl: string;
}

export interface DesaOption {
  id: string;
  nama: string;
  slug: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}

export interface DesaOptionsResponse {
  desa: DesaOption[];
}

export interface IntakeHistorySubmission {
  id: string;
  title: string;
  status: string;
  aiMappingStatus: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  failedReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  desa: { id: string; nama: string; kabupaten: string };
}

export interface IntakeHistoryActivity {
  id: string;
  documentId: string | null;
  title: string;
  desaName: string;
  eventType: string;
  label: string;
  nextStatus: string | null;
  reasonText: string | null;
  createdAt: string;
}

export interface StorageModeState {
  mode: "dedicated" | "audit_fallback";
  dedicatedTableActive: boolean;
  note: string;
}

export interface IntakeHistoryResponse {
  storage: StorageModeState;
  submissions: IntakeHistorySubmission[];
  activity: IntakeHistoryActivity[];
}

export interface DesaVersionEntry {
  id: string;
  documentId: string | null;
  versionNumber: number;
  reasonText: string | null;
  createdAt: string;
  changedFields: AiMappableDesaField[];
  beforeSnapshot: Partial<Record<AiMappableDesaField, string | number | null>>;
  afterSnapshot: Partial<Record<AiMappableDesaField, string | number | null>>;
  title: string;
}

export interface DesaVersionHistoryResponse {
  storage: StorageModeState;
  desa: {
    id: string;
    nama: string;
    kabupaten: string;
    dataPublishedAt: string | null;
    dataSourceLabel: string | null;
  };
  versions: DesaVersionEntry[];
}

export interface PipelineError {
  error: string;
  meta?: Record<string, unknown>;
}
