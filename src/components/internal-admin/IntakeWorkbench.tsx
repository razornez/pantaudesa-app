"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { TemplateFieldEngineViewModel } from "@/lib/village-data/template-field-contract";
import type { SourceTypeCode } from "@/lib/village-data/source-policy";

import type {
  IntakeMode,
} from "./intake/types";
import {
  useDesaOptions,
  useIntakeHistory,
  useIntakePipeline,
  useVersionHistory,
} from "./intake/hooks";
import {
  classifyPipelineError,
  type ErrorState,
} from "./intake/error-state";
import { getReviewableContentCount } from "./intake/IntakeStatusHelpers";
import { buildSuggestedReviewTitle } from "./intake/constants";
import { IntakeInputStep } from "./intake/IntakeInputStep";
import { IntakeHistoryPanels } from "./intake/IntakeHistoryPanels";
import { requestTemplateFields } from "./intake/api";
import {
  buildDefaultSourceName,
  DEFAULT_INTAKE_SOURCE_TYPE,
} from "./intake/source-mode";

export default function IntakeWorkbench() {
  const router = useRouter();

  const [mode, setMode] = useState<IntakeMode>("upload");
  const [textValue, setTextValue] = useState("");
  const [useAiMapping, setUseAiMapping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [desaFocused, setDesaFocused] = useState(false);
  const [sourceTypeCode, setSourceTypeCode] =
    useState<SourceTypeCode>(DEFAULT_INTAKE_SOURCE_TYPE);
  const [sourceName, setSourceName] = useState("");
  const [sourceNameTouched, setSourceNameTouched] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [sourceValues, setSourceValues] = useState<Record<string, string>>({});
  const [sourceTemplate, setSourceTemplate] = useState<TemplateFieldEngineViewModel | null>(null);
  const [sourceTemplateLoading, setSourceTemplateLoading] = useState(false);
  const [sourceTemplateError, setSourceTemplateError] = useState<string | null>(null);

  const {
    desaSearch,
    setDesaSearch,
    desaOptions,
    selectedDesa,
    isPickerOpen,
    loading: desaLoading,
    selectDesa,
    clearSelectedDesa,
    openPicker,
  } = useDesaOptions();

  const {
    loading,
    error: pipelineError,
    runPipeline,
    submitToReview,
    submitSourceReview,
    reset: resetPipeline,
  } = useIntakePipeline();

  const intakeHistory = useIntakeHistory();
  const versionHistory = useVersionHistory(selectedDesa?.id ?? null);
  const effectiveSourceName = useMemo(
    () =>
      sourceNameTouched
        ? sourceName
        : buildDefaultSourceName(sourceTypeCode, selectedDesa?.nama ?? null),
    [selectedDesa?.nama, sourceName, sourceNameTouched, sourceTypeCode],
  );

  const loadSourceTemplate = useCallback(async (desaId: string) => {
    setSourceTemplateLoading(true);
    setSourceTemplateError(null);

    try {
      const payload = await requestTemplateFields(desaId);
      if ("error" in payload) {
        setSourceTemplate(null);
        setSourceTemplateError(payload.error);
        return;
      }

      setSourceTemplate(payload);
    } catch (requestError) {
      setSourceTemplate(null);
      setSourceTemplateError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal memuat field template desa.",
      );
    } finally {
      setSourceTemplateLoading(false);
    }
  }, []);

  const handleRunPipeline = useCallback(async () => {
    setError(null);
    if (mode === "source") {
      if (!selectedDesa) {
        setError({ message: "Pilih desa target sebelum melanjutkan review sumber.", tone: "warn" });
        return;
      }

      const submitted = await submitSourceReview({
        desaIdValue: selectedDesa.id,
        sourceTypeCode,
        sourceName: effectiveSourceName,
        sourceUrl,
        evidenceNote,
        values: sourceValues,
      });

      if (submitted) {
        void intakeHistory.refetch();
        router.push(`/internal-admin/intake/${encodeURIComponent(submitted.documentId)}`);
      }
      return;
    }

    const data = await runPipeline({
      mode,
      selectedFile,
      textValue,
      desaIdValue: selectedDesa?.id ?? "",
      useAiMapping,
    });

    if (!data) return;

    if (!selectedDesa) {
      setError({ message: "Pilih desa target sebelum melanjutkan review.", tone: "warn" });
      return;
    }

    if (!data.validation.ok) {
      setError({
        message: "Validasi belum lolos. Perbaiki isi dokumen atau gunakan paste manual.",
        tone: "danger",
      });
      return;
    }

    if (getReviewableContentCount(data) === 0) {
      setError({
        message: "Belum ada konten yang cukup untuk dibawa ke review.",
        tone: "warn",
      });
      return;
    }

    const submitted = await submitToReview({
      mode,
      selectedFile,
      textValue,
      desaIdValue: selectedDesa.id,
      useAiMapping,
      reviewTitle: buildSuggestedReviewTitle({ mode, selectedFile, selectedDesa }),
    });

    if (submitted) {
      void intakeHistory.refetch();
      resetPipeline();
      router.push(`/internal-admin/intake/${encodeURIComponent(submitted.documentId)}`);
    }
  }, [
    intakeHistory,
    mode,
    runPipeline,
    router,
    selectedDesa,
    selectedFile,
    effectiveSourceName,
    sourceTypeCode,
    sourceUrl,
    sourceValues,
    evidenceNote,
    submitSourceReview,
    submitToReview,
    textValue,
    useAiMapping,
    resetPipeline,
  ]);
  const displayError = error ?? (pipelineError ? classifyPipelineError(pipelineError) : null);

  return (
    <div className="space-y-4">
      <IntakeInputStep
        mode={mode}
        loading={loading}
        useAiMapping={useAiMapping}
        textValue={textValue}
        selectedFile={selectedFile}
        desaSearch={desaSearch}
        desaOptions={desaOptions}
        selectedDesa={selectedDesa}
        isPickerOpen={isPickerOpen}
        desaLoading={desaLoading}
        desaFocused={desaFocused}
        displayError={displayError}
        sourceTypeCode={sourceTypeCode}
        sourceName={effectiveSourceName}
        sourceUrl={sourceUrl}
        evidenceNote={evidenceNote}
        sourceValues={sourceValues}
        sourceTemplate={sourceTemplate}
        sourceTemplateLoading={sourceTemplateLoading}
        sourceTemplateError={sourceTemplateError}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          if (nextMode === "source" && selectedDesa) {
            void loadSourceTemplate(selectedDesa.id);
          }
        }}
        onAiToggle={setUseAiMapping}
        onTextChange={setTextValue}
        onFileChange={setSelectedFile}
        onSourceTypeCodeChange={setSourceTypeCode}
        onSourceNameChange={(value) => {
          setSourceNameTouched(true);
          setSourceName(value);
        }}
        onSourceUrlChange={setSourceUrl}
        onEvidenceNoteChange={setEvidenceNote}
        onSourceValueChange={(fieldKey, value) => {
          setSourceValues((current) => ({ ...current, [fieldKey]: value }));
        }}
        onDesaSearchChange={(value) => {
          setDesaSearch(value);
          openPicker();
        }}
        onDesaFocus={() => {
          setDesaFocused(true);
          openPicker();
        }}
        onDesaBlur={() => setTimeout(() => setDesaFocused(false), 150)}
        onSelectDesa={(desa) => {
          selectDesa(desa);
          setDesaFocused(false);
          if (mode === "source") {
            void loadSourceTemplate(desa.id);
          }
        }}
        onClearSelectedDesa={() => {
          clearSelectedDesa();
          setSourceTemplate(null);
          setSourceTemplateError(null);
          setSourceTemplateLoading(false);
        }}
        onRunPipeline={handleRunPipeline}
      />

      <IntakeHistoryPanels
        desaName={selectedDesa?.nama ?? null}
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
