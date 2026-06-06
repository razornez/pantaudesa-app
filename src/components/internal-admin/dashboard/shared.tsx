"use client";

import type { ReactNode } from "react";
import { AlertCircle, ArrowUpRight, CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import type { DashboardPriorityTone } from "@/lib/internal-admin/dashboard-types";

export function formatWholeNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
    minimumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)}%`;
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeDays(value: string | null): string {
  if (!value) return "Belum pernah publish";
  const target = new Date(value).getTime();
  const diff = Math.floor((Date.now() - target) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Hari ini";
  if (diff === 1) return "1 hari lalu";
  return `${diff} hari lalu`;
}

export function toneClasses(tone: DashboardPriorityTone): {
  badge: string;
  border: string;
  glow: string;
  dot: string;
} {
  switch (tone) {
    case "critical":
      return {
        badge: "bg-rose-50 text-rose-900",
        border: "rgba(244,63,94,0.18)",
        glow: "from-rose-100/90 via-white to-rose-50/60",
        dot: "bg-rose-500",
      };
    case "warning":
      return {
        badge: "bg-amber-50 text-amber-900",
        border: "rgba(217,119,6,0.18)",
        glow: "from-amber-100/80 via-white to-amber-50/60",
        dot: "bg-amber-500",
      };
    case "good":
      return {
        badge: "bg-emerald-50 text-emerald-900",
        border: "rgba(16,185,129,0.16)",
        glow: "from-emerald-100/85 via-white to-emerald-50/55",
        dot: "bg-emerald-500",
      };
    default:
      return {
        badge: "bg-sky-50 text-sky-900",
        border: "rgba(56,189,248,0.16)",
        glow: "from-sky-100/80 via-white to-sky-50/55",
        dot: "bg-sky-500",
      };
  }
}

export function ToneBadge({
  tone,
  label,
}: {
  tone: DashboardPriorityTone;
  label: string;
}) {
  const styles = toneClasses(tone);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles.badge}`}
      style={{ boxShadow: `inset 0 0 0 1px ${styles.border}` }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  note,
  action,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <p className="eyebrow text-indigo-600">{eyebrow}</p>
        <h2
          className="text-[20px] font-semibold leading-tight text-slate-900 sm:text-[26px]"
          style={{ letterSpacing: "-0.03em" }}
        >
          {title}
        </h2>
        {note ? <p className="max-w-3xl text-[13px] leading-6 text-slate-500">{note}</p> : null}
      </div>
      {action ? <div className="sm:pb-1">{action}</div> : null}
    </div>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[1.9rem] bg-white ${className}`}
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 4px 12px -4px rgba(15,23,42,0.07), 0 20px 44px -24px rgba(15,23,42,0.14)",
      }}
    >
      {children}
    </section>
  );
}

export function EmptyNotice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="notice-card notice-info flex items-start gap-3 text-sm">
      <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-slate-600">{body}</p>
      </div>
    </div>
  );
}

export function ToneIcon({
  tone,
}: {
  tone: DashboardPriorityTone;
}) {
  if (tone === "critical") return <TriangleAlert size={15} aria-hidden />;
  if (tone === "warning") return <AlertCircle size={15} aria-hidden />;
  if (tone === "good") return <CheckCircle2 size={15} aria-hidden />;
  return <Sparkles size={15} aria-hidden />;
}

export function SecondaryLink({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
      {label}
      <ArrowUpRight size={13} aria-hidden />
    </span>
  );
}

