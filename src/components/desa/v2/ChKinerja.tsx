import { Hammer, Activity } from "lucide-react";
import type { Desa } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

function buildChart(riwayat: NonNullable<Desa["riwayat"]>) {
  const pts = riwayat
    .slice()
    .sort((a, b) => a.tahun - b.tahun)
    .map((r) => ({ tahun: r.tahun, pct: r.persentaseSerapan }));
  const n = pts.length;
  if (n < 2) return null;
  const x = (i: number) => 100 + (640 * i) / (n - 1);
  const y = (pct: number) => 240 - (Math.max(0, Math.min(100, pct)) / 100) * 200;
  const coords = pts.map((p, i) => ({ ...p, cx: x(i), cy: y(p.pct) }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.cx.toFixed(0)} ${c.cy.toFixed(0)}`).join(" ");
  const area = `${line} L ${x(n - 1).toFixed(0)} 240 L 100 240 Z`;
  return { coords, line, area };
}

export default function ChKinerja({ desa, chapterNo, sourceNote }: { desa: Desa; chapterNo: string; sourceNote?: SourceNote }) {
  const apbdes = (desa.apbdes ?? []).slice().sort((a, b) => b.persentase - a.persentase);
  const outputFisik = desa.outputFisik ?? [];
  const chart = desa.riwayat && desa.riwayat.length > 1 ? buildChart(desa.riwayat) : null;
  const delta =
    chart && chart.coords.length > 1
      ? Math.round(chart.coords[chart.coords.length - 1].pct - chart.coords[0].pct)
      : null;

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="KINERJA"
      ribbonDot="var(--color-brand-500)"
      stripGradient="linear-gradient(90deg,#6366F1,#10B981)"
      blobStyle={{ width: 320, height: 320, bottom: -120, right: -70, background: "var(--color-good-500)" }}
      tagText="DIPAKAI UNTUK APA"
      tagClass="ch-tag-violet"
      sourceNote={sourceNote}
      headline={
        <>
          Sebagian besar dipakai untuk <span className="underline-sweep">jalan, drainase, dan fasilitas warga</span>.
        </>
      }
    >
      {apbdes.length > 0 ? (
        <div className="space-y-2.5 reveal reveal-4">
          {apbdes.map((item) => (
            <div key={item.kode} className="tile tile-brand stripe-brand">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[13px] font-medium text-ink-1">{item.bidang}</p>
                <p className="num text-[12px] font-semibold text-brand-700">{item.persentase}%</p>
              </div>
              <div className="my-2 h-[3px] overflow-hidden rounded-full bg-black/[.06]">
                <div
                  className="bar-anim shimmer-fill h-full rounded-full"
                  style={
                    { "--w": `${item.persentase}%`, "--c-from": "#4F46E5", "--c-to": "#6366F1" } as React.CSSProperties
                  }
                />
              </div>
              <p className="num text-[11px] text-ink-3">
                {formatRupiah(item.realisasi)} dari {formatRupiah(item.anggaran)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {outputFisik.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 reveal reveal-5 sm:grid-cols-3">
          {outputFisik.map((o) => (
            <div key={o.label} className="tile tile-good hover-lift">
              <div className="ichip ichip-good mb-3">
                <Hammer size={15} aria-hidden />
              </div>
              <p
                className="num display text-[24px] font-semibold leading-none text-good-900"
                data-counter
                data-target={o.persentase}
                data-suffix="%"
              >
                0%
              </p>
              <p className="mt-1.5 text-[11.5px] font-medium text-ink-1">{o.label}</p>
              <p className="num mt-0.5 text-[11px] text-ink-3">
                {o.realisasi}/{o.target} {o.satuan}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {chart ? (
        <div className="mt-3 rounded-2xl bg-surface p-5 reveal reveal-6 ring-hair sm:p-6">
          <div className="mb-2 flex items-end justify-between gap-3">
            <p className="text-[12.5px] font-medium text-ink-1">
              Tren serapan {chart.coords[0].tahun}–{chart.coords[chart.coords.length - 1].tahun}
            </p>
            {delta !== null ? (
              <span className={`cpill ${delta >= 0 ? "cpill-good" : "cpill-watch"}`}>
                {delta >= 0 ? "+" : ""}
                {delta} poin
              </span>
            ) : null}
          </div>
          <svg viewBox="0 0 800 280" className="w-full max-h-[320px]">
            <defs>
              <linearGradient id={`areaG-${chapterNo}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity=".28" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="line-draw" d={chart.area} fill={`url(#areaG-${chapterNo})`} />
            <path
              className="line-draw"
              d={chart.line}
              fill="none"
              stroke="var(--color-brand-600)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chart.coords.map((c, i) => {
              const last = i === chart.coords.length - 1;
              return (
                <g key={c.tahun}>
                  <circle
                    className={`dot-pop dot-pop-${Math.min(i + 1, 5)}`}
                    cx={c.cx}
                    cy={c.cy}
                    r={last ? 10 : 6}
                    fill={last ? "var(--color-good-500)" : "white"}
                    stroke={last ? "var(--color-good-700)" : "var(--color-brand-600)"}
                    strokeWidth="2.5"
                  />
                  <text x={c.cx} y={266} textAnchor="middle" className="num" fontSize="13" fill="var(--color-ink-3)">
                    {c.tahun}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        outputFisik.length === 0 &&
        apbdes.length === 0 && (
          <div className="tile tile-brand reveal reveal-4">
            <div className="flex items-center gap-2.5">
              <div className="ichip ichip-brand">
                <Activity size={15} aria-hidden />
              </div>
              <p className="text-[12.5px] text-ink-2">Rincian kinerja anggaran belum diterbitkan untuk desa ini.</p>
            </div>
          </div>
        )
      )}
    </ChapterPanel>
  );
}
