"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import {
  fetchTemplateRibbonInfo,
  markDocumentFailed,
  publishDocumentReview,
  refreshDocumentSourceSnapshot,
} from "@/components/internal-admin/review-queue/api";
import { PublishCoverageNotices } from "@/components/internal-admin/review-queue/PublishCoverageNotices";
import type { TemplateRibbonInfo } from "@/components/internal-admin/review-queue/types";
import type { IntakeReviewDesa, IntakeReviewDocument } from "@/lib/internal-admin/intake-review-page";
import type { ReviewCandidateSelection } from "@/lib/internal-admin/review-candidate";

interface IntakeFinalReviewSectionProps {
  document: IntakeReviewDocument;
  desa: IntakeReviewDesa;
  onDone: (nextStatus?: string) => void;
  onRefreshSource: () => void;
}

function isEditableStatus(status: string) {
  return status === "PROCESSING" || status === "WAITING_VERIFIED_APPROVAL";
}

function toneClass(status: "valid" | "invalid" | "held" | "blocked") {
  switch (status) {
    case "valid":
      return "pill-ok";
    case "invalid":
      return "pill-danger";
    case "held":
      return "pill-warn";
    default:
      return "pill-muted";
  }
}

function toneLabel(status: "valid" | "invalid" | "held" | "blocked") {
  switch (status) {
    case "valid":
      return "Siap publish";
    case "invalid":
      return "Butuh perbaikan";
    case "held":
      return "Tertahan template";
    default:
      return "Belum terbaca";
  }
}

