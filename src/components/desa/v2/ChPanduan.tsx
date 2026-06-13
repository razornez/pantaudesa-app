import { BookOpen, MessageSquareWarning, ClipboardCheck, Megaphone, CheckCircle2, ClipboardList, HelpCircle, TriangleAlert, ShieldAlert } from "lucide-react";
import type { Desa } from "@/lib/types";
import { getExpectations, type ExpectedStatus } from "@/lib/expectations";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

const STEPS = [
  { tile: "tile-brand", chip: "ichip-brand", icon: BookOpen, title: "Pahami hak warga", body: "Mulai dari hal yang bisa ditanyakan, bukan langsung menyimpulkan." },
  { tile: "tile-violet", chip: "ichip-violet", icon: MessageSquareWarning, title: "Tanya pihak yang tepat", body: "Bedakan urusan desa, kabupaten, dan layanan lain sebelum bertindak." },
  { tile: "tile-teal", chip: "ichip-teal", icon: ClipboardCheck, title: "Cek sebelum melapor", body: "Pastikan dokumen, konteks, dan jalur tanya sudah dicoba dulu." },
  { tile: "tile-amber", chip: "ichip-amber", icon: Megaphone, title: "Sampaikan suara warga", body: "Bagikan kondisi desa atau lanjutkan ke kanal resmi bila sudah siap." },
] as const;

const GROUP: { status: ExpectedStatus; label: string; icon: typeof CheckCircle2; pill: string }[] = [
  { status: "wajib", label: "Ada dasar regulasi", icon: CheckCircle2, pill: "cpill-good" },
  { status: "direncanakan", label: "Sudah direncanakan APBDes", icon: ClipboardList, pill: "cpill-brand" },
  { status: "tanyakan", label: "Bisa ditanyakan ke desa", icon: HelpCircle, pill: "cpill-warn" },
];

export default function ChPanduan({ desa, chapterNo, sourceNote }: { desa: Desa; chapterNo: string; sourceNote?: SourceNote }) {
  const { items } = getExpectations(desa);

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="PANDUAN"
      ribbonDot="var(--color-amber-500)"
      stripGradient="linear-gradient(90deg,#10B981,#F59E0B,#F43F5E)"
      blobStyle={{ width: 320, height: 320, bottom: -120, left: -70, background: "var(--color-amber-400)" }}
      tagText="HAK WARGA"
      tagClass="ch-tag-amber"
      sourceNote={sourceNote}
      headline={
        <>
          Sebelum melapor, ada <span className="underline-sweep">empat langkah</span> yang bisa kamu
          coba. Pelan-pelan dulu.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 reveal reveal-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className={`tile ${s.tile} hover-lift`}>
              <div className="flex items-center justify-between">
                <div className={`ichip ${s.chip}`}>
                  <Icon size={16} aria-hidden />
                </div>
                <span className="num display text-[28px] font-semibold text-ink-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-3 text-[13px] font-semibold text-ink-1">{s.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">{s.body}</p>
            </div>
          );
        })}
      </div>

      {items.length > 0 ? (
        <div className="mt-3 space-y-4 reveal reveal-5">
          {GROUP.map((g) => {
            const groupItems = items.filter((it) => it.status === g.status);
            if (groupItems.length === 0) return null;
            const GIcon = g.icon;
            return (
              <div key={g.status}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`cpill ${g.pill}`}>
                    <GIcon size={12} aria-hidden /> {g.label}
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl bg-surface ring-hair">
                  {groupItems.map((it, i) => (
                    <div
                      key={`${it.label}-${i}`}
                      className="flex items-start gap-3 border-t border-[color:var(--color-hair)] px-4 py-3 first:border-t-0"
                    >
                      <GIcon size={15} className="mt-0.5 flex-shrink-0 text-ink-4" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-medium text-ink-1">{it.label}</p>
                          {it.nilai ? <span className="cpill cpill-ink num">{it.nilai}</span> : null}
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">{it.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 tile tile-amber reveal reveal-6">
        <p className="text-[11.5px] leading-relaxed text-ink-2">
          Daftar ini panduan untuk bertanya dengan tenang — bukan bukti pelanggaran. Selalu cek
          aturan, musyawarah, dan dokumen desa terkait sebelum membuat kesimpulan.
        </p>
      </div>

      {/* Escalation timeline — 3 levels personalized to this desa */}
      <div className="mt-6 reveal reveal-6">
        <p className="eyebrow mb-5">Kalau lapor — ke mana dulu?</p>
        <div className="relative">
          <div
            className="absolute bottom-3 top-3 w-px"
            style={{ left: 19, background: "linear-gradient(180deg, var(--color-good-500), var(--color-warn-500), var(--color-watch-500))" }}
            aria-hidden
          />
          <div className="space-y-3">
            <div className="tile tile-good stripe-good flex items-start gap-5 p-5">
              <div
                className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white shadow-lux-2"
                style={{ background: "linear-gradient(140deg, var(--color-good-500), var(--color-good-700))" }}
              >
                1
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.12em] text-good-700">Hubungi pertama</p>
                <p className="text-[13px] font-medium text-ink-1">Kepala Desa {desa.nama}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                  Untuk masalah infrastruktur, pelayanan warga, atau hal-hal di tingkat desa. Datang ke balai desa.
                </p>
              </div>
            </div>

            <div className="tile tile-warn stripe-warn flex items-start gap-5 p-5">
              <div
                className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white shadow-lux-2"
                style={{ background: "linear-gradient(140deg, var(--color-warn-500), var(--color-warn-700))" }}
              >
                <TriangleAlert size={16} aria-hidden />
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.12em] text-warn-700">Jika tidak direspons</p>
                <p className="text-[13px] font-medium text-ink-1">Camat {desa.kecamatan} · BPD {desa.nama}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                  BPD mengawasi kepala desa. Kecamatan mengawasi desa. Hubungi keduanya paralel.
                </p>
              </div>
            </div>

            <div className="tile tile-watch stripe-watch flex items-start gap-5 p-5">
              <div
                className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white shadow-lux-2"
                style={{ background: "linear-gradient(140deg, var(--color-watch-500), var(--color-watch-700))" }}
              >
                <ShieldAlert size={16} aria-hidden />
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.12em] text-watch-700">Eskalasi terakhir</p>
                <p className="text-[13px] font-medium text-ink-1">
                  Inspektorat {desa.kabupaten} · Ombudsman {desa.provinsi}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                  Untuk dugaan pelanggaran administrasi atau pelayanan publik yang tidak tertangani.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChapterPanel>
  );
}
