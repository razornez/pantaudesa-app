import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

export function StatPill({
  color,
  count,
  label,
}: {
  color: "emerald" | "amber" | "slate";
  count: number;
  label: string;
}) {
  const styles = {
    emerald:
      "bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(5,95,70,0.12)]",
    amber:
      "bg-amber-50 text-amber-900 shadow-[inset_0_0_0_1px_rgba(146,64,14,0.14)]",
    slate:
      "bg-slate-100 text-slate-700 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold ${styles[color]}`}
    >
      <span className="tabular-nums font-bold">{count}</span> {label}
    </span>
  );
}

export function FieldStatusPill({ publishable }: { publishable: boolean }) {
  return publishable ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex-shrink-0">
      <CheckCircle2 size={9} aria-hidden /> publishable
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 flex-shrink-0"
      style={{ boxShadow: "inset 0 0 0 1px rgba(180,83,9,0.14)" }}
    >
      <Clock3 size={9} aria-hidden /> belum bisa terbit
    </span>
  );
}

export function DesaStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "pill-ok",
    needs_review: "pill-warn",
    demo: "pill-info",
    imported: "pill-info",
    outdated: "pill-warn",
    rejected: "pill-danger",
  };

  return (
    <span
      className={`${map[status] ?? "pill-info"} inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold`}
    >
      {status}
    </span>
  );
}

export function VersionStatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PUBLISHED: {
      cls: "bg-emerald-50 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(5,95,70,0.12)]",
      label: "Diterbitkan",
    },
    REVIEW_READY: {
      cls: "bg-indigo-50 text-[#1E1B4B] shadow-[inset_0_0_0_1px_rgba(67,56,202,0.12)]",
      label: "Siap review",
    },
    REJECTED: {
      cls: "bg-rose-50 text-rose-800 shadow-[inset_0_0_0_1px_rgba(159,18,57,0.12)]",
      label: "Ditolak",
    },
    REPLACED: {
      cls: "bg-slate-100 text-slate-600 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]",
      label: "Digantikan",
    },
    FAILED: {
      cls: "bg-rose-50 text-rose-800 shadow-[inset_0_0_0_1px_rgba(159,18,57,0.12)]",
      label: "Gagal",
    },
  };

  const state = map[status] ?? { cls: "bg-slate-100 text-slate-600", label: status };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${state.cls}`}
    >
      {state.label}
    </span>
  );
}

export function FieldValue({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 bg-white"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 font-semibold mb-0.5">
        {label}
      </p>
      <p className="text-[12.5px] font-medium text-slate-900 truncate">
        {value ?? <span className="text-slate-300 font-normal italic">— belum diisi</span>}
      </p>
    </div>
  );
}

export function SkeletonCards({
  count,
  height = "h-28",
}: {
  count: number;
  height?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`rounded-2xl bg-slate-100 ${height}`} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  note,
}: {
  icon: ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 py-10 px-6 flex flex-col items-center gap-2 text-center">
      <span className="text-slate-300">{icon}</span>
      <p className="text-[13px] font-semibold text-slate-600">{title}</p>
      <p className="text-[12px] text-slate-400 max-w-xs">{note}</p>
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="notice-card notice-danger flex items-start gap-2 text-sm">
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
