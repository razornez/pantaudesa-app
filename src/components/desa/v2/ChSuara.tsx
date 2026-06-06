import Link from "next/link";
import { Megaphone, ArrowRight, Quote } from "lucide-react";
import type { Desa } from "@/lib/types";
import ChapterPanel, { type SourceNote } from "./ChapterPanel";

export interface VoicePreviewItem {
  id: string;
  category: string;
  text: string;
  author: string;
}

export default function ChSuara({
  desa,
  chapterNo,
  voice,
  sourceNote,
}: {
  desa: Desa;
  chapterNo: string;
  voice: { total: number; preview: VoicePreviewItem[] };
  sourceNote?: SourceNote;
}) {
  const tileTones = ["tile-warn", "tile-good", "tile-sky"];

  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="SUARA WARGA"
      ribbonDot="var(--color-sky-500)"
      stripGradient="linear-gradient(90deg,#4F46E5,#0EA5E9,#10B981)"
      blobStyle={{ width: 300, height: 300, top: -110, right: -70, background: "var(--color-sky-500)" }}
      tagText="CERITA WARGA"
      tagClass="ch-tag-sky"
      sourceNote={sourceNote}
      headline={
        voice.total > 0 ? (
          <>
            Sampai hari ini, ada{" "}
            <span className="underline-sweep num">
              <span data-counter data-target={voice.total}>
                0
              </span>{" "}
              cerita
            </span>{" "}
            dari warga {desa.nama}.
          </>
        ) : (
          <>
            Belum ada cerita dari warga {desa.nama}.{" "}
            <span className="underline-sweep">Jadilah yang pertama.</span>
          </>
        )
      }
    >
      <div className="grid grid-cols-1 gap-3 reveal reveal-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          {voice.preview.length > 0 ? (
            voice.preview.slice(0, 3).map((v, i) => (
              <div key={v.id} className={`tile ${tileTones[i % tileTones.length]}`}>
                <div className="flex items-start gap-3">
                  <Quote size={16} className="mt-0.5 flex-shrink-0 text-ink-4" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-ink-2">{v.text}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-3">
                      <span className="cpill cpill-ink uppercase tracking-[.06em]">{v.category}</span>
                      {v.author}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="tile tile-sky">
              <p className="text-[12.5px] text-ink-2">
                Belum ada cerita dari warga. Suaramu akan jadi yang pertama membantu warga lain
                memahami kondisi desa ini.
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/desa/${desa.id}/suara`}
          prefetch={false}
          className="hover-lift flex flex-col justify-between gap-4 rounded-2xl p-5 text-white shadow-lux-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          style={{
            background:
              "radial-gradient(400px 200px at 90% -20%, rgb(99 102 241 / .35), transparent 60%), linear-gradient(135deg, #1E1B4B 0%, #312E81 60%, #3730A3 100%)",
          }}
          aria-label={`Suara warga untuk ${desa.nama}`}
        >
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
              <Megaphone size={15} className="text-white" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Ada yang ingin kamu tambahkan?</p>
              <p className="text-[11px] text-white/60">
                {voice.total > 0 ? `${voice.total} cerita dari warga` : "Jadilah yang pertama bercerita"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/85">
            Ceritakan kondisi desaku
            <ArrowRight size={13} aria-hidden />
          </span>
        </Link>
      </div>
    </ChapterPanel>
  );
}
