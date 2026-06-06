"use client";

import { useState } from "react";
import { CheckSquare, Square, ChevronDown, ChevronUp, ExternalLink, ShieldAlert } from "lucide-react";
import { PRE_REPORT } from "@/lib/copy";

interface Props {
  kabupaten: string;
}

export default function PreReportChecklistCard({ kabupaten }: Props) {
  const [checked, setChecked] = useState<boolean[]>(PRE_REPORT.checklist.map(() => false));
  const [open, setOpen]       = useState(false);

  const allChecked = checked.every(Boolean);

  function toggle(i: number) {
    setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden shadow-sm">

      {/* Header — always visible, acts as gate label */}
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldAlert size={16} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800">{PRE_REPORT.gateTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{PRE_REPORT.gateSubtitle}</p>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={open ? "Sembunyikan langkah persiapan" : "Tampilkan langkah persiapan"}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 rounded-lg"
        >
          {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
          {open ? "Sembunyikan" : "Cek dulu"}
        </button>
      </div>

      {/* Expandable checklist */}
      {open && (
        <div className="border-t border-amber-200 bg-white px-5 py-4 space-y-3">

          <ol className="space-y-2.5">
            {PRE_REPORT.checklist.map((item, i) => (
              <li key={i}>
                <button
                  onClick={() => toggle(i)}
                  aria-pressed={checked[i]}
                  className="w-full flex items-start gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 rounded-lg"
                >
                  <span className="flex-shrink-0 mt-0.5">
                    {checked[i]
                      ? <CheckSquare size={18} className="text-emerald-600" aria-hidden />
                      : <Square size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" aria-hidden />
                    }
                  </span>
                  <span className={`text-sm leading-relaxed transition-colors ${checked[i] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {item}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          {/* Reporting links — only fully visible after all checked */}
          <div className={`mt-4 rounded-xl border p-4 transition-all ${allChecked ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50 opacity-60 pointer-events-none select-none"}`}>
            <p className="text-xs font-bold text-slate-700 mb-3">
              {allChecked ? "Jalur pelaporan resmi:" : "Centang semua langkah di atas untuk membuka jalur pelaporan"}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="https://www.lapor.go.id"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={allChecked ? 0 : -1}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              >
                <ExternalLink size={12} aria-hidden /> {PRE_REPORT.lapor}
              </a>
              <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                {PRE_REPORT.hotline}
              </span>
              <span className="inline-flex items-center justify-center gap-1 text-xs text-slate-500 px-3 py-2.5 rounded-xl border border-slate-100 bg-white">
                {PRE_REPORT.inspektorat(kabupaten)}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-amber-700/80 leading-relaxed pt-1">
            {PRE_REPORT.note}
          </p>
        </div>
      )}
    </div>
  );
}
