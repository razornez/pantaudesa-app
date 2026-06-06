import type { Prisma } from "@/generated/prisma";
import {
  AI_MAPPABLE_DESA_FIELDS,
  type AiMappableDesaField,
  type AiMappingFieldValue,
} from "@/lib/admin-claim/ai-mapping";
import type { AutoMappingResult } from "@/lib/intake/auto-mapping";
import { autoMapFromText } from "@/lib/intake/auto-mapping";
import { buildDetailFieldCoverageSummary } from "@/lib/intake/detail-field-coverage";
import { resolveDesaTemplate } from "@/lib/village-data/template-resolver";
import { diffFields, type DiffResult } from "@/lib/intake/diff-engine";
import type { IntakeExtractResult } from "@/lib/intake/extractors";
import { mergeKnownFields } from "@/lib/intake/openai-mapping";
import type {
  DetailFieldCoverageSummary,
  OpenAIResult,
} from "@/lib/intake/types";
import { validateFields, type ValidationResult } from "@/lib/intake/validation";
import {
  buildVillageVersionCandidateForDesa,
  getDesaVersionSnapshot,
  toVillageVersionCandidateJson,
  type VillageDataVersionCandidate,
} from "@/lib/versioning/desa-versioning";

export type IntakeInputSource = "file" | "paste";

export interface IntakePipelineResult {
  ok: true;
  inputSource: IntakeInputSource;
  extract: IntakeExtractResult["meta"];
  mapping: AutoMappingResult;
  validation: ValidationResult;
  diff: DiffResult | null;
  fieldCoverage: DetailFieldCoverageSummary | null;
  versionCandidate: VillageDataVersionCandidate | null;
  guardrailNote: string;
  openai: OpenAIResult;
}

export const INTAKE_GUARDRAIL_NOTE =
  "Preview ini tidak mengubah data. Publish harus dilakukan melalui alur review resmi.";

function toJsonFieldObject(
  fields: Partial<Record<AiMappableDesaField, AiMappingFieldValue>>,
): Prisma.InputJsonObject {
  const out: Record<string, Prisma.InputJsonValue | null> = {};

  for (const field of AI_MAPPABLE_DESA_FIELDS) {
    const value = fields[field];
    if (value !== undefined) {
      out[field] = value;
    }
  }

  return out;
}

function buildMergedMapping(input: {
  extractedText: string;
  localMapping: AutoMappingResult;
  openai: OpenAIResult;
}): AutoMappingResult {
  const fields = mergeKnownFields(
    input.localMapping.fields,
    input.openai.knownPublishableFields,
  );

  const openaiEvidence = input.openai.knownFieldEvidence
    .filter((item) => fields[item.field] !== undefined)
    .map((item) => ({
      field: item.field,
      matchedText: item.evidenceSnippet ?? "AI draft mendeteksi field ini.",
      rule: item.sourceReference
        ? `OpenAI dynamic (${item.sourceReference})`
        : "OpenAI dynamic mapping",
    }));

  return {
    fields,
    evidence: [...input.localMapping.evidence, ...openaiEvidence],
    unmatched: AI_MAPPABLE_DESA_FIELDS.filter((field) => fields[field] === undefined),
    source:
      input.openai.status === "success" && openaiEvidence.length > 0
        ? "heuristic-regex + openai-dynamic"
        : input.localMapping.source,
    generatedAt:
      input.openai.status === "success"
        ? new Date().toISOString()
        : input.localMapping.generatedAt,
  };
}

export async function buildIntakePipelineResult(input: {
  inputSource: IntakeInputSource;
  extractedText: string;
  extractMeta: IntakeExtractResult["meta"];
  desaId?: string;
  localMapping?: AutoMappingResult;
  openaiResult: OpenAIResult;
}): Promise<IntakePipelineResult> {
  const localMapping = input.localMapping ?? autoMapFromText(input.extractedText);
  const mapping = buildMergedMapping({
    extractedText: input.extractedText,
    localMapping,
    openai: input.openaiResult,
  });
  const validation = validateFields(mapping.fields);

  let diff: DiffResult | null = null;
  let versionCandidate: VillageDataVersionCandidate | null = null;
  let currentKnownFields: Partial<Record<AiMappableDesaField, string | number | null>> = {};

  let resolvedTemplate = null;

  if (input.desaId) {
    const [desaSnapshot, template] = await Promise.all([
      getDesaVersionSnapshot(input.desaId),
      resolveDesaTemplate(input.desaId),
    ]);
    resolvedTemplate = template;
    if (desaSnapshot) {
      currentKnownFields = desaSnapshot;
      diff = diffFields(desaSnapshot, mapping.fields);
      versionCandidate = await buildVillageVersionCandidateForDesa({
        desaId: input.desaId,
        mappedFields: mapping.fields,
        createdAt: mapping.generatedAt,
      });
    }
  }

  const fieldCoverage = await buildDetailFieldCoverageSummary({
    desaId: input.desaId,
    currentKnownFields,
    mappedFields: mapping.fields,
    extractedText: input.extractedText,
    openaiResult: input.openaiResult,
    resolvedTemplate,
  });

  return {
    ok: true,
    inputSource: input.inputSource,
    extract: input.extractMeta,
    mapping,
    validation,
    diff,
    fieldCoverage,
    versionCandidate,
    guardrailNote: INTAKE_GUARDRAIL_NOTE,
    openai: input.openaiResult,
  };
}

