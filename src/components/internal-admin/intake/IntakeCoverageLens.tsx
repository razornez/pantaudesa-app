"use client";

import { IntakeCoverageChart } from "./IntakeCoverageChart";
import { IntakeCoverageLegendRow } from "./IntakeCoverageLegendRow";
import { buildCoverageLensModel } from "./coverage-lens";
import type { PipelineResult } from "./types";

interface IntakeCoverageLensProps {
  result: PipelineResult;
}

export function IntakeCoverageLens({ result }: IntakeCoverageLensProps) {
  const coverage = result.fieldCoverage;
  if (!coverage) return null;

  const {
    detected,
    detectedBySection,
    hiddenByComponent,
    hiddenCount,
    missing,
    outsideCount,
    outsideEntries,
    publishable,
    sectionMap,
    templateInfo,
    total,
  } = buildCoverageLensModel(coverage);

  return (
    <section
      className="overflow-hidden rounded-3xl bg-white"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
      }}
    >
      {templateInfo && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-6 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Template</span>
            <span className="truncate text-[12px] font-semibold text-slate-800">{templateInfo.templateName}</span>
          </div>
          <span className="text-[10.5px] font-mono text-slate-400">{templateInfo.templateKey}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
              templateInfo.source === "db" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {templateInfo.source === "db" ? "DB template" : "Fallback standar"}
          </span>
          {templateInfo.visibleComponentCount > 0 && (
            <span className="text-[10.5px] text-slate-500">{templateInfo.visibleComponentCount} komponen aktif</span>
          )}
          {templateInfo.hiddenComponentCount > 0 && (
            <span className="text-[10.5px] text-rose-500">{templateInfo.hiddenComponentCount} komponen hidden</span>
          )}
        </div>
      )}
      {templateInfo?.source === "fallback" && (
        <div className="notice-card notice-warn mx-6 mt-3 text-[11px]">
          Menggunakan fallback standar karena template DB belum tersedia. Struktur komponen mungkin berbeda dari tampilan di Data
          Desa.
        </div>
      )}

      <div className="p-7">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1.5">Coverage · apa yang dibaca dari file</p>
            <h3 className="text-[18px] font-semibold leading-tight text-slate-900">
              {total} field template aktif, terbaca dengan tingkat keyakinan berbeda
            </h3>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 sm:grid sm:grid-cols-[180px_1fr] sm:items-center sm:gap-7">
          <IntakeCoverageChart publishable={publishable} detected={detected} missing={missing} total={total} />

          <div className="w-full space-y-3">
            <IntakeCoverageLegendRow
              color="#10B981"
              label="Siap direview"
              count={publishable}
              note="Terbaca dari dokumen · perlu verifikasi sumber sebelum diterbitkan"
            />
            <IntakeCoverageLegendRow
              color="#D97706"
              label="Terdeteksi, perlu cek sumber"
              count={detected}
              note="Ditemukan tapi format atau sumber belum memenuhi syarat"
            />
            <IntakeCoverageLegendRow
              color="#CBD5E1"
              label="Tidak terbaca"
              count={missing}
              note="Tidak ada di file ini · data lama tetap dipakai"
            />
            {hiddenCount > 0 && (
              <IntakeCoverageLegendRow
                color="#F43F5E"
                label="Terdeteksi, komponen hidden"
                count={hiddenCount}
                note="Komponen sedang disembunyikan untuk desa ini — tidak akan diterbitkan"
              />
            )}
            {outsideCount > 0 && (
              <IntakeCoverageLegendRow
                color="#94A3B8"
                label="Terdeteksi di luar template"
                count={outsideCount}
                note="Field ini tidak ada di template aktif — tidak akan dicatat sebagai perubahan"
              />
            )}
          </div>
        </div>

        {sectionMap.size > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Per komponen · {templateInfo?.source === "db" ? "dari template aktif" : "fallback standar"}
            </p>
            <div>
              {[...sectionMap.entries()].map(([name, counts]) => {
                const publishablePct = counts.total > 0 ? (counts.covered / counts.total) * 100 : 0;
                const detectedPct = counts.total > 0 ? (counts.detected / counts.total) * 100 : 0;
                const detectedFields = detectedBySection.get(name)?.fields ?? [];

                return (
                  <div key={name} className="space-y-1.5 border-t border-slate-100 py-[9px] first:border-t-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-[12.5px] font-medium text-slate-900">{name}</div>
                      <div className="flex-shrink-0 text-[11px] tabular-nums text-slate-500">
                        {counts.covered} / {counts.total}
                      </div>
                    </div>
                    <div className="flex h-[6px] overflow-hidden rounded-full bg-slate-100">
                      <div className="bg-emerald-500" style={{ width: `${publishablePct}%` }} />
                      <div className="bg-amber-500" style={{ width: `${detectedPct}%` }} />
                    </div>
                    {detectedFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {detectedFields.map((field) => (
                          <span
                            key={field.fieldKey}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800"
                            style={{ boxShadow: "inset 0 0 0 1px rgba(146,64,14,0.14)" }}
                          >
                            {field.fieldLabel}
                            <span className="font-mono opacity-60">{field.fieldKey}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hiddenByComponent.size > 0 && (
          <div className="mt-5 border-t border-rose-100 pt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-400">Terdeteksi — komponen hidden</p>
            <div className="space-y-2">
              {[...hiddenByComponent.entries()].map(([key, info]) => (
                <div
                  key={key}
                  className="rounded-xl bg-rose-50/60 px-3 py-2.5"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(244,63,94,0.10)" }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-slate-800">{info.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {info.fields.length} field terdeteksi, tapi komponen ini sedang disembunyikan untuk desa ini. Data tidak akan
                        diterbitkan.
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {info.fields.map((field) => (
                          <span
                            key={field.fieldKey}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-100/70 px-1.5 py-0.5 text-[10px] text-rose-800"
                            style={{ boxShadow: "inset 0 0 0 1px rgba(244,63,94,0.12)" }}
                          >
                            {field.fieldLabel}
                            <span className="font-mono opacity-60">{field.fieldKey}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {outsideEntries.length > 0 && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Terdeteksi di luar template</p>
            <div className="space-y-2">
              {outsideEntries.map((entry) => (
                <div
                  key={entry.fieldKey}
                  className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
                >
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                  <div className="min-w-0 flex-1">
                    {entry.sectionLabel && (
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{entry.sectionLabel}</p>
                    )}
                    <p className="text-[12px] font-medium text-slate-700">
                      {entry.fieldLabel}
                      <span className="ml-2 text-[10px] font-mono text-slate-400">{entry.fieldKey}</span>
                    </p>
                    {entry.uploadedValuePreview && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Nilai terdeteksi: <span className="font-medium">{entry.uploadedValuePreview}</span>
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Data ini terbaca dari dokumen, tetapi tidak dicatat sebagai perubahan karena field tersebut belum ada di template
                      desa ini.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
