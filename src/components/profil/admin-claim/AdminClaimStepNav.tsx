import type { ClaimStep } from "@/components/profil/admin-claim/adminClaimCopy";

export default function AdminClaimStepNav({
  steps,
  currentStep,
  onSelect,
}: {
  steps: Array<{ step: ClaimStep; label: string }>;
  currentStep: ClaimStep;
  onSelect: (step: ClaimStep) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((item) => {
        const active = currentStep === item.step;
        const canNavigate = item.step <= currentStep;

        return (
          <button
            key={item.step}
            type="button"
            onClick={canNavigate ? () => onSelect(item.step) : undefined}
            disabled={!canNavigate}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 ${
              active
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 cursor-default"
                : canNavigate
                ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
                : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
            }`}
          >
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {item.step}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
