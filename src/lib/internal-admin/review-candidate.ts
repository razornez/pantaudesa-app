import { AI_MAPPABLE_DESA_SELECT } from "@/lib/admin-claim/ai-mapping";
import { db } from "@/lib/db";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { normalizePersistedPipelineSnapshot } from "@/lib/intake/pipeline-snapshot";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  reconcileTemplateFieldEngineSnapshot,
  restoreTemplateFieldEngineFromSnapshot,
  resolveEffectiveTemplateFieldEngine,
  type EffectiveTemplateField,
} from "@/lib/village-data/field-engine";
import { getPublishedDataDesa } from "@/lib/village-data/template-resolver";
import type { SourceTypeCode } from "@/lib/village-data/source-policy";
import { readSourceFetchState } from "@/lib/internal-admin/source-review-fetch";

type UnknownRecord = Record<string, unknown>;

export type CandidateValidationStatus = "valid" | "invalid" | "held" | "blocked";
export type ReviewCandidateSelection = "manual" | "fetched" | "skip";

export interface ReviewCandidateOption {
  source: Exclude<ReviewCandidateSelection, "skip">;
  value: unknown;
  preview: string;
  validationStatus: CandidateValidationStatus;
  validationMessage: string | null;
}

export interface ReviewCandidateField {
  fieldStandardId: string | null;
  componentId: string | null;
  componentKey: string;
  componentLabel: string;
  fieldKey: string;
  fieldLabel: string;
  valueType: string;
  currentValue: unknown;
  currentValuePreview: string;
  proposedValue: unknown;
  proposedValuePreview: string;
  manualCandidate: ReviewCandidateOption | null;
  fetchedCandidate: ReviewCandidateOption | null;
  defaultSelection: ReviewCandidateSelection | null;
  hasConflict: boolean;
  isPublishableNow: boolean;
  validationStatus: CandidateValidationStatus;
  validationMessage: string | null;
  sourceRequirement: string;
  requiresEvidence: boolean;
}

export interface ReviewCandidate {
  inputMode: string;
  sourceTypeCode: SourceTypeCode | null;
  sourceUrl: string | null;
  sourceRegistryId: string | null;
  sourceEvidenceJson: UnknownRecord | null;
  normalizedSourceText: string | null;
  sourceFetch: {
    status: "idle" | "success" | "error";
    attemptedAt: string | null;
    error: string | null;
  };
  template: {
    templateId: string;
    templateKey: string;
    templateName: string;
    visibleCount: number;
    hiddenCount: number;
  };
  fields: ReviewCandidateField[];
}

function isRecord(input: unknown): input is UnknownRecord {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function normalizeObjectRecord(input: unknown): UnknownRecord {
  return isRecord(input) ? input : {};
}

function toPreview(value: unknown) {
  if (value === null || value === undefined || value === "") return "Belum ada nilai";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function normalizeSourceEvidence(input: unknown): UnknownRecord | null {
  return isRecord(input) ? input : null;
}

async function readLegacyDesaValuesViaSupabase(desaId: string) {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from("desa")
    .select("websiteUrl,kategori,tahunData,jumlahPenduduk,kecamatan,kabupaten,provinsi")
    .eq("id", desaId)
    .maybeSingle<Record<string, unknown>>();

  if (error) throw error;
  return data ?? null;
}

async function readLegacyDesaValues(desaId: string) {
  if (!db) {
    return readLegacyDesaValuesViaSupabase(desaId).catch(() => null);
  }

  try {
    return await db.desa.findUnique({
      where: { id: desaId },
      select: AI_MAPPABLE_DESA_SELECT,
    });
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return readLegacyDesaValuesViaSupabase(desaId).catch(() => null);
    }
    throw error;
  }
}

function validateFieldValue(field: EffectiveTemplateField, value: unknown, hasEvidence: boolean) {
  if (value === null || value === undefined || value === "") {
    return { status: "blocked" as const, message: "Nilai belum diisi." };
  }

  if (!field.isPublishableNow) {
    return {
      status: "held" as const,
      message: "Field ini aktif di template, tetapi belum publishable untuk publik.",
    };
  }

  if (field.sourcePolicyResolved.requiresEvidence && !hasEvidence) {
    return {
      status: "invalid" as const,
      message: "Field ini butuh source/evidence sebelum bisa dipublish.",
    };
  }

  if (!field.sourcePolicyResolved.canUseInternalAdminManualInput) {
    // no-op: manual free input is never trusted by itself. Evidence still required.
  }

  switch (field.valueType) {
    case "url":
      try {
        new URL(String(value));
      } catch {
        return { status: "invalid" as const, message: "URL tidak valid." };
      }
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return { status: "invalid" as const, message: "Email tidak valid." };
      }
      break;
    case "number": {
      const numericValue = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numericValue)) {
        return { status: "invalid" as const, message: "Nilai harus berupa angka." };
      }
      if (
        ["anggaran", "pendapatan", "kinerja", "demografi"].includes(field.componentKey) &&
        numericValue < 0
      ) {
        return { status: "invalid" as const, message: "Nilai tidak boleh negatif." };
      }
      if (field.fieldKey === "tahunData" && (numericValue < 1990 || numericValue > 2100)) {
        return { status: "invalid" as const, message: "Tahun data di luar rentang wajar." };
      }
      break;
    }
    case "json":
      if (typeof value === "string") {
        try {
          JSON.parse(value);
        } catch {
          return {
            status: "invalid" as const,
            message: "Field JSON harus valid JSON agar bisa dipublish.",
          };
        }
      } else if (!Array.isArray(value) && !isRecord(value)) {
        return {
          status: "invalid" as const,
          message: "Field JSON harus berupa object, array, atau JSON string.",
        };
      }
      break;
  }

  return { status: "valid" as const, message: null };
}

