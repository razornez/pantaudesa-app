import { UserRound } from "lucide-react";
import type { Desa } from "@/lib/types";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

const CIRC = 753.98; // 2π·120

export default function ChTransparansi({ desa, chapterNo, sourceNote }: { desa: Desa; chapterNo: string; sourceNote?: SourceNote }) {
  const skor = desa.skorTransparansi;
  const total = skor?.total ?? 0;
  const arcTo = (CIRC * (1 - Math.max(0, Math.min(100, total)) / 100)).toFixed(2);

  const subScores = skor
    ? [
        { label: "Ketepatan pelaporan", value: skor.ketepatan },
        { label: "Kelengkapan dokumen", value: skor.kelengkapan },
        { label: "Responsif ke warga", value: skor.responsif },
        { label: "Konsistensi data", value: skor.konsistensi },
      ]
    : [];

  const perangkat = desa.perangkat ?? [];

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="TRANSPARANSI"
      ribbonDot="var(--color-good-500)"
      stripGradient="linear-gradient(90deg,#10B981,#F59E0B,#F43F5E)"
      tagText="KETERBUKAAN INFORMASI"
      tagClass="ch-tag-emerald"
      sourceNote={sourceNote}
      dark
      headline={
        <>
          Skor keterbukaan {desa.nama} adalah{" "}
          <span className="underline-sweep num">{total}/100</span>. Cukup, belum istimewa.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 reveal reveal-4 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
        {/* Score ring */}
        <div className="relative mx-auto inline-flex items-center justify-center">
          <svg width="220" height="220" viewBox="0 0 280 280" className="max-w-full -rotate-90">
            <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke={`url(#scoreG-${chapterNo})`}
              strokeWidth="4"
              strokeLinecap="round"
              className="score-arc"
              strokeDasharray={`${CIRC} ${CIRC}`}
              style={{ ["--arc-from" as string]: `${CIRC}`, ["--arc-to" as string]: arcTo }}
            />
            <defs>
              <linearGradient id={`scoreG-${chapterNo}`} x1="0" x2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute text-center">
            <p
              className="num display text-[64px] font-semibold leading-none text-white"
              data-counter
              data-target={total}
            >
              0
            </p>
            <p className="mono mt-2 text-[11px] tracking-[.18em] text-white/50">DARI 100</p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="space-y-2.5">
          {subScores.length > 0 ? (
            subScores.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-[12.5px] text-white/85">{s.label}</p>
                  <p className="num text-[13px] font-semibold text-white">{s.value}</p>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                  <div
                    className="bar-anim shimmer-fill h-full rounded-full"
                    style={
                      { "--w": `${s.value}%`, "--c-from": "#10B981", "--c-to": "#34D399" } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
              <p className="text-[12.5px] text-white/70">Skor transparansi belum diterbitkan untuk desa ini.</p>
            </div>
          )}
        </div>
      </div>

      {perangkat.length > 0 ? (
        <div className="mt-6 reveal reveal-5">
          <p className="eyebrow mb-3 text-white/45">Perangkat desa</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {perangkat.slice(0, 6).map((p, i) => (
              <div
                key={`${p.jabatan}-${i}`}
                className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/10"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80">
                  <UserRound size={15} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white">{p.nama}</p>
                  <p className="truncate text-[11px] text-white/55">{p.jabatan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </ChapterPanel>
  );
}
