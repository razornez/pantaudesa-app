import { ArrowLeft, ChevronRight, RotateCw, Send } from "lucide-react";

interface IntakeResultHeaderProps {
  loading: boolean;
  canSubmit: boolean;
  onBackToInput: () => void;
  onRunPipeline: () => void;
  onContinueReview: () => void;
  runPipelineLabel?: string;
  runPipelineMobileLabel?: string;
  continueLabel?: string;
  continueMobileLabel?: string;
}

export function IntakeResultHeader({
  loading,
  canSubmit,
  onBackToInput,
  onRunPipeline,
  onContinueReview,
  runPipelineLabel = "Ulangi pipeline",
  runPipelineMobileLabel = "Ulangi",
  continueLabel = "Kirim ke review",
  continueMobileLabel = "Review",
}: IntakeResultHeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass" style={{ borderRadius: 0 }}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-[12px] text-slate-500 min-w-0">
          <span className="font-semibold text-slate-900">PantauDesa</span>
          <ChevronRight size={10} aria-hidden />
          <span>Admin</span>
          <ChevronRight size={10} aria-hidden />
          <span className="text-slate-900 font-medium truncate">Intake workbench</span>
        </div>

        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 text-[11px] text-slate-500"
          style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E1B4B]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E1B4B]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <span className="ml-1">
            Langkah <span className="font-semibold text-slate-900">2</span> · Cek hasil
          </span>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onBackToInput}
          className="btn-lux btn-lux-ghost text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} aria-hidden />
          <span className="hidden sm:inline">Kembali ke input</span>
          <span className="sm:hidden">Kembali</span>
        </button>
        <button
          type="button"
          onClick={onRunPipeline}
          disabled={loading}
          className="btn-lux btn-lux-secondary text-xs inline-flex items-center gap-1.5"
        >
          <RotateCw size={13} aria-hidden />
          <span className="hidden sm:inline">{runPipelineLabel}</span>
          <span className="sm:hidden">{runPipelineMobileLabel}</span>
        </button>
        <button
          type="button"
          onClick={onContinueReview}
          disabled={!canSubmit || loading}
          className="btn-lux btn-lux-primary text-xs inline-flex items-center gap-1.5"
        >
          <Send size={13} aria-hidden />
          <span className="hidden sm:inline">{continueLabel}</span>
          <span className="sm:hidden">{continueMobileLabel}</span>
        </button>
      </div>
    </header>
  );
}
