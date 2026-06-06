"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { FIELD_LABELS } from "./constants";
import type { DesaOption, PipelineResult, StatusBadgeInfo } from "./types";

interface IntakeValidationPanelProps {
  result: PipelineResult;
  mappingStatus: StatusBadgeInfo;
  aiStatus: StatusBadgeInfo;
  reviewStatus: StatusBadgeInfo;
  selectedDesa: DesaOption | null;
  finalReview?: boolean;
}

export function IntakeValidationPanel({
  result,
  mappingStatus,
  aiStatus,
  reviewStatus,
  selectedDesa,
  finalReview = false,
}: IntakeValidationPanelProps) {
  const { validation, fieldCoverage } = result;
  const totalOk = fieldCoverage
    ? fieldCoverage.entries.filter(
        (entry) =>
          entry.uploadedCoverageStatus === "covered" ||
          entry.currentValueStatus === "filled",
      ).length
    : 0;
  const totalFields = fieldCoverage?.entries.length ?? 0;
  const hasErrors = validation.issues.some((issue) => issue.severity === "error");
  const warnings = validation.issues.filter((issue) => issue.severity === "warning");
  const errors = validation.issues.filter((issue) => issue.severity === "error");

  return (
    <section
      className="rounded-3xl bg-white p-7"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
      }}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-1.5">Validasi - langsung kelihatan</p>
          <h3 className="text-[18px] font-semibold leading-tight text-slate-900">
            {hasErrors
              ? "Ada error yang perlu diperbaiki"
              : finalReview
              ? "Aman untuk keputusan final"
              : "Aman untuk dikirim ke review"}
          </h3>
          <p className="mt-1.5 text-[12.5px] text-slate-500">
            {hasErrors
              ? `${errors.length} error validasi perlu diperbaiki sebelum submit.`
              : warnings.length > 0
              ? `Semua field utama lolos. Ada ${warnings.length} catatan ringan yang tidak menghalangi ${finalReview ? "keputusan final" : "submit"}.`
              : finalReview
              ? "Semua field valid dan siap diputuskan."
              : "Semua field valid dan siap direview."}
          </p>
        </div>
        <div className="ml-4 flex flex-shrink-0 flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium ${
              hasErrors
                ? "bg-rose-50 text-rose-900 shadow-[inset_0_0_0_1px_rgba(159,18,57,0.18)]"
                : "bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(5,95,70,0.12)]"
            }`}
          >
            {hasErrors ? (
              <AlertTriangle size={13} aria-hidden />
            ) : (
              <CheckCircle2 size={13} aria-hidden />
            )}
            {hasErrors ? "Perlu diperbaiki" : "Lolos"}
          </span>
          {totalFields > 0 ? (
            <span className="text-[10.5px] tabular-nums text-slate-500">
              {totalOk}/{totalFields} ok
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <MiniCard label="Mapping" value={mappingStatus.label} tone={mappingStatus.className} />
        <MiniCard label="AI mapping" value={aiStatus.label} tone={aiStatus.className} />
        <MiniCard label="Review status" value={reviewStatus.label} tone={reviewStatus.className} />
        <MiniCard label="Guardrail" value="Aktif" tone="text-slate-900" />
      </div>

      {errors.length > 0 || warnings.length > 0 ? (
        <>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {errors.length > 0 ? `${errors.length} error` : `${warnings.length} catatan`}
          </p>
          <div className="space-y-2">
            {[...errors, ...warnings].map((issue, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-xl p-3 ${
                  issue.severity === "error" ? "bg-rose-50/40" : "bg-amber-50/40"
                }`}
                style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
              >
                <AlertTriangle
                  size={14}
                  className={`mt-0.5 flex-shrink-0 ${
                    issue.severity === "error" ? "text-rose-700" : "text-amber-700"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-slate-900">
                    {FIELD_LABELS[issue.field]}{" "}
                    <span className="font-normal text-slate-500">
                      - {issue.severity === "error" ? "error" : "peringatan"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-emerald-100"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
          >
            <ShieldCheck size={14} className="text-[#1E1B4B]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-slate-700">
              {selectedDesa ? (
                <>
                  <span className="font-semibold text-slate-900">Desa: {selectedDesa.nama}</span>{" "}
                  -{" "}
                  {finalReview
                    ? "Publish/reject dilakukan di bagian final review bawah."
                    : "Publish tetap manual oleh editor setelah review."}
                </>
              ) : (
                <span className="text-slate-500">
                  Pilih desa target untuk menghubungkan hasil ini ke data publik.
                </span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {finalReview
                ? "Setelah publish atau reject, item kembali ke antrean dokumen dengan status terbaru."
                : "Publish final tidak terjadi di layar ini. Setelah dikirim, item masuk ke antrean review."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  const textColor = tone.includes("emerald")
    ? "text-emerald-700"
    : tone.includes("rose")
    ? "text-rose-700"
    : tone.includes("amber")
    ? "text-amber-700"
    : tone.includes("sky")
    ? "text-sky-700"
    : "text-slate-900";

  return (
    <div
      className="rounded-xl bg-slate-50/40 px-3 py-2.5"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-[12.5px] font-semibold ${textColor}`}>{value}</p>
    </div>
  );
}
