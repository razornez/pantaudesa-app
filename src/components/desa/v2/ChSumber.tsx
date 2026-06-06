import { Globe2, Building2, FileText, ShieldCheck, ArrowUpRight } from "lucide-react";
import type { Desa } from "@/lib/types";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

export default function ChSumber({
  desa,
  chapterNo,
  sourceNote,
}: {
  desa: Desa;
  chapterNo: string;
  sourceNote?: SourceNote;
}) {
  const docs = desa.dokumen ?? [];
  const availableDocs = docs.filter((d) => d.tersedia);
  const sourceNames = desa.sumber?.map((s) => s.nama).filter(Boolean) ?? [];
  const needsReviewSource = desa.sumber?.some((s) => s.perluReview) ?? false;
  const hasSource = sourceNames.length > 0 || Boolean(desa.profil?.website);
  const primarySource = sourceNames[0] ?? desa.profil?.website;
  const hasApbdes = availableDocs.some((d) => /apbdes/i.test(d.nama));
  const hasRealisasi = availableDocs.some((d) => /realisasi/i.test(d.nama));

  const cards = [
    {
      tile: "tile-brand",
      chip: "ichip-brand",
      icon: Globe2,
      title: "Sumber utama",
      pill: hasSource ? "cpill-good" : "cpill-ink",
      status: hasSource ? "Ditemukan" : "Belum tercatat",
      body: hasSource
        ? `${primarySource} jadi rujukan awal. Belum berarti terverifikasi.`
        : "Sumber publik belum tercatat untuk desa ini.",
    },
    {
      tile: "tile-sky",
      chip: "ichip-sky",
      icon: Building2,
      title: "Sumber lain",
      pill: sourceNames.length > 1 ? "cpill-good" : "cpill-ink",
      status: sourceNames.length > 1 ? `${sourceNames.length - 1} lainnya` : "Belum ada",
      body:
        sourceNames.length > 1
          ? sourceNames.slice(1, 3).join("; ")
          : `Belum ada sumber tambahan untuk ${desa.kecamatan}.`,
    },
    {
      tile: "tile-good",
      chip: "ichip-good",
      icon: FileText,
      title: "Dokumen APBDes/Realisasi",
      pill: hasApbdes || hasRealisasi ? "cpill-good" : "cpill-ink",
      status: hasApbdes || hasRealisasi ? "Ditemukan" : "Belum tercatat",
      body:
        hasApbdes && hasRealisasi
          ? "APBDes dan realisasi ada sebagai referensi, bukan kesimpulan final."
          : hasApbdes
            ? "APBDes ada sebagai referensi. Realisasi masih perlu dicek."
            : hasRealisasi
              ? "Realisasi ada sebagai referensi. APBDes masih perlu dicek."
              : "APBDes/Realisasi belum tercatat untuk desa ini.",
    },
    {
      tile: "tile-warn",
      chip: "ichip-warn",
      icon: ShieldCheck,
      title: "Status review",
      pill: needsReviewSource ? "cpill-warn" : "cpill-ink",
      status: needsReviewSource ? "Perlu review" : "Belum diverifikasi",
      body: needsReviewSource
        ? "Ada sumber/dokumen yang perlu dicek ulang sebelum jadi rujukan."
        : "Bisa dibaca sebagai referensi, belum dinyatakan terverifikasi.",
    },
  ];

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="SUMBER & DOKUMEN"
      ribbonDot="var(--color-good-500)"
      stripGradient="linear-gradient(90deg,#4F46E5,#0EA5E9,#10B981)"
      blobStyle={{ width: 300, height: 300, bottom: -120, left: -80, background: "var(--color-sky-500)" }}
      tagText="JEJAK SUMBER"
      tagClass="ch-tag-sky"
      sourceNote={sourceNote}
      headline={
        <>
          Sumber dan dokumen yang <span className="underline-sweep">sudah terlihat</span> untuk
          desa ini.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 reveal reveal-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className={`tile ${c.tile} hover-lift`}>
              <div className="flex items-center justify-between gap-2">
                <div className={`ichip ${c.chip}`}>
                  <Icon size={15} aria-hidden />
                </div>
                <span className={`cpill ${c.pill}`}>{c.status}</span>
              </div>
              <p className="mt-3 text-[13px] font-medium leading-tight text-ink-1">{c.title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">{c.body}</p>
            </div>
          );
        })}
      </div>

      {docs.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-2xl bg-surface reveal reveal-5 ring-hair">
          {docs.map((dok, i) => (
            <div
              key={i}
              className={`flex items-center gap-3.5 border-t border-[color:var(--color-hair)] px-4 py-3 first:border-t-0 ${
                dok.tersedia ? "" : "opacity-55"
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  dok.tersedia ? "bg-good-50 text-good-700" : "bg-black/[.05] text-ink-3"
                }`}
              >
                <FileText size={13} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink-1">{dok.nama}</p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-3">
                  Sumber: {dok.sumber ?? "belum tersedia"} · {dok.jenis} · <span className="num">{dok.tahun}</span>
                  {dok.terakhirDicekLabel ? ` · ${dok.terakhirDicekLabel}` : ""}
                </p>
              </div>
              {dok.tersedia && dok.url ? (
                <a
                  href={dok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-[11px] font-medium text-brand-600 ring-hair transition-colors hover:bg-brand-50"
                  aria-label={`Buka dokumen ${dok.nama}`}
                >
                  Buka
                  <ArrowUpRight size={11} aria-hidden />
                </a>
              ) : dok.tersedia ? (
                <span className="flex-shrink-0 text-[10px] font-medium text-ink-3">Belum ada tautan</span>
              ) : (
                <span className="flex-shrink-0 text-[10px] font-medium text-watch-700">Belum ada</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </ChapterPanel>
  );
}
