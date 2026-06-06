"use client";

import { ArrowRight, FileText, Sparkles } from "lucide-react";
import type { PipelineResult, DesaOption } from "./types";
import { formatBytes } from "./utils";

interface IntakeSourceRibbonProps {
  result: PipelineResult;
  selectedDesa: DesaOption | null;
  onChangeDesa: () => void;
}

export function IntakeSourceRibbon({ result, selectedDesa, onChangeDesa }: IntakeSourceRibbonProps) {
  const { extract, openai, diff, fieldCoverage } = result;
  const fileName = extract.fileName ?? result.inputSource ?? "Teks manual";
  const sizeLabel = extract.size ? formatBytes(extract.size) : null;
  const durationSec = extract.durationMs ? (extract.durationMs / 1000).toFixed(1) : null;
  const pagesLabel = extract.pages ? `${extract.pages} hal` : extract.sheets?.length ? `${extract.sheets.length} sheet` : null;
  const aiActive = openai.attempted && openai.status === "success";

  // center arrow label: how many fields are changing
  const changedCount = (diff?.addedCount ?? 0) + (diff?.updatedCount ?? 0) + (diff?.removedCount ?? 0);
  const totalFields = fieldCoverage?.entries.length ?? 0;

  return (
    <section className="rounded-3xl bg-white shadow-lux-1 overflow-hidden"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">

        {/* LEFT: Source file */}
        <div className="p-6 flex items-center gap-5">
          {/* Doc icon stack */}
          <div className="relative w-[88px] flex-shrink-0" style={{ aspectRatio: "0.72" }}>
            {[2, 1, 0].map((i) => (
              <div
                key={i}
                className="absolute inset-0 bg-white rounded-xl p-2 flex flex-col gap-1"
                style={{
                  transform: i === 0 ? "none" : i === 1 ? "translate(6px,6px) rotate(2.4deg)" : "translate(12px,12px) rotate(4.8deg)",
                  boxShadow: "0 1px 1px rgba(15,23,42,0.05), 0 4px 14px -4px rgba(15,23,42,0.10)",
                  zIndex: 2 - i,
                }}
              >
                <div className="h-[6px] bg-slate-900 w-[38%] rounded-sm mb-1" />
                <div className="h-[2px] bg-slate-200 rounded-sm w-[90%]" />
                <div className="h-[2px] bg-slate-200 rounded-sm w-[70%]" />
                <div className="h-[2px] bg-slate-200 rounded-sm w-[80%]" />
                <div className="h-[2px] bg-slate-200 rounded-sm w-[55%]" />
              </div>
            ))}
          </div>

          <div className="min-w-0">
            <p className="eyebrow mb-1.5">
              {result.inputSource === "file" ? "File yang dibaca · Upload" : "Sumber · Teks manual"}
            </p>
            <p className="text-[15px] font-semibold text-slate-900 truncate">{fileName}</p>
            <p className="text-[11.5px] text-slate-500 mt-0.5 tabular-nums">
              {[extract.parser, sizeLabel, pagesLabel, durationSec ? `${durationSec} dtk` : null].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {aiActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-[#1E1B4B]"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.15)" }}>
                  <Sparkles size={9} aria-hidden /> AI mapping aktif
                </span>
              )}
              {!aiActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                  <FileText size={9} aria-hidden /> {extract.parser}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: Arrow divider */}
        <div className="hidden lg:flex items-center justify-center px-2">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
            <div className="rounded-full bg-[#1E1B4B] text-white w-9 h-9 flex items-center justify-center shadow-lux-1">
              <ArrowRight size={14} aria-hidden />
            </div>
            {diff && changedCount > 0 && totalFields > 0 ? (
              <span className="text-[9.5px] uppercase tracking-[0.16em] font-semibold text-slate-500 tabular-nums text-center">
                replace · {changedCount} dari {totalFields} field
              </span>
            ) : (
              <span className="text-[9.5px] uppercase tracking-[0.16em] font-semibold text-slate-400 text-center">
                {selectedDesa ? "target desa" : "tanpa desa"}
              </span>
            )}
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
          </div>
        </div>

        {/* RIGHT: Target desa */}
        <div className="p-6 flex items-center gap-5 bg-slate-50/40 lg:border-l border-slate-100">
          {selectedDesa ? (
            <>
              {/* Desa silhouette */}
              <div className="flex-shrink-0 relative w-20 h-[88px]">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-100 via-white to-emerald-50 flex flex-col p-2 gap-1"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                  <div className="h-1.5 w-2/3 rounded-full bg-slate-900" />
                  <div className="h-1 w-3/4 rounded-full bg-slate-200" />
                  <div className="grid grid-cols-2 gap-0.5 mt-1">
                    <div className="h-2.5 rounded-sm bg-emerald-100" />
                    <div className="h-2.5 rounded-sm bg-indigo-100" />
                    <div className="h-2.5 rounded-sm bg-amber-100" />
                    <div className="h-2.5 rounded-sm bg-slate-200" />
                  </div>
                  <div className="mt-auto h-1 w-1/2 rounded-full bg-slate-200" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="eyebrow mb-1.5">Desa target</p>
                <p className="text-[15px] font-semibold text-slate-900 truncate">{selectedDesa.nama}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Kec. {selectedDesa.kecamatan} · Kab. {selectedDesa.kabupaten} · {selectedDesa.provinsi}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600"
                    style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                    data terkini
                  </span>
                  <button onClick={onChangeDesa} className="text-[11px] text-indigo-600 font-medium hover:underline">
                    Ganti
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-20 h-[88px] rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
                <span className="text-[10px] text-slate-400 font-medium text-center leading-tight px-1">Pilih desa</span>
              </div>
              <div>
                <p className="eyebrow mb-1.5">Desa target</p>
                <p className="text-[13px] text-slate-500">Belum dipilih</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[180px] leading-relaxed">
                  Pilih desa untuk melihat diff terhadap data saat ini.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
