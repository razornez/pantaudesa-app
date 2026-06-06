"use client";

import type { DashboardComponentHealthRow, InternalDashboardSummary } from "@/lib/internal-admin/dashboard-types";
import { SectionHeading, Surface, formatPercent, formatWholeNumber } from "./shared";

function arcPath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const startX = cx + radius * Math.cos(start);
  const startY = cy + radius * Math.sin(start);
  const endX = cx + radius * Math.cos(end);
  const endY = cy + radius * Math.sin(end);
  const largeArcFlag = end - start > Math.PI ? 1 : 0;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
}

function QualityOrbit({
  sourceBacked,
  fallback,
  missing,
}: {
  sourceBacked: number;
  fallback: number;
  missing: number;
}) {
  const total = Math.max(sourceBacked + fallback + missing, 1);
  const sourceAngle = (sourceBacked / total) * Math.PI * 2;
  const fallbackAngle = (fallback / total) * Math.PI * 2;
  const missingAngle = (missing / total) * Math.PI * 2;
  const base = -Math.PI / 2;

  return (
    <div className="relative mx-auto flex h-[270px] w-[270px] items-center justify-center">
      <svg viewBox="0 0 270 270" className="h-full w-full">
        <defs>
          <linearGradient id="quality-source" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="quality-fallback" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <circle cx="135" cy="135" r="104" fill="rgba(248,250,252,0.95)" />
        <path d={arcPath(135, 135, 90, base, base + sourceAngle)} stroke="url(#quality-source)" strokeWidth="20" fill="none" strokeLinecap="round" />
        <path d={arcPath(135, 135, 90, base + sourceAngle, base + sourceAngle + fallbackAngle)} stroke="url(#quality-fallback)" strokeWidth="20" fill="none" strokeLinecap="round" />
        <path d={arcPath(135, 135, 90, base + sourceAngle + fallbackAngle, base + sourceAngle + fallbackAngle + missingAngle)} stroke="#CBD5E1" strokeWidth="20" fill="none" strokeLinecap="round" />
        <circle cx="135" cy="135" r="60" fill="white" stroke="rgba(15,23,42,0.06)" />
        <circle cx="197" cy="88" r="7" fill="#4F46E5" />
        <circle cx="83" cy="196" r="8" fill="#10B981" />
        <circle cx="72" cy="83" r="5" fill="#CBD5E1" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          kualitas publik
        </span>
        <strong className="mt-2 text-[34px] font-semibold text-slate-950" style={{ letterSpacing: "-0.05em" }}>
          {formatPercent((sourceBacked / total) * 100)}
        </strong>
        <p className="mt-1 max-w-[130px] text-[11px] leading-5 text-slate-500">
          field publik yang benar-benar source-backed
        </p>
      </div>
    </div>
  );
}

function ComponentStrip({ component }: { component: DashboardComponentHealthRow }) {
  const total = Math.max(component.totalFields, 1);
  const sourceWidth = (component.sourceBackedFields / total) * 100;
  const fallbackWidth = (component.fallbackFields / total) * 100;
  const missingWidth = Math.max(0, 100 - sourceWidth - fallbackWidth);

  return (
    <div className="space-y-2 rounded-[1.25rem] bg-slate-50/70 p-3.5" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-700">
            {component.label}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {formatWholeNumber(component.sourceBackedFields)} source-backed · {formatWholeNumber(component.fallbackFields)} fallback
          </p>
        </div>
        <span className="text-[12px] font-semibold text-slate-900">
          {formatPercent(component.sourceBackedRatio)}
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white">
        <div className="bg-emerald-500" style={{ width: `${sourceWidth}%` }} />
        <div className="bg-indigo-400" style={{ width: `${fallbackWidth}%` }} />
        <div className="bg-slate-200" style={{ width: `${missingWidth}%` }} />
      </div>
    </div>
  );
}

export function DataQualitySection({ summary }: { summary: InternalDashboardSummary }) {
  const potentialFields = summary.quality.components.reduce(
    (total, component) => total + component.totalFields,
    0,
  );
  const missingFields = Math.max(0, potentialFields - summary.quality.publishedFieldCount);

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Kualitas data publik"
        title="Mana yang betul-betul real, mana yang masih hidup dari fallback"
        note="Section ini sengaja memisahkan source-backed, fallback, dan missing supaya tidak ada ilusi bahwa semua data publik sudah aman."
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Surface>
          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            <QualityOrbit
              sourceBacked={summary.quality.sourceBackedFieldCount}
              fallback={summary.quality.fallbackFieldCount}
              missing={missingFields}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] bg-emerald-50 p-3 text-emerald-950" style={{ boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.12)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">Source-backed</p>
                <p className="mt-2 text-[22px] font-semibold">{formatWholeNumber(summary.quality.sourceBackedFieldCount)}</p>
              </div>
              <div className="rounded-[1.2rem] bg-indigo-50 p-3 text-[#1E1B4B]" style={{ boxShadow: "inset 0 0 0 1px rgba(79,70,229,0.12)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">Fallback</p>
                <p className="mt-2 text-[22px] font-semibold">{formatWholeNumber(summary.quality.fallbackFieldCount)}</p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-100 p-3 text-slate-800" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">Belum terbaca</p>
                <p className="mt-2 text-[22px] font-semibold">{formatWholeNumber(missingFields)}</p>
              </div>
            </div>
          </div>
        </Surface>

        <Surface>
          <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Heat strip per komponen
                </p>
                <p className="mt-1 text-[13px] leading-6 text-slate-500">
                  Hijau artinya field yang sudah nyata. Indigo berarti masih tayang tapi bersandar pada fallback.
                </p>
              </div>
              <div className="hidden items-center gap-2 text-[10px] text-slate-500 sm:flex">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> real</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400" /> fallback</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> missing</span>
              </div>
            </div>

            <div className="grid gap-3">
              {summary.quality.components.map((component) => (
                <ComponentStrip key={component.componentKey} component={component} />
              ))}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

