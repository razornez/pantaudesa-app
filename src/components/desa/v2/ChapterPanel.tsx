import type { CSSProperties, ReactNode } from "react";

export interface ChapterPanelProps {
  /** DOM id, e.g. "ch-0" — also used by the chapter rail observer */
  id: string;
  /** Zero-padded chapter number shown in the ribbon, e.g. "00" */
  chapterNo: string;
  /** Short uppercase label shown in the ribbon */
  ribbonLabel: string;
  /** Ribbon status dot color (CSS color) */
  ribbonDot: string;
  /** 4px top strip gradient (CSS background value) */
  stripGradient: string;
  /** Optional decorative blur blob */
  blobStyle?: CSSProperties;
  /** Mono sub-title chip text */
  tagText: string;
  /** chapter-tag color class, e.g. "ch-tag-blue" */
  tagClass: string;
  /** Large fact-quote headline (may contain <span className="underline-sweep">) */
  headline: ReactNode;
  /** Dark ink-deep chapter (white text on deep gradient) */
  dark?: boolean;
  /** Per-chapter data source attribution (accountability) */
  sourceNote?: SourceNote;
  children: ReactNode;
}

export interface SourceNote {
  /** Source name, e.g. "OpenStreetMap" or "DJPK Kemenkeu" */
  label: string;
  /** true = example/placeholder data (not yet from the real source) */
  mock?: boolean;
  /** Optional source URL */
  url?: string;
}

const INK_DEEP_BG =
  "radial-gradient(1000px 600px at 80% -10%, rgb(99 102 241 / .30), transparent 60%), radial-gradient(700px 400px at -5% 110%, rgb(20 184 166 / .18), transparent 60%), linear-gradient(140deg, #0F0D2E 0%, #1E1B4B 40%, #312E81 85%)";

/**
 * Shared cinematic chapter skeleton: panel + top strip + blob + ribbon +
 * sub-title tag + fact-quote headline. Body passed as children.
 * Pure presentational (server component) — motion comes from global CSS + hook.
 */
export default function ChapterPanel({
  id,
  chapterNo,
  ribbonLabel,
  ribbonDot,
  stripGradient,
  blobStyle,
  tagText,
  tagClass,
  headline,
  dark = false,
  sourceNote,
  children,
}: ChapterPanelProps) {
  return (
    <section id={id} className="chapter">
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
        <div
          className={`panel reveal reveal-1 p-5 sm:p-7 lg:p-9 ${dark ? "text-white" : ""}`}
          style={dark ? { background: INK_DEEP_BG, borderColor: "rgb(255 255 255 / .08)" } : undefined}
        >
          <div className="panel-strip" style={{ background: stripGradient }} />
          {blobStyle ? <div className="blob" style={blobStyle} /> : null}
          <div className="ribbon">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: ribbonDot }}
              aria-hidden
            />
            BAB {chapterNo} · {ribbonLabel}
          </div>

          <div className="reveal reveal-2 mb-5 mt-4">
            {dark ? (
              <span className="chapter-tag bg-white/10 text-white ring-1 ring-inset ring-white/15">
                {tagText}
              </span>
            ) : (
              <span className={`chapter-tag ${tagClass}`}>{tagText}</span>
            )}
          </div>

          <p
            className={`reveal reveal-3 fact-quote display mb-8 max-w-3xl ${
              dark ? "text-white" : "text-ink-1"
            }`}
          >
            {headline}
          </p>

          {children}

          {sourceNote ? <SourceFooter note={sourceNote} dark={dark} /> : null}
        </div>
      </div>
    </section>
  );
}

/** Per-chapter source attribution footer — keeps internal admin accountable. */
export function SourceFooter({ note, dark = false }: { note: SourceNote; dark?: boolean }) {
  const divider = dark ? "border-white/10" : "border-[color:var(--color-hair)]";
  const labelText = dark ? "text-white/70" : "text-ink-3";
  const pillReal = dark
    ? "bg-white/10 text-white ring-1 ring-inset ring-white/15"
    : "cpill-good";
  const pillMock = dark
    ? "bg-amber-400/15 text-amber-50 ring-1 ring-inset ring-amber-300/30"
    : "cpill-warn";

  return (
    <div className={`mt-6 flex flex-wrap items-center gap-2 border-t ${divider} pt-4`}>
      <span className={`cpill ${note.mock ? pillMock : pillReal}`}>
        {note.mock ? "Contoh · mock" : "Sumber resmi"}
      </span>
      <span className={`text-[11.5px] ${labelText}`}>
        {note.mock ? "Sumber rencana: " : "Sumber: "}
        {note.url ? (
          <a
            href={note.url}
            target="_blank"
            rel="noopener noreferrer"
            className={dark ? "underline decoration-white/30 hover:decoration-white" : "text-brand-600 hover:underline"}
          >
            {note.label}
          </a>
        ) : (
          <span className={dark ? "text-white/90" : "text-ink-2"}>{note.label}</span>
        )}
      </span>
    </div>
  );
}