export function IntakeFinalReviewSection({
  document,
  desa,
  onDone,
  onRefreshSource,
}: IntakeFinalReviewSectionProps) {
  const { toasts, toast, removeToast } = useToast();
  const [templateInfo, setTemplateInfo] = useState<TemplateRibbonInfo | null>(null);
  const [failedReason, setFailedReason] = useState("");
  const [loading, setLoading] = useState<"publish" | "failed" | "refresh-source" | null>(null);
  const [selectionOverrides, setSelectionOverrides] = useState<Record<string, ReviewCandidateSelection | null>>({});
  const editable = isEditableStatus(document.status);

  const candidate = document.reviewCandidate;
  const fieldStates = useMemo(() => {
    return (
      candidate?.fields.map((field) => {
        const selection =
          selectionOverrides[`${document.id}:${field.fieldKey}`] !== undefined
            ? selectionOverrides[`${document.id}:${field.fieldKey}`]
            : field.defaultSelection;
        const selectedOption =
          selection === "manual"
            ? field.manualCandidate
            : selection === "fetched"
              ? field.fetchedCandidate
              : null;
        const status =
          selection === "skip"
            ? "blocked"
            : selectedOption
              ? selectedOption.validationStatus
              : field.hasConflict
                ? "held"
                : field.validationStatus;
        const message =
          selection === "skip"
            ? "Field ini tidak akan ikut dipublish."
            : selectedOption?.validationMessage ?? field.validationMessage;

        return {
          field,
          selection,
          selectedOption,
          status,
          message,
        };
      }) ?? []
    );
  }, [candidate, document.id, selectionOverrides]);
  const validFields = useMemo(
    () => fieldStates.filter((item) => item.selection !== "skip" && item.status === "valid"),
    [fieldStates],
  );
  const invalidFields = useMemo(
    () => fieldStates.filter((item) => item.selection !== "skip" && item.status === "invalid"),
    [fieldStates],
  );
  const heldFields = useMemo(
    () => fieldStates.filter((item) => item.selection !== "skip" && item.status === "held"),
    [fieldStates],
  );
  const conflictFields = useMemo(
    () => heldFields.filter((item) => item.field.hasConflict),
    [heldFields],
  );
  const publishLockedFields = useMemo(
    () => heldFields.filter((item) => !item.field.hasConflict),
    [heldFields],
  );

  useEffect(() => {
    let cancelled = false;
    fetchTemplateRibbonInfo(desa.id)
      .then((data) => {
        if (!cancelled) setTemplateInfo(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [desa.id]);

  async function handlePublish() {
    if (!candidate) {
      toast("Candidate review belum tersedia.", "error");
      return;
    }
    if (conflictFields.length > 0) {
      toast(
        `Masih ada field bentrok yang perlu dipilih manual / hasil fetch / skip: ${conflictFields
          .map((item) => item.field.fieldLabel)
          .slice(0, 3)
          .join(", ")}${conflictFields.length > 3 ? "..." : ""}.`,
        "error",
      );
      return;
    }
    if (publishLockedFields.length > 0) {
      toast(
        `Masih ada field yang aktif untuk review tetapi belum dibuka ke publik: ${publishLockedFields
          .map((item) => item.field.fieldLabel)
          .slice(0, 3)
          .join(", ")}${publishLockedFields.length > 3 ? "..." : ""}. Pilih "Jangan publish field ini" jika ingin lanjut tanpa field tersebut.`,
        "error",
      );
      return;
    }
    if (invalidFields.length > 0) {
      toast("Masih ada field yang butuh evidence atau perbaikan sebelum publish.", "error");
      return;
    }
    if (validFields.length === 0) {
      toast("Tidak ada field valid yang bisa dipublish.", "error");
      return;
    }

    const payloadFields = Object.fromEntries(
      validFields.map(({ field, selectedOption }) => [
        field.fieldKey,
        selectedOption?.value ?? field.proposedValue,
      ]),
    );

    setLoading("publish");
    try {
      const data = await publishDocumentReview(document.id, {
        fields: payloadFields,
      });
      toast(
        typeof data.versionNumber === "number"
          ? `Dokumen berhasil dipublikasikan sebagai versi ${data.versionNumber}.`
          : "Dokumen berhasil dipublikasikan.",
        "success",
      );
      onDone(data.newStatus);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function handleRefreshSource() {
    setLoading("refresh-source");
    try {
      await refreshDocumentSourceSnapshot(document.id);
      toast("Snapshot sumber berhasil diperbarui.", "success");
      onRefreshSource();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Snapshot sumber belum bisa diperbarui.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkFailed() {
    const reason = failedReason.trim();
    if (!reason) {
      toast("Alasan reject wajib diisi.", "error");
      return;
    }

    setLoading("failed");
    try {
      await markDocumentFailed(document.id, reason);
      toast("Dokumen ditandai gagal.", "success");
      onDone("FAILED");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi.", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Final review dokumen
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Publish atau reject dari halaman ini
        </h2>
        <p className="text-sm text-slate-600">
          {desa.nama} - {desa.kecamatan}, {desa.kabupaten}. Setelah publish atau reject,
          halaman akan kembali ke antrean dokumen.
        </p>
      </div>

      <div className="mt-3 space-y-3">
        <PublishCoverageNotices templateInfo={templateInfo} />

        {candidate ? (
          <>
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Mode input</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{candidate.inputMode}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Siap publish</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{validFields.length} field</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Butuh perbaikan</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{invalidFields.length} field</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Tertahan template</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{heldFields.length} field</p>
              </div>
            </div>

            {candidate.sourceUrl ? (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/75 px-3 py-2.5 text-xs text-indigo-800">
                <p className="font-semibold">Source URL</p>
                <p className="mt-1 break-all">{candidate.sourceUrl}</p>
                {candidate.sourceFetch.status === "error" && candidate.sourceFetch.error ? (
                  <p className="mt-2 text-[11px] text-rose-700">
                    Auto fetch terakhir gagal: {candidate.sourceFetch.error}
                  </p>
                ) : null}
              </div>
            ) : null}

            {candidate.inputMode === "INTERNAL_SOURCE_ENTRY" && candidate.sourceUrl ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRefreshSource}
                  disabled={loading !== null}
                  className="btn-lux btn-lux-secondary text-sm"
                >
                  {loading === "refresh-source" ? "Mengambil ulang..." : "Refresh isi sumber"}
                </button>
              </div>
            ) : null}

            <div className="space-y-2 rounded-[26px] border border-slate-200 bg-slate-50/75 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[10px]">Candidate field review</p>
                  <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
                    Nilai yang benar-benar akan dibaca saat publish
                  </h3>
                </div>
                <span className="pill-info rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                  {candidate.fields.length} field terdeteksi
                </span>
              </div>

              {candidate.fields.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
                  Candidate belum memuat field yang cocok dengan template aktif. Anda masih bisa
                  reject dokumen ini jika sumber tidak memberi nilai yang layak dipublish.
                </div>
              ) : (
                <div className="space-y-2">
                  {fieldStates.map(({ field, selection, selectedOption, status, message }) => (
                    <div
                      key={`${field.componentKey}:${field.fieldKey}`}
                      className="rounded-2xl border border-white bg-white/90 p-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {field.componentLabel}
                          </p>
                          <h4 className="mt-1 text-sm font-semibold text-slate-900">
                            {field.fieldLabel}
                          </h4>
                        </div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass(status)}`}>
                          {toneLabel(status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Nilai publik saat ini
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{field.currentValuePreview}</p>
                        </div>
                        {field.manualCandidate ? (
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Nilai manual reviewer
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {field.manualCandidate.preview}
                            </p>
                          </div>
                        ) : null}
                        {field.fetchedCandidate ? (
                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                              Nilai hasil fetch sumber
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {field.fetchedCandidate.preview}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {field.valueType}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {field.requiresEvidence ? "Evidence wajib" : "Evidence opsional"}
                        </span>
                      </div>

                      {field.manualCandidate || field.fetchedCandidate ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {field.manualCandidate ? (
                            <button
                              type="button"
                              disabled={!editable || loading !== null}
                              onClick={() =>
                                setSelectionOverrides((current) => ({
                                  ...current,
                                  [`${document.id}:${field.fieldKey}`]: "manual",
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                selection === "manual"
                                  ? "bg-[#1E1B4B] text-white shadow-sm"
                                  : "border border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              Pakai manual
                            </button>
                          ) : null}
                          {field.fetchedCandidate ? (
                            <button
                              type="button"
                              disabled={!editable || loading !== null}
                              onClick={() =>
                                setSelectionOverrides((current) => ({
                                  ...current,
                                  [`${document.id}:${field.fieldKey}`]: "fetched",
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                selection === "fetched"
                                  ? "bg-[#1E1B4B] text-white shadow-sm"
                                  : "border border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              Pakai fetch
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={!editable || loading !== null}
                            onClick={() =>
                              setSelectionOverrides((current) => ({
                                ...current,
                                [`${document.id}:${field.fieldKey}`]: "skip",
                              }))
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              selection === "skip"
                                ? "bg-slate-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            Jangan publish field ini
                          </button>
                        </div>
                      ) : null}

                      {selection === "skip" ? (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          Field ini dilewati dan tidak akan ikut dipublish.
                        </p>
                      ) : null}

                      {message ? (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {message}
                        </p>
                      ) : null}

                      {selectedOption ? (
                        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
                          Final publish akan memakai{" "}
                          <span className="font-semibold">
                            {selectedOption.source === "manual" ? "nilai manual reviewer" : "nilai hasil fetch"}
                          </span>
                          .
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="notice-card notice-warn text-sm">
            Candidate review belum tersedia. Halaman ini tetap bisa dipakai untuk reject, tetapi
            publish final menunggu kandidat sumber yang lengkap.
          </div>
        )}

        {!editable ? (
          <div className="notice-card notice-info text-sm">
            Dokumen berstatus {document.status}. Review ini ditampilkan read-only karena keputusan
            final sudah tercatat.
          </div>
        ) : (
          <>
            {document.status === "WAITING_VERIFIED_APPROVAL" ? (
              <div className="notice-card notice-warn text-sm">
                Admin verified desa tetap menjadi jalur utama, tetapi halaman ini bisa dipakai oleh
                admin internal sebagai fallback agar proses tidak macet.
              </div>
            ) : null}

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
              <label className="field-label text-xs text-rose-800">Alasan reject</label>
              <textarea
                value={failedReason}
                onChange={(event) => setFailedReason(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Isi jika dokumen harus ditolak / ditandai gagal."
                className="textarea-lux mt-1 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleMarkFailed}
                disabled={loading !== null}
                className="btn-lux btn-lux-danger text-sm sm:flex-1"
              >
                {loading === "failed" ? "Menyimpan..." : "Reject / tandai gagal"}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading !== null}
                className="btn-lux btn-lux-success text-sm sm:flex-1"
              >
                {loading === "publish" ? "Mempublikasikan..." : "Publikasikan"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