export function toIntakeReviewJson(result: IntakePipelineResult): Prisma.InputJsonObject {
  return {
    ok: true,
    inputSource: result.inputSource,
    extract: {
      parser: result.extract.parser,
      durationMs: result.extract.durationMs,
      ...(result.extract.fileName ? { fileName: result.extract.fileName } : {}),
      ...(result.extract.mimeType ? { mimeType: result.extract.mimeType } : {}),
      ...(result.extract.size !== undefined ? { size: result.extract.size } : {}),
      ...(result.extract.pages !== undefined ? { pages: result.extract.pages } : {}),
      ...(result.extract.sheets ? { sheets: [...result.extract.sheets] } : {}),
      ...(result.extract.truncated !== undefined ? { truncated: result.extract.truncated } : {}),
    },
    mapping: {
      fields: toJsonFieldObject(result.mapping.fields),
      evidence: result.mapping.evidence.map((item) => ({
        field: item.field,
        matchedText: item.matchedText,
        rule: item.rule,
      })),
      unmatched: [...result.mapping.unmatched],
      source: result.mapping.source,
      generatedAt: result.mapping.generatedAt,
    },
    validation: {
      ok: result.validation.ok,
      issues: result.validation.issues.map((issue) => ({
        field: issue.field,
        message: issue.message,
        severity: issue.severity,
      })),
      checkedAt: result.validation.checkedAt,
    },
    diff: result.diff
      ? {
          entries: result.diff.entries.map((entry) => ({
            field: entry.field,
            deltaType: entry.deltaType,
            ...(entry.previous !== undefined ? { previous: entry.previous } : {}),
            ...(entry.next !== undefined ? { next: entry.next } : {}),
            ...(entry.changed ? { changed: entry.changed } : {}),
          })),
          hasChanges: result.diff.hasChanges,
          addedCount: result.diff.addedCount,
          updatedCount: result.diff.updatedCount,
          removedCount: result.diff.removedCount,
          generatedAt: result.diff.generatedAt,
        }
      : null,
    fieldCoverage: result.fieldCoverage
      ? {
          entries: result.fieldCoverage.entries.map((entry) => ({
            sectionKey: entry.sectionKey,
            sectionLabel: entry.sectionLabel,
            fieldKey: entry.fieldKey,
            fieldLabel: entry.fieldLabel,
            currentModelSource: entry.currentModelSource,
            currentValueStatus: entry.currentValueStatus,
            currentValuePreview: entry.currentValuePreview,
            currentlyMappable: entry.currentlyMappable,
            aiDetectable: entry.aiDetectable,
            publishableNow: entry.publishableNow,
            shouldBeMappableInSprint05: entry.shouldBeMappableInSprint05,
            deferredReason: entry.deferredReason,
            sourceRequirement: entry.sourceRequirement,
            validationRequirement: entry.validationRequirement,
            uploadedCoverageStatus: entry.uploadedCoverageStatus,
            uploadedValuePreview: entry.uploadedValuePreview,
          })),
          filledCount: result.fieldCoverage.filledCount,
          emptyCount: result.fieldCoverage.emptyCount,
          coveredCount: result.fieldCoverage.coveredCount,
          detectedNotPublishableCount: result.fieldCoverage.detectedNotPublishableCount,
          publishableNowCount: result.fieldCoverage.publishableNowCount,
          detectedButNotPublishable: result.fieldCoverage.detectedButNotPublishable.map((item) => ({
            sectionKey: item.sectionKey,
            sectionLabel: item.sectionLabel,
            fieldKey: item.fieldKey,
            fieldLabel: item.fieldLabel,
            value: item.value,
            reason: item.reason,
            sourceRequirement: item.sourceRequirement,
            validationRequirement: item.validationRequirement,
            ...(item.evidenceSnippet ? { evidenceSnippet: item.evidenceSnippet } : {}),
            ...(item.sourceReference ? { sourceReference: item.sourceReference } : {}),
          })),
          unknownUsefulFields: result.fieldCoverage.unknownUsefulFields.map((item) => ({
            label: item.label,
            value: item.value,
            possibleCategory: item.possibleCategory,
            ...(item.evidenceSnippet ? { evidenceSnippet: item.evidenceSnippet } : {}),
          })),
        }
      : null,
    versionCandidate: result.versionCandidate
      ? toVillageVersionCandidateJson(result.versionCandidate)
      : null,
    openai: {
      attempted: result.openai.attempted,
      status: result.openai.status,
      usedInputMode: result.openai.usedInputMode,
      reason: result.openai.reason,
      message: result.openai.message,
      model: result.openai.model,
      documentType: result.openai.documentType,
      confidence: result.openai.confidence,
      knownPublishableFields: toJsonFieldObject(result.openai.knownPublishableFields),
      knownFieldEvidence: result.openai.knownFieldEvidence.map((item) => ({
        field: item.field,
        ...(item.evidenceSnippet ? { evidenceSnippet: item.evidenceSnippet } : {}),
        ...(item.sourceReference ? { sourceReference: item.sourceReference } : {}),
      })),
      detectedButNotPublishable: result.openai.detectedButNotPublishable.map((item) => ({
        sectionKey: item.sectionKey,
        sectionLabel: item.sectionLabel,
        fieldKey: item.fieldKey,
        fieldLabel: item.fieldLabel,
        value: item.value,
        reason: item.reason,
        sourceRequirement: item.sourceRequirement,
        validationRequirement: item.validationRequirement,
        ...(item.evidenceSnippet ? { evidenceSnippet: item.evidenceSnippet } : {}),
        ...(item.sourceReference ? { sourceReference: item.sourceReference } : {}),
      })),
      unknownUsefulFields: result.openai.unknownUsefulFields.map((item) => ({
        label: item.label,
        value: item.value,
        possibleCategory: item.possibleCategory,
        ...(item.evidenceSnippet ? { evidenceSnippet: item.evidenceSnippet } : {}),
      })),
      warnings: [...result.openai.warnings],
    },
    guardrailNote: result.guardrailNote,
  };
}
