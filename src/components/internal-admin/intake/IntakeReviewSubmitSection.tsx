import Link from "next/link";
import { buildSuggestedReviewTitle } from "./constants";
import { noticeClassForTone, type ErrorState } from "./error-state";
import { getReviewableContentCount } from "./IntakeStatusHelpers";
import type {
  DesaOption,
  IntakeMode,
  PipelineResult,
  SubmitReviewSuccess,
} from "./types";

interface IntakeReviewSubmitSectionProps {
  mode: IntakeMode;
  loading: boolean;
  result: PipelineResult;
  selectedDesa: DesaOption | null;
  selectedFile: File | null;
  reviewTitle: string;
  submittedReview: SubmitReviewSuccess | null;
  error: ErrorState | null;
  onReviewTitleChange: (value: string) => void;
  onSubmitReview: () => void;
}

export function IntakeReviewSubmitSection({
  mode,
  loading,
  result,
  selectedDesa,
  selectedFile,
  reviewTitle,
  submittedReview,
  error,
  onReviewTitleChange,
  onSubmitReview,
}: IntakeReviewSubmitSectionProps) {
  const canSubmit = Boolean(
    selectedDesa && result.validation.ok && !submittedReview && getReviewableContentCount(result) > 0,
  );

  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
        Langkah 2 · Cek lalu kirim ke review
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {submittedReview ? (
          <>
            Item sudah dikirim.{" "}
            <Link href={submittedReview.queueUrl} className="text-emerald-600 hover:underline">
              Lanjut ke review data →
            </Link>
          </>
        ) : (
          "Pastikan hasil otomatis masuk akal, lalu kirim ke review internal."
        )}
      </p>

      {!submittedReview ? (
        <div className="mt-4 space-y-3">
          {!selectedDesa ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Pilih desa target dulu.
            </div>
          ) : null}
          {result.validation.issues.some((issue) => issue.severity === "error") ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              Perbaiki error validasi dulu.
            </div>
          ) : null}
          {getReviewableContentCount(result) === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Belum ada hasil yang cukup kuat untuk review.
            </div>
          ) : null}
          <input
            type="text"
            value={reviewTitle}
            onChange={(event) => onReviewTitleChange(event.target.value.slice(0, 200))}
            placeholder={buildSuggestedReviewTitle({ mode, selectedFile, selectedDesa })}
            className="field-lux text-sm"
          />
          {error ? (
            <div className={`${noticeClassForTone(error.tone)} text-sm`}>{error.message}</div>
          ) : null}
          <button
            type="button"
            onClick={onSubmitReview}
            disabled={!canSubmit || loading}
            className="btn-lux btn-lux-success w-full sm:w-auto"
          >
            {loading ? "Menyimpan..." : "Kirim ke antrean review"}
          </button>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">Publish final tidak terjadi di layar ini.</p>
    </div>
  );
}
