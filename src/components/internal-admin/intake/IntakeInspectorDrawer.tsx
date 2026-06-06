"use client";

import { ChevronUp } from "lucide-react";
import type { PipelineResult } from "./types";
import { formatBytes } from "./utils";

interface IntakeInspectorDrawerProps {
  result: PipelineResult;
  open: boolean;
  onToggle: () => void;
}

export function IntakeInspectorDrawer({ result, open, onToggle }: IntakeInspectorDrawerProps) {
  const { extract, openai, mapping } = result;

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{ transition: "transform 0.35s cubic-bezier(0.2,0.8,0.2,1)", transform: open ? "translateY(0)" : "translateY(calc(100% - 56px))" }}
    >
      <div className="rounded-t-3xl bg-white overflow-hidden mx-auto max-w-[1240px] px-6"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06), 0 -4px 20px rgba(15,23,42,0.08)" }}>

        {/* Handle */}
        <button
          type="button"
          onClick={onToggle}
          className="h-14 w-full px-2 flex items-center justify-between border-b border-slate-100 focus-visible:outline-none"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-1 rounded-full bg-slate-200" />
            <p className="text-[12.5px] font-semibold text-slate-900">Inspector · Detail parser lokal & AI</p>
            <span className="text-[11px] text-slate-400">opsional · untuk debugging</span>
          </div>
          <ChevronUp size={14} className={`text-slate-400 transition-transform duration-300 ${open ? "" : "rotate-180"}`} aria-hidden />
        </button>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Parser local */}
          <div className="rounded-2xl p-5 bg-slate-50/40"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}>
            <p className="eyebrow mb-2">Parser lokal · {extract.parser}</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              Membaca file menggunakan parser lokal. Field yang tidak terbaca diteruskan ke AI jika diaktifkan.
            </p>
            <div className="mt-3 space-y-1.5 text-[11px]">
              <InfoRow label="Parser" value={extract.parser} />
              {extract.size && <InfoRow label="Ukuran" value={formatBytes(extract.size)} />}
              {extract.pages && <InfoRow label="Halaman" value={String(extract.pages)} />}
              {extract.sheets?.length && <InfoRow label="Sheet" value={extract.sheets.join(", ")} />}
              {extract.durationMs && <InfoRow label="Durasi" value={`${(extract.durationMs / 1000).toFixed(1)} dtk`} />}
              <InfoRow label="Field via mapping" value={String(mapping.evidence.length)} />
              {mapping.unmatched.length > 0 && (
                <InfoRow label="Belum terbaca" value={String(mapping.unmatched.length)} />
              )}
            </div>
          </div>

          {/* AI mapping */}
          <div className="rounded-2xl p-5 bg-indigo-50/30"
            style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.08)" }}>
            <p className="eyebrow text-sky-400 mb-2">AI mapping · {openai.model ?? "tidak aktif"}</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              {openai.attempted
                ? "Mengisi field yang tidak tertangkap parser lokal. Setiap nilai disimpan dengan kutipan sumber."
                : openai.reason || "AI tidak diaktifkan atau tidak diperlukan untuk input ini."}
            </p>
            <div className="mt-3 space-y-1.5 text-[11px]">
              <InfoRow label="Status" value={AI_STATUS_LABELS[openai.status] ?? openai.status} />
              {openai.confidence && <InfoRow label="Confidence" value={openai.confidence} />}
              {openai.attempted && (
                <>
                  <InfoRow label="Field publishable" value={String(Object.keys(openai.knownPublishableFields).length)} />
                  <InfoRow label="Detected, hold" value={String(openai.detectedButNotPublishable.length)} />
                  <InfoRow label="Useful findings" value={String(openai.unknownUsefulFields.length)} />
                </>
              )}
            </div>
          </div>

          {/* Evidence sample */}
          <div className="rounded-2xl p-5 bg-white"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
            <p className="eyebrow mb-2">Contoh kutipan evidence</p>
            {mapping.evidence.length > 0 ? (
              <div className="space-y-2">
                {mapping.evidence.slice(0, 3).map((ev, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-3"
                    style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}>
                    <p className="text-[11px] text-slate-400 mb-1">→ {ev.field}</p>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed font-mono">
                      &ldquo;<HighlightedQuote text={ev.matchedText} />&rdquo;
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">rule: {ev.rule}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400 italic">Belum ada evidence yang tersimpan.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function HighlightedQuote({ text }: { text: string }) {
  const parts = text.split(/(\d[\d.,]*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d[\d.,]*$/.test(part) ? (
          <mark key={i} className="bg-emerald-100 text-emerald-800 not-italic rounded-sm px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right tabular-nums truncate max-w-[60%]">{value}</span>
    </div>
  );
}

const AI_STATUS_LABELS: Record<string, string> = {
  success:      "Berhasil",
  skipped:      "Dilewati",
  missing_key:  "Key tidak ada",
  rate_limited: "Rate limit",
  quota_limited:"Quota habis",
  error:        "Error",
  invalid_json: "JSON tidak valid",
};
