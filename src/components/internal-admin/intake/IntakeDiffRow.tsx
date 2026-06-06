"use client";

import type { AiMappableDesaField } from "@/lib/admin-claim/ai-mapping";
import { FIELD_LABELS } from "./constants";
import type { DiffEntry } from "./types";
import { formatDiffValue } from "./utils";

function DeltaPill({ type }: { type: DiffEntry["deltaType"] }) {
  if (type === "unchanged") return null;

  const styles: Record<string, string> = {
    added: "bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(5,95,70,0.12)]",
    updated: "bg-indigo-50 text-[#1E1B4B] shadow-[inset_0_0_0_1px_rgba(67,56,202,0.15)]",
    removed: "bg-rose-50 text-rose-900 shadow-[inset_0_0_0_1px_rgba(159,18,57,0.15)]",
  };
  const labels: Record<string, string> = { added: "baru", updated: "+", removed: "hapus" };

  return (
    <span
      className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[type] ?? ""}`}
    >
      {labels[type] ?? type}
    </span>
  );
}

export function IntakeDiffRow({ entry }: { entry: DiffEntry }) {
  const stripColor: Record<DiffEntry["deltaType"], string> = {
    added: "bg-emerald-500",
    updated: "bg-indigo-500",
    removed: "bg-rose-500",
    unchanged: "bg-slate-200",
  };
  const rowBg: Record<DiffEntry["deltaType"], string> = {
    added: "bg-emerald-50/60 hover:bg-emerald-50/90",
    updated: "bg-indigo-50/20 hover:bg-indigo-50/40",
    removed: "bg-rose-50/50 hover:bg-rose-50/80",
    unchanged: "bg-transparent hover:bg-slate-50/60",
  };
  const afterColor: Record<DiffEntry["deltaType"], string> = {
    added: "text-emerald-700 font-semibold",
    updated: "text-slate-900 font-medium",
    removed: "text-rose-600 line-through decoration-rose-300",
    unchanged: "text-slate-500",
  };

  const label = FIELD_LABELS[entry.field as AiMappableDesaField] ?? entry.field;
  const isAdded = entry.deltaType === "added";
  const isRemoved = entry.deltaType === "removed";
  const isChanged = entry.deltaType !== "unchanged";
  const beforeColor = isChanged ? "text-slate-400" : "text-slate-600";

  const beforeNode = isAdded ? (
    <span className="italic text-slate-400">— belum diisi</span>
  ) : (
    <span className={`${beforeColor} tabular-nums`}>{formatDiffValue(entry.previous)}</span>
  );
  const afterNode = isRemoved ? <span className="italic">— dihapus</span> : <span>{formatDiffValue(entry.next)}</span>;

  return (
    <>
      <div className={`sm:hidden rounded-xl px-3 py-2.5 transition-colors duration-150 ${rowBg[entry.deltaType]}`}>
        <div className="mb-1.5 flex items-center gap-2">
          <div className={`h-3 w-1 flex-shrink-0 rounded-sm ${stripColor[entry.deltaType]}`} />
          <span className="flex-1 truncate text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">{label}</span>
          <DeltaPill type={entry.deltaType} />
        </div>
        <div className="flex flex-wrap items-baseline gap-2 pl-3 text-[12.5px]">
          {beforeNode}
          {isChanged && <span className="text-[11px] text-slate-400">→</span>}
          {isChanged && <span className={`tabular-nums ${afterColor[entry.deltaType]}`}>{afterNode}</span>}
        </div>
      </div>

      <div
        className={`hidden rounded-2xl transition-colors duration-150 sm:grid ${rowBg[entry.deltaType]}`}
        style={{ gridTemplateColumns: "4px 180px 1fr 24px 1fr", gap: "16px", alignItems: "center", padding: "12px 18px" }}
      >
        <div className={`self-stretch rounded-sm ${stripColor[entry.deltaType]}`} style={{ minHeight: 20 }} />
        <div className="truncate text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">{label}</div>
        <div className="min-w-0 truncate">{beforeNode}</div>
        <div className="text-center text-sm font-medium text-slate-400">{isChanged ? "→" : "·"}</div>
        <div className={`flex min-w-0 flex-wrap items-baseline gap-1 text-[13.5px] tabular-nums ${afterColor[entry.deltaType]}`}>
          {afterNode}
          <DeltaPill type={entry.deltaType} />
        </div>
      </div>
    </>
  );
}