function extractManualValues(document: {
  structuredValuesJson: unknown;
  aiMappingResult: unknown;
}) {
  const structuredValues = normalizeObjectRecord(document.structuredValuesJson);
  if (Object.keys(structuredValues).length > 0) return structuredValues;

  const pipeline = normalizePersistedPipelineSnapshot(document.aiMappingResult);
  if (!pipeline) return {};

  return normalizeObjectRecord(pipeline.mapping.fields);
}

function extractFetchedValues(sourceEvidenceJson: UnknownRecord | null) {
  if (!sourceEvidenceJson) return {};
  return normalizeObjectRecord(readSourceFetchState(sourceEvidenceJson).suggestedValues);
}

function buildCandidateOption(input: {
  field: EffectiveTemplateField;
  value: unknown;
  hasEvidence: boolean;
  source: Exclude<ReviewCandidateSelection, "skip">;
}): ReviewCandidateOption | null {
  if (input.value === undefined) return null;
  const validation = validateFieldValue(input.field, input.value, input.hasEvidence);
  return {
    source: input.source,
    value: input.value,
    preview: toPreview(input.value),
    validationStatus: validation.status,
    validationMessage: validation.message,
  };
}

function hasSamePreview(
  left: ReviewCandidateOption | null,
  right: ReviewCandidateOption | null,
) {
  return Boolean(left && right && left.preview === right.preview);
}

function resolveDefaultSelection(input: {
  manualCandidate: ReviewCandidateOption | null;
  fetchedCandidate: ReviewCandidateOption | null;
}): ReviewCandidateSelection | null {
  if (input.manualCandidate && !input.fetchedCandidate) {
    return input.manualCandidate.validationStatus === "held" ? "skip" : "manual";
  }
  if (!input.manualCandidate && input.fetchedCandidate) {
    return input.fetchedCandidate.validationStatus === "held" ? "skip" : "fetched";
  }
  if (hasSamePreview(input.manualCandidate, input.fetchedCandidate)) {
    return input.manualCandidate?.validationStatus === "held" ? "skip" : "manual";
  }
  return null;
}

function resolveSelectedOption(input: {
  manualCandidate: ReviewCandidateOption | null;
  fetchedCandidate: ReviewCandidateOption | null;
  selection: ReviewCandidateSelection | null;
}) {
  if (input.selection === "manual") return input.manualCandidate;
  if (input.selection === "fetched") return input.fetchedCandidate;
  return null;
}

