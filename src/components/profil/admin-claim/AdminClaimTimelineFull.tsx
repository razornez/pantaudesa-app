import { Check } from "lucide-react";
import {
  TIMELINE_STATE_STYLES,
  type AdminClaimTimelineStep,
} from "./adminClaimTimelineModel";

export function AdminClaimTimelineFull({
  steps,
  activeIndex,
  allDone,
}: {
  steps: AdminClaimTimelineStep[];
  activeIndex: number;
  allDone: boolean;
}) {
  return (
    <div className="lux-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-black text-slate-900">Progress Klaim Admin</p>
        {activeIndex >= 0 ? (
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600">
            Langkah {activeIndex + 1} aktif
          </span>
        ) : allDone ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
            Selesai
          </span>
        ) : null}
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const styles = TIMELINE_STATE_STYLES[step.state];
          const isLast = index === steps.length - 1;

          return (
            <div key={step.num} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ${styles.dot}`}>
                  {step.state === "done" ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-black">{step.num}</span>}
                </div>
                {!isLast && <div className={`min-h-6 w-0.5 flex-1 ${styles.line}`} />}
              </div>

              <div className={`mb-4 flex-1 rounded-xl border p-3 ${styles.card}`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className={`text-xs ${styles.title}`}>{step.title}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${styles.badge}`}>
                    {step.state === "done" ? "OK" : step.num}
                  </span>
                </div>
                <p className={`text-[10px] leading-relaxed ${styles.note}`}>{step.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
