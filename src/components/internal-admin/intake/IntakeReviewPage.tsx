"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IntakeReviewPageData } from "@/lib/internal-admin/intake-review-page";
import { buildQueueFocusHref } from "./constants";
import { IntakeFinalReviewSection } from "./IntakeFinalReviewSection";
import { IntakeHistoryPanels } from "./IntakeHistoryPanels";
import { IntakeInspectorDrawer } from "./IntakeInspectorDrawer";
import { IntakeResultHeader } from "./IntakeResultHeader";
import { IntakeResultStep } from "./IntakeResultStep";
import {
  useIntakeHistory,
  useVersionHistory,
} from "./hooks";
import type { PipelineResult } from "./types";

function readInputMode(result: PipelineResult) {
  return result.inputSource === "paste" ? "paste" : "upload";
}

export function IntakeReviewPage({ data }: { data: IntakeReviewPageData }) {
  const router = useRouter();
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const result = data.document.aiMappingResult;

  const intakeHistory = useIntakeHistory();
  const versionHistory = useVersionHistory(data.desa.id);

  function goBackToInput() {
    router.push("/internal-admin/intake");
  }

  function refreshData() {
    router.refresh();
  }

  function goToQueue(nextStatus: string = data.document.status) {
    router.push(
      buildQueueFocusHref({
        status: nextStatus,
        documentId: data.document.id,
      }),
    );
  }

  function scrollToReviewSection() {
    reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!result) {
    return (
      <div className="space-y-4">
        <section className="lux-card space-y-3 p-5 sm:p-6">
          <p className="eyebrow text-[10px]">Langkah 2 · Cek hasil</p>
          <h1 className="display text-[22px] font-semibold tracking-tight text-slate-900">
            Preview review belum bisa dibangun
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Dokumen ini sudah tersimpan di antrean, tetapi snapshot review-nya belum berhasil
            dibentuk dari file yang tersimpan. Coba refresh data atau periksa apakah file sumbernya
            masih bisa dibaca parser lokal.
          </p>
          <button type="button" onClick={goBackToInput} className="btn-lux btn-lux-secondary text-sm">
            Kembali ke input
          </button>
        </section>
        <IntakeHistoryPanels
          desaName={data.desa.nama}
          intakeHistory={intakeHistory.history}
          intakeHistoryError={intakeHistory.error}
          intakeHistoryLoading={intakeHistory.loading}
          versionHistory={versionHistory.versionHistory}
          versionHistoryError={versionHistory.error}
          versionHistoryLoading={versionHistory.loading}
        />
      </div>
    );
  }

  return (
    <>
      <IntakeResultHeader
        loading={false}
        canSubmit={true}
        onBackToInput={goBackToInput}
        onRunPipeline={refreshData}
        onContinueReview={scrollToReviewSection}
        runPipelineLabel="Refresh data"
        runPipelineMobileLabel="Refresh"
        continueLabel="Publish / reject"
        continueMobileLabel="Final"
      />

      <div className="space-y-4">
        <IntakeResultStep
          mode={readInputMode(result)}
          loading={false}
          result={result}
          selectedDesa={data.desa}
          selectedFile={null}
          reviewTitle={data.document.title}
          submittedReview={null}
          error={null}
          reviewSectionRef={reviewSectionRef}
          onChangeDesa={goBackToInput}
          onReviewTitleChange={() => undefined}
          onSubmitReview={scrollToReviewSection}
          onToggleInspector={() => setInspectorOpen((value) => !value)}
          finalReview={true}
          reviewActionSlot={
            <IntakeFinalReviewSection
              document={data.document}
              desa={data.desa}
              onDone={goToQueue}
              onRefreshSource={refreshData}
            />
          }
        />

        <IntakeHistoryPanels
          desaName={data.desa.nama}
          intakeHistory={intakeHistory.history}
          intakeHistoryError={intakeHistory.error}
          intakeHistoryLoading={intakeHistory.loading}
          versionHistory={versionHistory.versionHistory}
          versionHistoryError={versionHistory.error}
          versionHistoryLoading={versionHistory.loading}
        />
      </div>

      <IntakeInspectorDrawer
        result={result}
        open={inspectorOpen}
        onToggle={() => setInspectorOpen((value) => !value)}
      />
    </>
  );
}
