import { OutputFisik } from "@/lib/types";
import { Target, CheckCircle2 } from "lucide-react";
import { SECTION } from "@/lib/copy";

interface Props {
  items: OutputFisik[];
  isDark?: boolean;
}

function barColor(p: number)  { return p >= 85 ? "bg-emerald-500" : p >= 60 ? "bg-amber-500" : "bg-rose-500"; }

function textColor(p: number, dark: boolean) {
  const map = dark
    ? { hi: "text-emerald-400", mid: "text-amber-400", lo: "text-rose-400" }
    : { hi: "text-emerald-600", mid: "text-amber-600", lo: "text-rose-600" };
  return p >= 85 ? map.hi : p >= 60 ? map.mid : map.lo;
}

function checkColor(p: number, dark: boolean) {
  const map = dark
    ? { hi: "text-emerald-400", mid: "text-amber-400", lo: "text-rose-400" }
    : { hi: "text-emerald-500", mid: "text-amber-500", lo: "text-rose-500" };
  return p >= 85 ? map.hi : p >= 60 ? map.mid : map.lo;
}

function fmt(v: number) { return Number.isInteger(v) ? String(v) : v.toFixed(1); }

export default function OutputFisikCards({ items, isDark = false }: Props) {
  const card       = isDark ? "bg-slate-800/70 border-white/[0.08]"  : "bg-white border-slate-100 shadow-sm";
  const innerCard  = isDark ? "bg-white/[0.04] border-white/[0.07]"  : "bg-slate-50 border-slate-100";
  const heading    = isDark ? "text-white"    : "text-slate-800";
  const sub        = isDark ? "text-slate-400" : "text-slate-500";
  const label      = isDark ? "text-slate-300" : "text-slate-700";
  const targetLbl  = isDark ? "text-slate-500" : "text-slate-400";
  const targetVal  = isDark ? "text-slate-300" : "text-slate-700";
  const progressBg = isDark ? "bg-white/10"   : "bg-slate-200";

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>
      <div className="mb-4">
        <h2 className={`text-base font-semibold ${heading}`}>{SECTION.outputFisik}</h2>
        <p className={`text-xs mt-0.5 ${sub}`}>{SECTION.outputFisikSub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className={`rounded-xl border p-3.5 ${innerCard}`}>
            <div className="flex items-start gap-1.5 mb-2">
              <Target size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className={`text-xs font-semibold leading-tight ${label}`}>{item.label}</span>
            </div>

            <div className="mb-1">
              <p className={`text-xs ${targetLbl}`}>Seharusnya ada</p>
              <p className={`text-sm font-bold ${targetVal}`}>{fmt(item.target)} {item.satuan}</p>
            </div>
            <div className="mb-2">
              <p className={`text-xs ${targetLbl}`}>Sudah ada/dikerjakan</p>
              <p className={`text-xl font-black ${textColor(item.persentase, isDark)}`}>
                {fmt(item.realisasi)}{" "}
                <span className={`text-xs font-normal ${targetLbl}`}>{item.satuan}</span>
              </p>
            </div>

            <div className={`h-1.5 rounded-full overflow-hidden mb-1.5 ${progressBg}`}>
              <div
                className={`h-full rounded-full ${barColor(item.persentase)}`}
                style={{ width: `${Math.min(100, item.persentase)}%` }}
              />
            </div>

            <div className="flex items-center gap-1">
              <CheckCircle2 size={11} className={checkColor(item.persentase, isDark)} />
              <span className={`text-xs font-semibold ${textColor(item.persentase, isDark)}`}>
                {item.persentase}% tercapai
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
