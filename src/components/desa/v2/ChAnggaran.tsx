import { Wallet, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import type { Desa } from "@/lib/types";
import { PENDAPATAN } from "@/lib/copy";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

export default function ChAnggaran({ desa, chapterNo, sourceNote }: { desa: Desa; chapterNo: string; sourceNote?: SourceNote }) {
  const selisih = Math.max(0, desa.totalAnggaran - desa.terealisasi);
  const noData = !desa.totalAnggaran || desa.totalAnggaran === 0;

  const stats = [
    { chip: "ichip-brand", icon: Wallet, label: "Total anggaran", target: desa.totalAnggaran, valueClass: "text-ink-1" },
    { chip: "ichip-good", icon: CheckCircle2, label: "Terealisasi", target: desa.terealisasi, valueClass: "text-good-900" },
    { chip: "ichip-watch", icon: Clock, label: "Belum terserap", target: selisih, valueClass: "text-watch-900" },
  ];

  const sources = desa.pendapatan
    ? ([
        { key: "danaDesa", amount: desa.pendapatan.danaDesa, from: "#1E1B4B", to: "#4F46E5" },
        { key: "add", amount: desa.pendapatan.add, from: "#4F46E5", to: "#6366F1" },
        { key: "pades", amount: desa.pendapatan.pades, from: "#047857", to: "#10B981" },
        { key: "bantuanKeuangan", amount: desa.pendapatan.bantuanKeuangan, from: "#B45309", to: "#F59E0B" },
      ] as const)
    : [];

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="ANGGARAN"
      ribbonDot="var(--color-brand-600)"
      stripGradient="linear-gradient(90deg,#4F46E5,#7C3AED)"
      blobStyle={{ width: 340, height: 340, top: -130, right: -90, background: "var(--color-brand-500)" }}
      tagText="UANG DESA"
      tagClass="ch-tag-blue"
      sourceNote={sourceNote}
      headline={
        <>
          Tahun ini {desa.nama} menerima{" "}
          <span className="underline-sweep num">
            <span data-counter data-target={desa.totalAnggaran} data-format="rupiah">
              Rp 0
            </span>
          </span>{" "}
          untuk dikelola sendiri.
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 reveal reveal-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="tile tile-brand hover-lift">
              <div className={`ichip ${s.chip} mb-3`}>
                <Icon size={16} aria-hidden />
              </div>
              <p
                className={`num display text-[22px] font-semibold leading-none ${s.valueClass}`}
                data-counter
                data-target={s.target}
                data-format="rupiah"
              >
                Rp 0
              </p>
              <p className="mt-1.5 text-[11.5px] text-ink-3">{s.label}</p>
              {noData ? <p className="mt-0.5 text-[10px] text-ink-4">belum tersedia</p> : null}
            </div>
          );
        })}
        <div className="tile tile-good hover-lift">
          <div className="ichip ichip-good mb-3">
            <TrendingUp size={16} aria-hidden />
          </div>
          <p
            className="num display text-[22px] font-semibold leading-none text-good-900"
            data-counter
            data-target={desa.persentaseSerapan}
            data-suffix="%"
          >
            0%
          </p>
          <p className="mt-1.5 text-[11.5px] text-ink-3">Serapan anggaran</p>
        </div>
      </div>

      {sources.length > 0 ? (
        <div className="mt-3 rounded-2xl bg-surface p-5 reveal reveal-5 ring-hair sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-medium text-ink-1">Dari mana uang desa ini berasal?</p>
              <p className="mt-0.5 text-[11px] text-ink-3">4 sumber pendapatan utama</p>
            </div>
            {noData ? <span className="text-[10px] text-ink-4">belum tersedia</span> : null}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((src) => {
              const info = PENDAPATAN[src.key];
              const pct = desa.totalAnggaran > 0 ? Math.round((src.amount / desa.totalAnggaran) * 100) : 0;
              return (
                <div key={src.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-1">
                    <p className="truncate text-[11px] font-medium text-ink-2">{info.label}</p>
                    <p className="num text-[11px] text-ink-3">{pct}%</p>
                  </div>
                  <p
                    className="num mb-2 text-[15px] font-semibold text-ink-1"
                    data-counter
                    data-target={src.amount}
                    data-format="rupiah"
                  >
                    Rp 0
                  </p>
                  <div className="h-[4px] overflow-hidden rounded-full bg-black/[.06]">
                    <div
                      className="bar-anim shimmer-fill h-full rounded-full"
                      style={
                        {
                          "--w": `${pct}%`,
                          "--c-from": src.from,
                          "--c-to": src.to,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </ChapterPanel>
  );
}
