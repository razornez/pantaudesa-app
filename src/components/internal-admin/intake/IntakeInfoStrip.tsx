"use client";

import { ArrowRight } from "lucide-react";
import type { PipelineResult } from "./types";

interface IntakeInfoStripProps {
  result: PipelineResult;
  onToggleInspector: () => void;
}

export function IntakeInfoStrip({ result, onToggleInspector }: IntakeInfoStripProps) {
  const { openai, extract } = result;
  const durationSec = extract.durationMs ? (extract.durationMs / 1000).toFixed(1) : null;
  const docType = openai.documentType
    ? DOC_TYPE_LABELS[openai.documentType] ?? openai.documentType
    : "Tidak terklasifikasi";
  const confidence = openai.confidence
    ? CONFIDENCE_LABELS[openai.confidence] ?? openai.confidence
    : null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">

      {/* Doc type */}
      <div className="rounded-2xl bg-white p-5"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)" }}>
        <p className="eyebrow mb-2">Tipe dokumen</p>
        <p className="text-[15px] font-semibold text-slate-900">{docType}</p>
        {confidence && (
          <p className="text-[11.5px] text-slate-500 mt-1">Klasifikasi AI · confidence {confidence}</p>
        )}
        {!openai.attempted && (
          <p className="text-[11.5px] text-slate-500 mt-1">Diproses parser lokal · tanpa AI</p>
        )}
      </div>

      {/* Pipeline chain */}
      <div className="rounded-2xl bg-white p-5"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)" }}>
        <p className="eyebrow mb-2">Pipeline</p>
        <div className="flex items-center gap-1.5 flex-wrap text-[11.5px] text-slate-500">
          <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-900 font-medium"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
            Parser lokal
          </span>
          {openai.attempted && (
            <>
              <ArrowRight size={10} className="text-slate-300" />
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#1E1B4B] font-medium"
                style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.12)" }}>
                AI mapping
              </span>
            </>
          )}
          <ArrowRight size={10} className="text-slate-300" />
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-medium"
            style={{ boxShadow: "inset 0 0 0 1px rgba(5,95,70,0.10)" }}>
            Validasi
          </span>
        </div>
        {durationSec && (
          <p className="text-[11px] text-slate-500 mt-2 tabular-nums">Total · {durationSec} detik</p>
        )}
      </div>

      {/* Inspector toggle */}
      <div className="rounded-2xl bg-white p-5 flex items-center justify-between gap-3"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)" }}>
        <div>
          <p className="eyebrow mb-2">Detail teknis</p>
          <p className="text-[12.5px] text-slate-600">Parser lokal & AI · evidence per field</p>
        </div>
        <button
          type="button"
          onClick={onToggleInspector}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11.5px] font-medium bg-white text-slate-700 transition-colors hover:bg-indigo-50 flex-shrink-0"
          style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.10)" }}>
          Buka inspector
        </button>
      </div>
    </section>
  );
}

const DOC_TYPE_LABELS: Record<string, string> = {
  profil_desa:    "Profil desa",
  anggaran:       "Dokumen anggaran",
  perangkat_desa: "Perangkat desa",
  fasilitas:      "Fasilitas",
  potensi:        "Potensi desa",
  kontak:         "Kontak & layanan",
  dokumen_publik: "Dokumen publik",
  unknown:        "Tidak terklasifikasi",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high:   "high",
  medium: "medium",
  low:    "low",
};
