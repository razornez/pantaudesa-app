"use client";

import { APBDesItem } from "@/lib/types";
import { SECTION, BIDANG_CITIZEN_LABELS } from "@/lib/copy";
import { formatRupiah } from "@/lib/utils";

interface Props {
  items: APBDesItem[];
  isDark?: boolean;
}

function barColor(persen: number) {
  if (persen >= 85) return "bg-emerald-500";
  if (persen >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function textColor(persen: number, isDark: boolean) {
  if (isDark) {
    if (persen >= 85) return "text-emerald-400";
    if (persen >= 60) return "text-amber-400";
    return "text-rose-400";
  }
  if (persen >= 85) return "text-emerald-600";
  if (persen >= 60) return "text-amber-600";
  return "text-rose-600";
}

export default function APBDesBreakdown({ items, isDark = false }: Props) {
  const card     = isDark ? "bg-slate-800/70 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm";
  const heading  = isDark ? "text-white"    : "text-slate-800";
  const sub      = isDark ? "text-slate-400" : "text-slate-500";
  const label    = isDark ? "text-slate-200" : "text-slate-700";
  const hint     = isDark ? "text-slate-500" : "text-slate-400";
  const amount   = isDark ? "text-slate-300" : "text-slate-600";
  const muted    = isDark ? "text-slate-500" : "text-slate-400";
  const progressBg = isDark ? "bg-white/10" : "bg-slate-100";
  const badge    = isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-600";

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>
      <div className="mb-4">
        <h2 className={`text-base font-semibold ${heading}`}>{SECTION.apbdes}</h2>
        <p className={`text-xs mt-0.5 ${sub}`}>{SECTION.apbdesSub}</p>
      </div>

      <div className="space-y-5">
        {items.map((item) => {
          const citizen = BIDANG_CITIZEN_LABELS[item.kode];
          const lbl     = citizen?.label ?? item.bidang;
          const hnt     = citizen?.hint;

          return (
            <div key={item.kode}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center mt-0.5 ${badge}`}>
                    {item.kode}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-snug ${label}`}>{lbl}</p>
                    {hnt && <p className={`text-xs mt-0.5 ${hint}`}>{hnt}</p>}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-sm font-black ${textColor(item.persentase, isDark)}`}>
                  {item.persentase}%
                </span>
              </div>

              <div className={`h-2 rounded-full overflow-hidden mb-1 ${progressBg}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor(item.persentase)}`}
                  style={{ width: `${item.persentase}%` }}
                />
              </div>

              <div className={`flex justify-between text-xs ${muted}`}>
                <span>
                  Sudah dipakai:{" "}
                  <span className={`font-medium ${amount}`}>{formatRupiah(item.realisasi)}</span>
                </span>
                <span>dari {formatRupiah(item.anggaran)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
