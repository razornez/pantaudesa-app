import type { ReactNode } from "react";
import type { DiffEntry, DiffResult } from "@/lib/intake/diff-engine";
import type { AutoMappingEvidence as MappingEvidence, AutoMappingResult as MappingResult } from "@/lib/intake/auto-mapping";
import type { ValidationIssue, ValidationResult } from "@/lib/intake/validation";
import type {
  CoverageTemplateInfo,
  DesaOption,
  DesaOptionsResponse,
  DesaVersionEntry,
  DesaVersionHistoryResponse,
  DetailFieldCoverageEntry,
  DetailFieldCoverageSummary,
  DetectedDetailField,
  ExtractMeta,
  IntakeHistoryActivity,
  IntakeHistoryResponse,
  IntakeHistorySubmission,
  KnownFieldEvidence,
  OpenAIProof,
  OpenAIResult,
  PipelineError,
  StorageModeState,
  SubmitReviewSuccess,
  UnknownUsefulField,
} from "@/lib/intake/types";
import type { IntakePipelineResult as PipelineResult } from "@/lib/intake/pipeline";
import type { VillageDataVersionCandidate as VersionCandidate } from "@/lib/versioning/desa-versioning";

export type {
  CoverageTemplateInfo,
  DesaOption,
  DesaOptionsResponse,
  DesaVersionEntry,
  DesaVersionHistoryResponse,
  DetailFieldCoverageEntry,
  DetailFieldCoverageSummary,
  DetectedDetailField,
  DiffEntry,
  DiffResult,
  ExtractMeta,
  IntakeHistoryActivity,
  IntakeHistoryResponse,
  IntakeHistorySubmission,
  KnownFieldEvidence,
  MappingEvidence,
  MappingResult,
  OpenAIProof,
  OpenAIResult,
  PipelineError,
  PipelineResult,
  StorageModeState,
  SubmitReviewSuccess,
  UnknownUsefulField,
  ValidationIssue,
  ValidationResult,
  VersionCandidate,
};

export type IntakeStep = "input" | "result";
export type IntakeMode = "upload" | "paste" | "source";

export interface StatusBadgeInfo {
  label: string;
  note: string;
  className: string;
}

export interface IntakeSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export interface IntakeStatusCardProps {
  label: string;
  badge: StatusBadgeInfo;
  children?: ReactNode;
}

export interface IntakeDiffCardProps {
  entry: DiffEntry;
}