export async function buildReviewCandidateForDocument(document: {
  desaId: string;
  inputMode: string;
  sourceTypeCode: string | null;
  sourceUrl: string | null;
  sourceRegistryId: string | null;
  sourceEvidenceJson: unknown;
  normalizedSourceText: string | null;
  structuredValuesJson: unknown;
  aiMappingResult: unknown;
}) : Promise<ReviewCandidate> {
  const sourceEvidenceJson = normalizeSourceEvidence(document.sourceEvidenceJson);
  const snapshotEngine = restoreTemplateFieldEngineFromSnapshot(
    sourceEvidenceJson?.templateSnapshot,
  );
  const liveEngine = snapshotEngine
    ? await resolveEffectiveTemplateFieldEngine(document.desaId).catch(() => null)
    : await resolveEffectiveTemplateFieldEngine(document.desaId);
  const engine = snapshotEngine
    ? liveEngine
      ? reconcileTemplateFieldEngineSnapshot(snapshotEngine, liveEngine)
      : snapshotEngine
    : liveEngine!;
  const currentPublishedValuesRaw = await getPublishedDataDesa(
    document.desaId,
    engine.resolvedTemplate,
  );
  const legacyDesa = await readLegacyDesaValues(document.desaId);

  const manualValues = extractManualValues(document);
  const fetchedValues = extractFetchedValues(sourceEvidenceJson);
  const currentPublishedValues: Record<string, unknown> =
    normalizeObjectRecord(currentPublishedValuesRaw);
  const hasEvidence =
    Boolean(document.sourceUrl) ||
    Boolean(document.sourceRegistryId) ||
    Boolean(sourceEvidenceJson && Object.keys(sourceEvidenceJson).length > 0);

  const currentLegacyValues: Record<string, unknown> = legacyDesa ? normalizeObjectRecord(legacyDesa) : {};
  const fetchState = readSourceFetchState(sourceEvidenceJson);

  const fields = engine.fields
    .filter(
      (field) =>
        Object.hasOwn(manualValues, field.fieldKey) || Object.hasOwn(fetchedValues, field.fieldKey),
    )
    .map((field) => {
      const manualCandidate = buildCandidateOption({
        field,
        value: manualValues[field.fieldKey],
        hasEvidence,
        source: "manual",
      });
      const fetchedCandidate = buildCandidateOption({
        field,
        value: fetchedValues[field.fieldKey],
        hasEvidence,
        source: "fetched",
      });
      const defaultSelection = resolveDefaultSelection({
        manualCandidate,
        fetchedCandidate,
      });
      const selectedOption = resolveSelectedOption({
        manualCandidate,
        fetchedCandidate,
        selection: defaultSelection,
      });
      const currentValue =
        currentPublishedValues[field.fieldKey] ?? currentLegacyValues[field.fieldKey] ?? null;
      const hasConflict =
        Boolean(manualCandidate && fetchedCandidate) &&
        !hasSamePreview(manualCandidate, fetchedCandidate);
      const validation = hasConflict
        ? {
            status: "held" as const,
            message: "Pilih nilai manual, hasil fetch, atau lewati field ini.",
          }
        : selectedOption
          ? {
              status: selectedOption.validationStatus,
              message: selectedOption.validationMessage,
            }
          : {
              status: "blocked" as const,
              message: "Belum ada nilai candidate yang bisa dibaca.",
            };
      const proposedValue = selectedOption?.value ?? manualCandidate?.value ?? fetchedCandidate?.value ?? null;
      const proposedValuePreview =
        selectedOption?.preview ??
        manualCandidate?.preview ??
        fetchedCandidate?.preview ??
        toPreview(null);

      return {
        fieldStandardId: field.fieldStandardId ?? null,
        componentId: field.componentId ?? null,
        componentKey: field.componentKey,
        componentLabel: field.componentLabel,
        fieldKey: field.fieldKey,
        fieldLabel: field.label,
        valueType: field.valueType,
        currentValue,
        currentValuePreview: toPreview(currentValue),
        proposedValue,
        proposedValuePreview,
        manualCandidate,
        fetchedCandidate,
        defaultSelection,
        hasConflict,
        isPublishableNow: field.isPublishableNow,
        validationStatus: validation.status,
        validationMessage: validation.message,
        sourceRequirement: field.sourcePolicyResolved.allowedSourceTypes.join(", "),
        requiresEvidence: field.sourcePolicyResolved.requiresEvidence,
      } satisfies ReviewCandidateField;
    });

  return {
    inputMode: document.inputMode,
    sourceTypeCode: (document.sourceTypeCode as SourceTypeCode | null) ?? null,
    sourceUrl: document.sourceUrl,
    sourceRegistryId: document.sourceRegistryId,
    sourceEvidenceJson,
    normalizedSourceText: document.normalizedSourceText,
    sourceFetch: {
      status: fetchState.status,
      attemptedAt: fetchState.attemptedAt,
      error: fetchState.error,
    },
    template: {
      templateId: engine.resolvedTemplate.templateId,
      templateKey: engine.resolvedTemplate.templateKey,
      templateName: engine.resolvedTemplate.templateName,
      visibleCount: engine.resolvedTemplate.visibleComponents.length,
      hiddenCount: engine.resolvedTemplate.hiddenComponents.length,
    },
    fields,
  };
}
