"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Sparkles } from "lucide-react";
import type { ToastType } from "@/components/ui/Toast";
import { STATUS_META } from "./constants";
import { fetchDocumentPreviewUrl } from "./api";
import type { DocRow } from "./types";
import {
  formatBytes,
  formatCategory,
  formatReviewStatusLabel,
  getDraftButtonLabel,
  getDraftSummary,
  getNextStepClassName,
  getNextStepCopy,
  getUploaderName,
  getVersionCandidateSummary,
} from "./utils";

interface DocCardProps {
  doc: DocRow;
  onMarkFailed: (doc: DocRow) => void;
  onNotify: (message: string, type?: ToastType) => void;
  isHighlighted: boolean;
}

export function DocCard({
  doc,
  onMarkFailed,
  onNotify,
  isHighlighted,
}: DocCardProps) {
  const [busy, setBusy] = useState(false);
  const status = STATUS_META[doc.status];
  const draftSummary = getDraftSummary(doc);
  const versionCandidateSummary = getVersionCandidateSummary(doc);
  const nextStep = getNextStepCopy(doc);
  const hasPreview =
    Boolean(doc.fileName) && Boolean(doc.fileType) && doc.fileSize !== null;
  const fileMetaLabel = hasPreview
    ? `${doc.fileType} - ${formatBytes(doc.fileSize)}`
    : "Input source-backed tanpa file";

  async function openPreview() {
    if (!hasPreview) {
      onNotify(
        "Item ini tidak punya file preview. Buka review data untuk melihat hasil source-backed-nya.",
        "warning",
      );
      return;
    }

    setBusy(true);

    try {
      const signedUrl = await fetchDocumentPreviewUrl(doc.id);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      id={`document-card-${doc.id}`}
      className="lux-card t-spring scroll-mt-24 space-y-3 p-4 sm:p-5"
      style={isHighlighted ? { animation: "intake-focus-flash 2200ms ease-out 1" } : undefined}
    >
      {isHighlighted ? (
        <div className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-[11px] font-semibold text-emerald-900">
          Ini dokumen yang Anda buka dari riwayat intake.
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[15px]">
            {doc.title}
          </p>
          <p className="text-[11px] text-slate-500 sm:text-xs">{doc.desa.nama}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.pill}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span>{getUploaderName(doc)}</span>
        <span className="text-slate-300">/</span>
        <span>{fileMetaLabel}</span>
        <span className="text-slate-300">/</span>
        <span>{new Date(doc.createdAt).toLocaleDateString("id-ID", { dateStyle: "short" })}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {formatCategory(doc.category)}
        </span>
        {doc.sourceTypeCode === "PUBLIC_CONTRIBUTION" ? (
          <span className="pill-warn rounded-full px-2 py-0.5 text-[10px] font-semibold" title="Diunggah oleh pengunjung publik — periksa keaslian dengan cermat sebelum publikasi">
            Kontribusi publik
          </span>
        ) : null}
        {formatReviewStatusLabel(doc.aiMappingStatus) ? (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
            {formatReviewStatusLabel(doc.aiMappingStatus)}
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
        <p className="font-semibold text-slate-900">Arti status ini</p>
        <p className="mt-1">{status.note}</p>
      </div>

      {draftSummary ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-[11px] text-sky-800">
          Draft review tersedia dengan {draftSummary.filledCount} field terisi. Tombol
          {" "}`Review data`{" "}akan membuka isi review ini untuk dicek, dilengkapi, atau dipublikasikan.
        </div>
      ) : null}

      {versionCandidateSummary ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-900">
          Calon versi review siap: {versionCandidateSummary.changedCount} field berubah sejak data
          publik saat ini. Ini belum tayang sebelum tombol `Publikasikan sekarang` diselesaikan.
        </div>
      ) : null}

      <div
        className={`rounded-xl border px-3 py-2 text-[11px] ${getNextStepClassName(nextStep.tone)}`}
      >
        <p className="font-semibold">{nextStep.title}</p>
        <p className="mt-1">{nextStep.note}</p>
      </div>

      {doc.status === "FAILED" && doc.failedReason ? (
        <div className="notice-card notice-danger text-xs">
          <p className="font-semibold">Alasan:</p>
          <p className="mt-1">{doc.failedReason}</p>
        </div>
      ) : null}

      {doc.status === "REJECTED" && doc.rejectedReason ? (
        <div className="notice-card notice-danger text-xs">
          <p className="font-semibold">Alasan penolakan:</p>
          <p className="mt-1">{doc.rejectedReason}</p>
        </div>
      ) : null}

      {doc.status === "PROCESSING" ? (
        <div className="flex flex-wrap gap-2">
          {hasPreview ? (
            <button
              type="button"
              onClick={openPreview}
              disabled={busy}
              className="btn-lux btn-lux-ghost text-xs"
            >
              <ExternalLink size={11} aria-hidden /> Preview
            </button>
          ) : null}
          <Link
            href={`/internal-admin/intake/${encodeURIComponent(doc.id)}`}
            className="btn-lux btn-lux-success text-xs"
          >
            <Sparkles size={11} aria-hidden /> {getDraftButtonLabel(doc)}
          </Link>
          <button
            type="button"
            onClick={() => onMarkFailed(doc)}
            disabled={busy}
            className="btn-lux btn-lux-danger text-xs"
          >
            <AlertTriangle size={11} aria-hidden /> Tidak bisa dipakai
          </button>
        </div>
      ) : null}

      {doc.status === "WAITING_VERIFIED_APPROVAL" ? (
        <div className="flex flex-wrap gap-2">
          {hasPreview ? (
            <button
              type="button"
              onClick={openPreview}
              disabled={busy}
              className="btn-lux btn-lux-ghost text-xs"
            >
              <ExternalLink size={11} aria-hidden /> Preview
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onMarkFailed(doc)}
            disabled={busy}
            className="btn-lux btn-lux-danger text-xs"
          >
            <AlertTriangle size={11} aria-hidden /> Tandai gagal
          </button>
          <Link
            href={`/internal-admin/intake/${encodeURIComponent(doc.id)}`}
            className="btn-lux btn-lux-success text-xs"
          >
            <Sparkles size={11} aria-hidden /> Ambil alih review
          </Link>
        </div>
      ) : null}

      {doc.status === "PUBLISHED" || doc.status === "FAILED" || doc.status === "REJECTED" ? (
        <div className="flex flex-wrap gap-2">
          {hasPreview ? (
            <button
              type="button"
              onClick={openPreview}
              disabled={busy}
              className="btn-lux btn-lux-ghost text-xs"
            >
              <ExternalLink size={11} aria-hidden /> Preview
            </button>
          ) : null}
          <Link
            href={`/internal-admin/intake/${encodeURIComponent(doc.id)}`}
            className="btn-lux btn-lux-secondary text-xs"
          >
            Lihat hasil
          </Link>
        </div>
      ) : null}
    </article>
  );
}
