"use client";

import { LineChart, PlugZap, ShieldAlert } from "lucide-react";
import type { InternalDashboardSummary } from "@/lib/internal-admin/dashboard-types";
import { SectionHeading, Surface } from "./shared";

export function TrafficPanel({ summary }: { summary: InternalDashboardSummary }) {
  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Traffic publik"
        title="Kita belum boleh ngarang angka pengunjung"
        note="Karena provider analytics belum aktif, dashboard ini lebih jujur menampilkan status integrasi daripada memalsukan tren."
      />

      <Surface>
        <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(160deg,rgba(79,70,229,0.10),rgba(255,255,255,0.94)_45%,rgba(14,165,233,0.08))] p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-white text-[#1E1B4B]" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                <PlugZap size={22} aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status provider
                </p>
                <p className="mt-1 text-[22px] font-semibold text-slate-950">
                  {summary.traffic.providerLabel}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-white/75 p-3"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.04)" }}
                >
                  <div className="h-1.5 rounded-full bg-slate-200" />
                  <div className="mt-3 h-7 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.45rem] bg-slate-50/85 p-4" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-sky-700" style={{ boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.12)" }}>
                  <LineChart size={18} aria-hidden />
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-slate-950">{summary.traffic.title}</p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600">{summary.traffic.body}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] bg-white p-4" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Saat analytics aktif
                </p>
                <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
                  <li>Total pengunjung hari ini</li>
                  <li>Tren 7 dan 30 hari</li>
                  <li>Halaman desa paling ramai</li>
                </ul>
              </div>
              <div className="rounded-[1.35rem] bg-white p-4" style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Kenapa penting
                </p>
                <div className="mt-3 flex items-start gap-2 text-[13px] leading-6 text-slate-600">
                  <ShieldAlert size={16} className="mt-1 shrink-0 text-amber-600" aria-hidden />
                  <p>Tanpa traffic, kita belum tahu desa mana yang pantas dipromosikan atau halaman mana yang perlu dibenahi dulu.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}

