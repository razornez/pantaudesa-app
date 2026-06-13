import { UserRound, Info, FileText, CheckCircle2, Clock } from "lucide-react";
import type { Desa } from "@/lib/types";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

const CIRC = 753.98; // 2π·120

// Color band per sub-score value: green ≥70, amber ≥50, rose <50
function subScoreColor(v: number) {
  if (v >= 70) return { bg: "rgba(16,185,129,.12)", border: "rgba(16,185,129,.28)", bar: "#10B981", barTo: "#34D399", text: "#A7F3D0" };
  if (v >= 50) return { bg: "rgba(245,158,11,.10)", border: "rgba(245,158,11,.28)", bar: "#F59E0B", barTo: "#FCD34D", text: "#FCD34D" };
  return { bg: "rgba(244,63,94,.10)", border: "rgba(244,63,94,.28)", bar: "#F43F5E", barTo: "#FDA4AF", text: "#FDA4AF" };
}

export default function ChTransparansi({ desa, chapterNo, sourceNote }: { desa: Desa; chapterNo: string; sourceNote?: SourceNote }) {
  const skor = desa.skorTransparansi;
  const isDerived = skor?.isDerived ?? false;
  const total = skor?.total ?? 0;
  const arcTo = (CIRC * (1 - Math.max(0, Math.min(100, total)) / 100)).toFixed(2);

  const subScores = skor
    ? [
        { label: "Laporan disampaikan tepat waktu?", value: skor.ketepatan },
        { label: "Dokumen publik bisa diakses warga?", value: skor.kelengkapan },
        { label: "Anggaran dipakai secara konsisten?", value: skor.konsistensi },
        { label: "Cepat merespons pertanyaan warga?", value: skor.responsif },
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
          <span className="underline-sweep num">{total}/100</span>.{" "}
          {total >= 70 ? "Cukup baik." : total >= 50 ? "Cukup, belum istimewa." : "Masih terbatas."}
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

        {/* Sub-scores with per-value color */}
        <div className="space-y-2.5">
          {subScores.map((s) => {
            const c = subScoreColor(s.value);
            return (
              <div
                key={s.label}
                className="rounded-2xl p-4"
                style={{ background: c.bg, boxShadow: `inset 0 0 0 1px ${c.border}` }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-[12.5px] text-white/85">{s.label}</p>
                  <p className="num text-[13px] font-semibold" style={{ color: c.text }}>
                    {s.value}{" "}
                    <span className="text-white/40 text-[11px]">/100</span>
                  </p>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                  <div
                    className="bar-anim shimmer-fill h-full rounded-full"
                    style={{ "--w": `${s.value}%`, "--c-from": c.bar, "--c-to": c.barTo } as React.CSSProperties}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Derived score note */}
      {isDerived ? (
        <div className="mt-5 reveal reveal-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.10)" }}>
          <Info size={13} className="mt-0.5 flex-shrink-0 text-white/40" aria-hidden />
          <p className="text-[11.5px] leading-relaxed text-white/50">
            Estimasi PantauDesa — dihitung dari ketersediaan data resmi dan kanal keterbukaan desa ini.
            Skor resmi dari penilaian independen akan menggantikan ini bila tersedia.
          </p>
        </div>
      ) : null}

      {/* Dokumen & Perangkat — 2-column grid */}
      {(desa.dokumen && desa.dokumen.length > 0) || perangkat.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 reveal reveal-5 md:grid-cols-2">
          {/* Dokumen tersedia */}
          {desa.dokumen && desa.dokumen.length > 0 ? (
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(99,102,241,.10)", boxShadow: "inset 0 0 0 1px rgba(99,102,241,.20)" }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(140deg,#6366F1,#4F46E5)" }}>
                  <FileText size={14} className="text-white" aria-hidden />
                </div>
                <p className="eyebrow text-white/70">Dokumen terbuka</p>
              </div>
              <p className="num mb-2 text-[36px] font-semibold leading-none text-white">
                <span data-counter data-target={desa.dokumen.filter((d) => d.tersedia).length}>0</span>
                <span className="text-[18px] text-white/40"> / {desa.dokumen.length}</span>
              </p>
              <div className="mt-4 space-y-2">
                {desa.dokumen.slice(0, 4).map((dok) => (
                  <div key={`${dok.nama}-${dok.tahun}`} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-white/75 truncate mr-3">{dok.nama} {dok.tahun}</span>
                    {dok.tersedia ? (
                      <span className="cpill cpill-good flex-shrink-0">
                        <CheckCircle2 size={10} aria-hidden /> tersedia
                      </span>
                    ) : (
                      <span className="cpill cpill-ink flex-shrink-0 text-white/40">
                        <Clock size={10} aria-hidden /> belum
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Perangkat desa */}
          {perangkat.length > 0 ? (
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(20,184,166,.10)", boxShadow: "inset 0 0 0 1px rgba(20,184,166,.20)" }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(140deg,#14B8A6,#0F766E)" }}>
                  <UserRound size={14} className="text-white" aria-hidden />
                </div>
                <p className="eyebrow text-white/70">Yang bisa kamu tanya</p>
              </div>
              <p className="mb-4 text-[13.5px] font-medium text-white">Perangkat desa {desa.nama}</p>
              <div className="space-y-2">
                {perangkat.slice(0, 4).map((p, i) => (
                  <div
                    key={`${p.jabatan}-${i}`}
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)" }}
                  >
                    <p className="text-[13px] text-white">{p.nama}</p>
                    <p className="mt-0.5 text-[11px] text-white/50">{p.jabatan}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </ChapterPanel>
  );
}
