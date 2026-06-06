"use client";

import { ArrowRight, FileWarning, Globe2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { InternalDashboardSummary } from "@/lib/internal-admin/dashboard-types";
import { Surface, ToneBadge, formatPercent, formatShortDate, formatWholeNumber } from "./shared";

function OrbitCoverage({
  tracked,
  officialTotal,
  percent,
}: {
  tracked: number;
  officialTotal: number;
  percent: number;
}) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const progress = (percent / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-[220px] w-[220px] items-center justify-center">
      <svg viewBox="0 0 220 220" className="h-full w-full">
        <defs>
          <linearGradient id="coverage-ring" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="58%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <radialGradient id="coverage-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(79,70,229,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="110" cy="110" r="94" fill="rgba(248,250,252,0.85)" />
        <circle cx="110" cy="110" r="82" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="16" />
        <circle
          cx="110"
          cy="110"
          r="82"
          fill="none"
          stroke="url(#coverage-ring)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          transform="rotate(-90 110 110)"
        />
        <circle cx="110" cy="110" r="58" fill="url(#coverage-core)" />
        <circle cx="110" cy="110" r="48" fill="white" stroke="rgba(79,70,229,0.08)" />
        <circle cx="110" cy="30" r="6" fill="#10B981" />
        <circle cx="184" cy="126" r="5" fill="#4F46E5" />
        <circle cx="55" cy="169" r="4" fill="#CBD5E1" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          coverage
        </span>
        <strong
          className="mt-1 text-[38px] font-semibold text-slate-950"
          style={{ letterSpacing: "-0.05em" }}
        >
          {formatPercent(percent)}
        </strong>
        <p className="mt-1 max-w-[120px] text-[11px] leading-5 text-slate-500">
          {formatWholeNumber(tracked)} dari {formatWholeNumber(officialTotal)} desa nasional
        </p>
      </div>
    </div>
  );
}

function MiniSignal({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      className="rounded-[1.35rem] bg-white/90 p-4"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50 text-[#1E1B4B]">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-3 text-[22px] font-semibold text-slate-950" style={{ letterSpacing: "-0.04em" }}>
        {value}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-slate-500">{note}</p>
    </div>
  );
}

export function DashboardHero({ summary }: { summary: InternalDashboardSummary }) {
  return (
    <Surface className="bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_28%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.92))]">
      <div className="grid gap-6 px-5 py-5 sm:px-7 sm:py-7 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone="info" label="Coverage nasional" />
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold text-slate-600"
              style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
            >
              {summary.coverage.officialReference.sourceName}
            </span>
          </div>

          <div className="max-w-2xl space-y-2">
            <h1
              className="text-[30px] font-semibold leading-tight text-slate-950 sm:text-[40px]"
              style={{ letterSpacing: "-0.05em" }}
            >
              Dashboard yang langsung menunjuk desa mana yang aman dipromosikan dan mana
              yang masih berisiko.
            </h1>
            <p className="text-[14px] leading-7 text-slate-600 sm:text-[15px]">
              Bukan dinding angka. Ini radar keputusan untuk melihat coverage nasional,
              kualitas data publik, backlog dokumen, dan governance yang masih bocor.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/internal-admin/documents" className="btn-lux-primary">
              Buka Antrean Dokumen
            </Link>
            <Link href="/internal-admin/village-data?tab=desa-data" className="btn-lux-secondary">
              Buka Data Desa
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniSignal
              icon={<Globe2 size={15} aria-hidden />}
              label="Desa source-backed"
              value={formatWholeNumber(summary.coverage.sourceBackedDesaCount)}
              note="Sudah punya data publik nyata yang bisa diandalkan."
            />
            <MiniSignal
              icon={<FileWarning size={15} aria-hidden />}
              label="Masih dummy"
              value={formatWholeNumber(summary.coverage.fallbackDesaCount)}
              note="Masih hidup dari fallback dan belum cukup aman untuk dibanggakan."
            />
            <MiniSignal
              icon={<ShieldCheck size={15} aria-hidden />}
              label="Verified admin"
              value={formatWholeNumber(summary.admins.verifiedMemberCount)}
              note="Admin desa utama yang sudah aktif menjaga jalur dokumen."
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[1.7rem] bg-white/75 p-4 sm:p-5" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
          <OrbitCoverage
            tracked={summary.coverage.trackedDesaCount}
            officialTotal={summary.coverage.officialTotalDesaCount}
            percent={summary.coverage.coveragePercent}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-slate-50 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Desa di PantauDesa
              </p>
              <p className="mt-1 text-[24px] font-semibold text-slate-950">
                {formatWholeNumber(summary.coverage.trackedDesaCount)}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                Referensi nasional {formatWholeNumber(summary.coverage.officialTotalDesaCount)} desa.
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Belum usable
              </p>
              <p className="mt-1 text-[24px] font-semibold text-slate-950">
                {formatWholeNumber(summary.coverage.noUsablePublicDataCount)}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                Desa yang sudah tercatat, tapi belum punya data publik yang bisa dipakai.
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-[12px] text-slate-600"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
          >
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-900">Sumber acuan coverage</p>
              <p>
                {summary.coverage.officialReference.sourceName} ·{" "}
                {formatShortDate(summary.coverage.officialReference.sourceDate)}
              </p>
            </div>
            <Link
              href={summary.coverage.officialReference.sourceUrl}
              target="_blank"
              className="inline-flex items-center gap-1 font-semibold text-[#1E1B4B]"
            >
              Buka referensi
              <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            Last checked {formatShortDate(summary.coverage.officialReference.lastCheckedAt)}
          </p>
        </div>
      </div>
    </Surface>
  );
}
