"use client";

import { Plus } from "lucide-react";
import type { PipelineResult, DetectedDetailField, UnknownUsefulField } from "./types";

interface IntakeDetectedGalleryProps {
  result: PipelineResult;
}

// Combine detected items from both sources
function getDetectedItems(result: PipelineResult): Array<{
  title: string;
  typeLabel: string;
  value: string;
  note: string;
}> {
  const items: Array<{ title: string; typeLabel: string; value: string; note: string }> = [];

  const fromCoverage = result.fieldCoverage?.detectedButNotPublishable ?? [];
  const fromAi = result.openai.detectedButNotPublishable ?? [];

  // De-dup by fieldKey
  const seen = new Set<string>();
  const allDetected: DetectedDetailField[] = [];
  for (const item of [...fromCoverage, ...fromAi]) {
    const key = item.fieldKey ?? item.fieldLabel;
    if (!seen.has(key)) { seen.add(key); allDetected.push(item); }
  }

  for (const item of allDetected) {
    items.push({
      title: item.fieldLabel,
      typeLabel: guessType(item.reason),
      value: item.value,
      note: item.reason,
    });
  }

  // Also add useful findings
  const useful: UnknownUsefulField[] = result.openai.unknownUsefulFields ?? [];
  for (const item of useful.slice(0, 3)) {
    items.push({
      title: item.label,
      typeLabel: "temuan",
      value: item.value,
      note: `Kandidat kategori: ${item.possibleCategory}`,
    });
  }

  return items;
}

function guessType(reason: string): string {
  if (/format/i.test(reason)) return "format";
  if (/tipe|jenis|field baru|tersedia/i.test(reason)) return "tipe baru";
  if (/narasi|teks bebas/i.test(reason)) return "narasi";
  if (/sumber|dokumen|sk|tandatangan/i.test(reason)) return "sumber";
  return "perlu review";
}

export function IntakeDetectedGallery({ result }: IntakeDetectedGalleryProps) {
  const items = getDetectedItems(result);
  if (items.length === 0) return null;

  const shown = items.slice(0, 5);
  const remaining = items.length - shown.length;

  return (
    <section className="rounded-3xl bg-white p-7"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)" }}>
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="eyebrow text-amber-700 mb-1.5">Detected · belum aman</p>
          <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">
            {items.length} hal terbaca yang masih perlu konfirmasi reviewer
          </h3>
          <p className="text-[12.5px] text-slate-500 mt-1.5 max-w-2xl">
            Bukan diabaikan — disimpan sebagai catatan untuk dipertimbangkan di antrean review.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium bg-amber-50 text-amber-900 flex-shrink-0 ml-4"
          style={{ boxShadow: "inset 0 0 0 1px rgba(146,64,14,0.18)" }}>
          {items.length} catatan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map((item, i) => (
          <div key={i} className="rounded-2xl p-4 bg-amber-50/30"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-[12px] font-semibold text-slate-900">{item.title}</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-amber-700 flex-shrink-0"
                style={{ boxShadow: "inset 0 0 0 1px rgba(180,83,9,0.18)" }}>
                {item.typeLabel}
              </span>
            </div>
            <p className="text-[13px] text-slate-900 font-medium leading-snug">{item.value}</p>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{item.note}</p>
          </div>
        ))}

        {remaining > 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 flex items-center justify-center text-[12px] text-slate-500 hover:border-slate-300 transition-colors cursor-default">
            <span className="flex items-center gap-2">
              <Plus size={13} aria-hidden />
              Lihat {remaining} temuan lain
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
