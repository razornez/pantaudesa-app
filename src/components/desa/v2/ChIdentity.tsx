import {
  Users2,
  Globe2,
  FileText,
  Layers3,
  Ruler,
  MapPin,
  Home,
  Network,
  Briefcase,
  Sprout,
  Leaf,
  Trees,
  Phone,
  Mail,
} from "lucide-react";
import type { Desa } from "@/lib/types";
import { SourceFooter, type SourceNote } from "./ChapterPanel";

const TILE_BORDER = { boxShadow: "inset 0 0 0 1px rgb(15 23 42 / 0.12)" } as const;

export default function ChIdentity({
  desa,
  chapterNo,
  totalChapters,
  sourceNote,
}: {
  desa: Desa;
  chapterNo: string;
  totalChapters: number;
  sourceNote?: SourceNote;
}) {
  const profil = desa.profil;
  const totalDocs = desa.jumlahDokumenPendukung ?? desa.dokumen?.length ?? 0;
  const hasSource =
    (desa.jumlahSumber ?? 0) > 0 || (desa.sumber?.length ?? 0) > 0 || Boolean(profil?.website);

  // Primary overview tiles (counters where numeric)
  const overviewTiles = [
    { tile: "tile-brand", chip: "ichip-brand", icon: Users2, label: "Penduduk", value: desa.penduduk, counter: true, suffix: " jiwa" },
    { tile: "tile-teal", chip: "ichip-teal", icon: Globe2, label: "Sumber", value: desa.jumlahSumber ?? 0, counter: true, suffix: " sumber" },
    { tile: "tile-sky", chip: "ichip-sky", icon: FileText, label: "Dokumen", value: totalDocs, counter: true, suffix: " dokumen" },
    { tile: "tile-violet", chip: "ichip-violet", icon: Layers3, label: "Kategori", text: desa.kategori },
  ];

  // Geography tiles (from profil)
  const geoTiles = profil
    ? [
        { tile: "tile-amber", chip: "ichip-amber", icon: Ruler, label: "Luas wilayah", text: `${profil.luasWilayah} km²` },
        { tile: "tile-good", chip: "ichip-good", icon: MapPin, label: "Dusun", text: `${profil.jumlahDusun} dusun` },
        { tile: "tile-brand", chip: "ichip-brand", icon: Network, label: "RT / RW", text: `${profil.jumlahRt} RT / ${profil.jumlahRw} RW` },
        { tile: "tile-teal", chip: "ichip-teal", icon: Home, label: "KK", text: `${profil.jumlahKk.toLocaleString("id-ID")} KK` },
      ]
    : [];

  // Livelihood / potential notes
  const notes = profil
    ? [
        { icon: Briefcase, label: "Mata pencaharian", value: profil.mataPencaharian },
        { icon: Sprout, label: "Potensi unggulan", value: profil.potensiUnggulan },
        ...(profil.luasSawah ? [{ icon: Leaf, label: "Luas sawah", value: `${profil.luasSawah} ha` }] : []),
        ...(profil.luasHutan ? [{ icon: Trees, label: "Luas hutan/kebun", value: `${profil.luasHutan} ha` }] : []),
      ]
    : [];

  const contacts: { href: string; icon: typeof Globe2; label: string; external: boolean }[] = [];
  if (profil?.website) contacts.push({ href: profil.website, icon: Globe2, label: "Web Profil Desa", external: true });
  if (profil?.telepon) contacts.push({ href: `tel:${profil.telepon}`, icon: Phone, label: profil.telepon, external: false });
  if (profil?.email) contacts.push({ href: `mailto:${profil.email}`, icon: Mail, label: profil.email, external: false });

  return (
    <section id={`ch-${chapterNo}`} className="chapter">
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
        <div className="panel reveal reveal-1 p-5 sm:p-7 lg:p-9">
          <div className="panel-strip" style={{ background: "linear-gradient(90deg,#4F46E5,#10B981,#F59E0B)" }} />
          <div className="ribbon">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-good-500)" }} aria-hidden />
            BAB {chapterNo} · KENALAN
          </div>

          <div className="reveal reveal-2 mt-4 flex flex-wrap items-center gap-2">
            <span className="chapter-tag ch-tag-blue uppercase">DESA {desa.nama}</span>
            {hasSource ? (
              <span className="cpill cpill-good">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-good-500" aria-hidden />
                Sumber ditemukan
              </span>
            ) : null}
          </div>

          <h1 className="huge display reveal reveal-3 mt-5 text-ink-1">{desa.nama}.</h1>
          <p className="reveal reveal-3 mt-3 text-[13.5px] text-ink-3">
            {desa.kecamatan}, {desa.kabupaten}, {desa.provinsi}
          </p>

          <p className="reveal reveal-3 mt-4 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">
            Baca informasi publik {desa.nama} dengan status sumber yang jelas. PantauDesa membantu
            warga melihat sumber dan dokumen yang tersedia sebelum membuat kesimpulan.{" "}
            <span className="italic text-ink-2">Ini halamannya.</span>
          </p>

          {desa.terakhirDiperbaruiLabel ? (
            <p className="reveal reveal-3 mt-3 text-[11.5px] text-ink-4">{desa.terakhirDiperbaruiLabel}</p>
          ) : null}

          {/* Overview tiles */}
          <div className="reveal reveal-4 mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {overviewTiles.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className={`tile ${t.tile} hover-lift`} style={TILE_BORDER}>
                  <div className={`ichip ${t.chip} mb-3`}>
                    <Icon size={16} aria-hidden />
                  </div>
                  {t.counter ? (
                    <p
                      className="num display text-[22px] font-semibold leading-none text-ink-1"
                      data-counter
                      data-target={t.value}
                      data-suffix={t.suffix}
                    >
                      0{t.suffix}
                    </p>
                  ) : (
                    <p className="text-[15px] font-semibold leading-tight text-ink-1">{t.text}</p>
                  )}
                  <p className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-4">{t.label}</p>
                </div>
              );
            })}
          </div>

          {/* Geography tiles */}
          {geoTiles.length > 0 ? (
            <div className="reveal reveal-5 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {geoTiles.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.label} className={`tile ${t.tile}`} style={TILE_BORDER}>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-4">
                      <Icon size={12} aria-hidden />
                      {t.label}
                    </div>
                    <p className="num mt-1.5 text-[15px] font-semibold text-ink-1">{t.text}</p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Livelihood / potential notes */}
          {notes.length > 0 ? (
            <div className="reveal reveal-5 mt-3 grid gap-3 sm:grid-cols-2">
              {notes.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={`${n.label}-${n.value}`} className="tile tile-brand" style={TILE_BORDER}>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-4">
                      <Icon size={12} aria-hidden />
                      {n.label}
                    </div>
                    <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-ink-2">{n.value}</p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Contact chips */}
          {contacts.length > 0 ? (
            <div className="reveal reveal-6 mt-4 flex flex-wrap gap-2">
              {contacts.map((c) => {
                const Icon = c.icon;
                return (
                  <a
                    key={`${c.label}-${c.href}`}
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-2 ring-hair transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Icon size={12} aria-hidden />
                    {c.label}
                  </a>
                );
              })}
            </div>
          ) : null}

          {/* Scroll hint — hairline tipis */}
          <div className="reveal reveal-6 mt-8 flex items-center gap-3 border-t border-[color:var(--color-hair)] pt-5">
            <span className="eyebrow">Scroll</span>
            <span className="h-px w-10 bg-[color:var(--color-hair)]" aria-hidden />
            <span className="text-[12px] italic text-ink-3">
              <span className="num">{totalChapters}</span> bab pendek · pelan-pelan ya
            </span>
          </div>

          {sourceNote ? <SourceFooter note={sourceNote} /> : null}
        </div>
      </div>
    </section>
  );
}
