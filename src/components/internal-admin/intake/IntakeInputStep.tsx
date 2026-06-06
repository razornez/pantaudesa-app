import { AlertTriangle, Info, Sparkles } from "lucide-react";
import type { TemplateFieldEngineViewModel } from "@/lib/village-data/template-field-contract";
import type { SourceTypeCode } from "@/lib/village-data/source-policy";
import { INTAKE_COPY } from "./constants";
import { IntakeSourceModeStep } from "./IntakeSourceModeStep";
import { noticeClassForTone, type ErrorState } from "./error-state";
import { formatBytes } from "./utils";
import type { DesaOption, IntakeMode } from "./types";

interface IntakeInputStepProps {
  mode: IntakeMode;
  loading: boolean;
  useAiMapping: boolean;
  textValue: string;
  selectedFile: File | null;
  desaSearch: string;
  desaOptions: DesaOption[];
  selectedDesa: DesaOption | null;
  isPickerOpen: boolean;
  desaLoading: boolean;
  desaFocused: boolean;
  displayError: ErrorState | null;
  sourceTypeCode: SourceTypeCode;
  sourceName: string;
  sourceUrl: string;
  evidenceNote: string;
  sourceValues: Record<string, string>;
  sourceTemplate: TemplateFieldEngineViewModel | null;
  sourceTemplateLoading: boolean;
  sourceTemplateError: string | null;
  onModeChange: (mode: IntakeMode) => void;
  onAiToggle: (checked: boolean) => void;
  onTextChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSourceTypeCodeChange: (value: SourceTypeCode) => void;
  onSourceNameChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onEvidenceNoteChange: (value: string) => void;
  onSourceValueChange: (fieldKey: string, value: string) => void;
  onDesaSearchChange: (value: string) => void;
  onDesaFocus: () => void;
  onDesaBlur: () => void;
  onSelectDesa: (desa: DesaOption) => void;
  onClearSelectedDesa: () => void;
  onRunPipeline: () => void;
}

export function IntakeInputStep({
  mode,
  loading,
  useAiMapping,
  textValue,
  selectedFile,
  desaSearch,
  desaOptions,
  selectedDesa,
  isPickerOpen,
  desaLoading,
  desaFocused,
  displayError,
  sourceTypeCode,
  sourceName,
  sourceUrl,
  evidenceNote,
  sourceValues,
  sourceTemplate,
  sourceTemplateLoading,
  sourceTemplateError,
  onModeChange,
  onAiToggle,
  onTextChange,
  onFileChange,
  onSourceTypeCodeChange,
  onSourceNameChange,
  onSourceUrlChange,
  onEvidenceNoteChange,
  onSourceValueChange,
  onDesaSearchChange,
  onDesaFocus,
  onDesaBlur,
  onSelectDesa,
  onClearSelectedDesa,
  onRunPipeline,
}: IntakeInputStepProps) {
  return (
    <>
      <div className="notice-card notice-info flex items-start gap-2 text-xs">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          <strong>{INTAKE_COPY.info.title}</strong>. {INTAKE_COPY.info.body}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="eyebrow text-[10px]">Langkah 1 · Siapkan bahan</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Input dokumen / teks</h2>

        <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onModeChange("upload")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${mode === "upload" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => onModeChange("paste")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${mode === "paste" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
          >
            Tempel teks
          </button>
          <button
            type="button"
            onClick={() => onModeChange("source")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${mode === "source" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
          >
            Sumber resmi
          </button>
        </div>

        {mode !== "source" ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {INTAKE_COPY.aiOption.label}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {INTAKE_COPY.aiOption.checkboxLabel}
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={useAiMapping}
                onChange={(event) => onAiToggle(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Aktif
            </label>
          </div>
        ) : null}

        {mode === "upload" ? (
          <div className="mt-4 space-y-2">
            <label className="field-label text-xs">
              File (DOCX, XLSX, PDF, TXT, CSV, JPG, PNG · maks 10 MB)
            </label>
            <input
              type="file"
              accept=".docx,.xlsx,.pdf,.txt,.csv,.jpg,.jpeg,.png,.webp"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              className="field-lux text-sm"
            />
            {selectedFile ? (
              <p className="text-xs text-slate-500">
                Dipilih:{" "}
                <span className="font-medium text-slate-700">{selectedFile.name}</span>{" "}
                ({formatBytes(selectedFile.size)})
              </p>
            ) : null}
          </div>
        ) : mode === "paste" ? (
          <div className="mt-4 space-y-2">
            <label className="field-label text-xs">Teks yang akan diproses</label>
            <textarea
              value={textValue}
              onChange={(event) => onTextChange(event.target.value)}
              rows={6}
              maxLength={50000}
              className="textarea-lux text-sm"
              placeholder="Salin teks dari dokumen di sini..."
            />
          </div>
        ) : null}

        {mode === "source" ? (
          <IntakeSourceModeStep
            selectedDesa={selectedDesa}
            sourceTypeCode={sourceTypeCode}
            sourceName={sourceName}
            sourceUrl={sourceUrl}
            evidenceNote={evidenceNote}
            values={sourceValues}
            loading={loading}
            template={sourceTemplate}
            templateLoading={sourceTemplateLoading}
            templateError={sourceTemplateError}
            onSourceTypeCodeChange={onSourceTypeCodeChange}
            onSourceNameChange={onSourceNameChange}
            onSourceUrlChange={onSourceUrlChange}
            onEvidenceNoteChange={onEvidenceNoteChange}
            onValueChange={onSourceValueChange}
          />
        ) : null}

        <div className="mt-4 space-y-2">
          <label className="field-label text-xs">Pilih desa (opsional)</label>
          <div className="relative">
            <input
              type="text"
              value={desaSearch}
              onChange={(event) => onDesaSearchChange(event.target.value)}
              onFocus={onDesaFocus}
              onBlur={onDesaBlur}
              className="field-lux text-sm pr-8"
              placeholder="Ketik nama desa..."
            />
            {desaLoading ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
              </span>
            ) : null}
          </div>
          {desaFocused && isPickerOpen && desaOptions.length > 0 && !selectedDesa ? (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lux-1">
              {desaOptions.map((desa) => (
                <button
                  key={desa.id}
                  type="button"
                  onClick={() => onSelectDesa(desa)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                >
                  <span className="font-semibold text-slate-900">{desa.nama}</span>
                  <span className="text-slate-500">
                    {desa.kecamatan}, {desa.kabupaten}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {selectedDesa ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs flex items-center">
              <span className="font-semibold text-slate-900">{selectedDesa.nama}</span>
              <span className="ml-2 text-slate-500">
                {selectedDesa.kecamatan}, {selectedDesa.kabupaten}
              </span>
              <button
                type="button"
                onClick={onClearSelectedDesa}
                className="ml-4 font-semibold text-indigo-600 hover:underline"
              >
                Hapus
              </button>
            </div>
          ) : null}
        </div>

        {displayError ? (
          <div className={`${noticeClassForTone(displayError.tone)} mt-4 flex items-start gap-2 text-xs`}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{displayError.message}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onRunPipeline}
          disabled={loading}
          className="btn-lux btn-lux-primary mt-4 flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Memproses...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {mode === "source" ? "Buka Step 2 review" : "Jalankan pipeline"}
            </>
          )}
        </button>
      </div>
    </>
  );
}
