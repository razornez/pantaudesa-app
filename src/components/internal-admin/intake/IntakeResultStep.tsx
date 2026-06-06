"use client";

import type { ReactNode } from "react";
import type { ErrorState } from "./error-state";
import { getMappingStatus, getOpenAiStatus, getReviewStatus } from "./IntakeStatusHelpers";
import { IntakeCoverageLens } from "./IntakeCoverageLens";
import { IntakeDetectedGallery } from "./IntakeDetectedGallery";
import { IntakeDiffTheatre } from "./IntakeDiffTheatre";
import { IntakeInfoStrip } from "./IntakeInfoStrip";
import { IntakeReviewSubmitSection } from "./IntakeReviewSubmitSection";
import { IntakeSourceRibbon } from "./IntakeSourceRibbon";
import { IntakeValidationPanel } from "./IntakeValidationPanel";
import type { DesaOption, IntakeMode, PipelineResult, SubmitReviewSuccess } from "./types";

interface IntakeResultStepProps {
  mode: IntakeMode;
  loading: boolean;
  result: PipelineResult;
  selectedDesa: DesaOption | null;
  selectedFile: File | null;
  reviewTitle: string;
  submittedReview: SubmitReviewSuccess | null;
  error: ErrorState | null;
  reviewSectionRef: React.RefObject<HTMLDivElement | null>;
  onChangeDesa: () => void;
  onReviewTitleChange: (value: string) => void;
  onSubmitReview: () => void;
  onToggleInspector: () => void;
  reviewActionSlot?: ReactNode;
  finalReview?: boolean;
}

export function IntakeResultStep({
  mode,
  loading,
  result,
  selectedDesa,
  selectedFile,
  reviewTitle,
  submittedReview,
  error,
  reviewSectionRef,
  onChangeDesa,
  onReviewTitleChange,
  onSubmitReview,
  onToggleInspector,
  reviewActionSlot,
  finalReview = false,
}: IntakeResultStepProps) {
  return (
    <div className="space-y-6">
      <IntakeSourceRibbon result={result} selectedDesa={selectedDesa} onChangeDesa={onChangeDesa} />

      <IntakeDiffTheatre result={result} />

      {result.fieldCoverage ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1fr]">
          <IntakeCoverageLens result={result} />
          <IntakeValidationPanel
            result={result}
            mappingStatus={getMappingStatus(result)}
            aiStatus={getOpenAiStatus(result)}
            reviewStatus={getReviewStatus(result)}
            selectedDesa={selectedDesa}
            finalReview={finalReview}
          />
        </div>
      ) : null}

      <IntakeDetectedGallery result={result} />
      <IntakeInfoStrip result={result} onToggleInspector={onToggleInspector} />

      <div ref={reviewSectionRef}>
        {reviewActionSlot ?? (
          <IntakeReviewSubmitSection
            mode={mode}
            loading={loading}
            result={result}
            selectedDesa={selectedDesa}
            selectedFile={selectedFile}
            reviewTitle={reviewTitle}
            submittedReview={submittedReview}
            error={error}
            onReviewTitleChange={onReviewTitleChange}
            onSubmitReview={onSubmitReview}
          />
        )}
      </div>
    </div>
  );
}
