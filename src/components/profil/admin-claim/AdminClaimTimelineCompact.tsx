import { Check } from "lucide-react";
import { TIMELINE_DOT_COLORS, type AdminClaimTimelineStep } from "./adminClaimTimelineModel";

export function AdminClaimTimelineCompact({
  steps,
  doneCount,
  activeIndex,
  allDone,
  total,
}: {
  steps: AdminClaimTimelineStep[];
  doneCount: number;
  activeIndex: number;
  allDone: boolean;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-slate-900">Progress Klaim Admin</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {allDone ? "Semua tahap selesai." : activeIndex >= 0 ? `Saat ini di langkah ${activeIndex + 1} dari ${total}.` : `${doneCount} dari ${total} langkah sudah selesai.`}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          {doneCount}/{total}
        </span>
      </div>

      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
        {steps.map((step) => (
          <div key={step.num} className={`h-full ${TIMELINE_DOT_COLORS[step.state]}`} style={{ width: `${100 / total}%` }} />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {steps.map((step) => (
          <div key={step.num} className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${TIMELINE_DOT_COLORS[step.state]}`}>
            {step.state === "done" ? <Check size={8} strokeWidth={3} className="text-white" /> : <span className="text-[7px] font-black text-white">{step.num}</span>}
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        {allDone ? "Selesai" : activeIndex >= 0 ? `Langkah ${activeIndex + 1} aktif` : `${doneCount}/${total} langkah`}
      </p>

      <div className="mt-3 space-y-2">
        {steps.map((step) => (
          <div key={step.num} className="flex items-start gap-2">
            <div className={`mt-1 h-2 w-2 rounded-full ${TIMELINE_DOT_COLORS[step.state]}`} />
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold ${step.state === "done" ? "text-emerald-700" : step.state === "active" ? "text-indigo-700" : "text-slate-500"}`}>
                {step.num}. {step.title.replace("Metode: ", "").replace(" aktif", "")}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{step.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
