import { Boxes, Building2, Users, Store } from "lucide-react";
import type { Desa } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

const KONDISI_DOT: Record<string, string> = {
  baik: "var(--color-good-500)",
  sedang: "var(--color-warn-500)",
  rusak: "var(--color-watch-500)",
};

export default function ChIsiDesa({ desa, chapterNo, sourceNote }: { desa: Desa; chapterNo: string; sourceNote?: SourceNote }) {
  const profil = desa.profil;
  const aset = profil?.aset ?? [];
  const fasilitas = profil?.fasilitas ?? [];
  const lembaga = profil?.lembaga ?? [];
  const bumdes = profil?.bumdes;
  const totalAset = aset.reduce((s, a) => s + a.nilai, 0);
  const lembagaAktif = lembaga.filter((l) => l.aktif).length;

  const condCounts = [
    { k: "baik", n: aset.filter((a) => a.kondisi === "baik").length, pill: "cpill-good" },
    { k: "sedang", n: aset.filter((a) => a.kondisi === "sedang").length, pill: "cpill-warn" },
    { k: "rusak", n: aset.filter((a) => a.kondisi === "rusak").length, pill: "cpill-watch" },
  ];

  const empty = aset.length === 0 && fasilitas.length === 0 && lembaga.length === 0 && !bumdes;

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="ISI DESA"
      ribbonDot="var(--color-teal-500)"
      stripGradient="linear-gradient(90deg,#14B8A6,#0EA5E9,#8B5CF6)"
      blobStyle={{ width: 320, height: 320, top: -120, left: -80, background: "var(--color-teal-500)" }}
      tagText="ASET · FASILITAS · LEMBAGA"
      tagClass="ch-tag-teal"
      sourceNote={sourceNote}
      headline={
        aset.length > 0 ? (
          <>
            Total aset desa bernilai{" "}
            <span className="underline-sweep num">
              <span data-counter data-target={totalAset} data-format="rupiah">
                Rp 0
              </span>
            </span>
            .
          </>
        ) : (
          <>Isi desa: fasilitas, lembaga, dan organisasi masyarakat.</>
        )
      }
    >
      {empty ? (
        <div className="tile tile-teal reveal reveal-4">
          <p className="text-[12.5px] text-ink-2">Kelengkapan desa belum diterbitkan untuk desa ini.</p>
        </div>
      ) : null}

      {aset.length > 0 ? (
        <div className="reveal reveal-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {condCounts.map((c) => (
              <span key={c.k} className={`cpill ${c.pill}`}>
                <span className="num font-semibold">{c.n}</span> {c.k}
              </span>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl bg-surface ring-hair">
            {aset.slice(0, 6).map((a, i) => (
              <div
                key={`${a.nama}-${i}`}
                className="flex items-center gap-3 border-t border-[color:var(--color-hair)] px-4 py-3 first:border-t-0"
              >
                <div className="ichip ichip-teal">
                  <Boxes size={15} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink-1">{a.nama}</p>
                  <p className="num truncate text-[11px] text-ink-3">
                    {a.lokasi} · {a.tahunBeli}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-[12px] font-semibold text-ink-1">{formatRupiah(a.nilai)}</p>
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] capitalize text-ink-3">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: KONDISI_DOT[a.kondisi] }}
                      aria-hidden
                    />
                    {a.kondisi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {fasilitas.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 reveal reveal-5 sm:grid-cols-3">
          {fasilitas.slice(0, 6).map((f, i) => (
            <div key={`${f.nama}-${i}`} className="tile tile-sky hover-lift">
              <div className="flex items-center justify-between">
                <div className="ichip ichip-sky">
                  <Building2 size={15} aria-hidden />
                </div>
                <span className="num display text-[22px] font-semibold text-ink-1">{f.jumlah}</span>
              </div>
              <p className="mt-2 text-[12px] font-medium leading-tight text-ink-1">{f.nama}</p>
            </div>
          ))}
        </div>
      ) : null}

      {lembaga.length > 0 ? (
        <div className="mt-3 reveal reveal-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="cpill cpill-violet">
              <span className="num font-semibold">{lembagaAktif}</span> aktif
            </span>
            <span className="cpill cpill-ink">
              dari <span className="num font-semibold">{lembaga.length}</span> lembaga
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {lembaga.slice(0, 6).map((l) => (
              <div key={l.nama} className="tile tile-violet">
                <div className="flex items-center gap-2.5">
                  <div className="ichip ichip-violet">
                    <Users size={15} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-ink-1">
                      {l.nama.replace(/\(.*\)/, "").trim()}
                    </p>
                    <p className="num text-[11px] text-ink-3">
                      {l.aktif ? "Aktif" : "Tidak aktif"} · {l.anggota} anggota
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {bumdes ? (
        <div className="mt-3 tile tile-brand reveal reveal-6">
          <div className="flex items-center gap-2.5">
            <div className="ichip ichip-brand">
              <Store size={15} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-1">{bumdes.nama}</p>
              <p className="text-[11px] text-ink-3">
                {bumdes.bidangUsaha} · modal <span className="num">{formatRupiah(bumdes.modal)}</span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </ChapterPanel>
  );
}
