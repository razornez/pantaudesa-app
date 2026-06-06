"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { STATUS_TABS } from "@/components/internal-admin/review-queue/constants";
import type { DocRow } from "@/components/internal-admin/review-queue/types";
import { DocCard } from "@/components/internal-admin/review-queue/DocCard";
import { MarkFailedModal } from "@/components/internal-admin/review-queue/MarkFailedModal";
import { buildStatusHref } from "@/components/internal-admin/review-queue/utils";

export default function InternalDocumentReviewQueue({
  documents,
  statusFilter,
  focusDocumentId,
}: {
  documents: DocRow[];
  statusFilter: string;
  focusDocumentId?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [failTarget, setFailTarget] = useState<DocRow | null>(null);
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  const publicCount = useMemo(
    () => documents.filter((doc) => doc.sourceTypeCode === "PUBLIC_CONTRIBUTION").length,
    [documents],
  );

  const summary = useMemo(
    () =>
      documents.reduce(
        (accumulator, doc) => {
          accumulator.total += 1;
          if (doc.status === "WAITING_VERIFIED_APPROVAL") accumulator.waiting += 1;
          if (doc.status === "PROCESSING") accumulator.processing += 1;
          if (doc.status === "PUBLISHED") accumulator.published += 1;
          if (doc.status === "REJECTED") accumulator.rejected += 1;
          if (doc.status === "FAILED") accumulator.failed += 1;
          return accumulator;
        },
        { total: 0, waiting: 0, processing: 0, published: 0, rejected: 0, failed: 0 },
      ),
    [documents],
  );

  const stageCards = [
    {
      label: "Belum masuk review",
      count: summary.waiting,
      note: "Verified desa diutamakan, tetapi internal admin tetap bisa mengambil alih bila perlu.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      label: "Perlu review internal",
      count: summary.processing,
      note: "Siap dicek, dilengkapi, lalu diputuskan.",
      className: "border-sky-200 bg-sky-50 text-sky-900",
    },
    {
      label: "Sudah dipublikasikan",
      count: summary.published,
      note: "Perubahan dari dokumen ini sudah tayang di data desa.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Ditolak verified",
      count: summary.rejected,
      note: "Dokumen dihentikan di level admin verified desa dan menunggu unggahan baru dari pengunggah.",
      className: "border-rose-200 bg-rose-50 text-rose-900",
    },
    {
      label: "Perlu unggahan ulang",
      count: summary.failed,
      note: "Dokumen gagal dipakai dan menunggu perbaikan pengunggah.",
      className: "border-rose-200 bg-rose-50 text-rose-900",
    },
  ];

  useEffect(() => {
    if (!focusDocumentId) return;

    const rafId = window.requestAnimationFrame(() => {
      const target = document.getElementById(`document-card-${focusDocumentId}`);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [focusDocumentId]);

  return (
    <div className="space-y-5" data-testid="internal-documents-queue">
      <style jsx global>{`
        @keyframes intake-focus-flash {
          0% {
            background-color: rgba(220, 252, 231, 0.98);
            border-color: rgba(74, 222, 128, 0.92);
            box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.28);
          }
          55% {
            background-color: rgba(220, 252, 231, 0.72);
            border-color: rgba(74, 222, 128, 0.7);
            box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.16);
          }
          100% {
            background-color: rgba(255, 255, 255, 1);
            border-color: rgba(241, 245, 249, 1);
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
          }
        }
      `}</style>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="eyebrow text-[10px]">Review data desa</p>
          <h1 className="display text-[22px] font-semibold tracking-tight text-slate-900 sm:text-[26px]">
            Antrean review data
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="pill-info rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
            {summary.total} dokumen
          </span>
          {summary.waiting > 0 ? (
            <span className="pill-warn rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {summary.waiting} menunggu
            </span>
          ) : null}
          {summary.processing > 0 ? (
            <span className="pill-warn rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {summary.processing} diproses
            </span>
          ) : null}
          {summary.published > 0 ? (
            <span className="pill-ok rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {summary.published} tayang
            </span>
          ) : null}
          {summary.rejected > 0 ? (
            <span className="pill-danger rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {summary.rejected} ditolak
            </span>
          ) : null}
          {summary.failed > 0 ? (
            <span className="pill-danger rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {summary.failed} gagal
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
        <p className="font-semibold text-slate-900">Cara pakai halaman ini</p>
        <p className="mt-1">
          1. Cari kartu dengan blok `Langkah berikutnya` yang sesuai kebutuhan Anda.
        </p>
        <p>2. Buka `Review data` untuk cek isi dokumen dan lihat hasil ekstraksi yang tersimpan.</p>
        <p>3. Selesaikan keputusan final di halaman review: publish jika valid, atau tandai gagal jika dokumen bermasalah.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stageCards.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border px-3 py-3 text-xs ${item.className}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{item.label}</p>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-current">
                {item.count}
              </span>
            </div>
            <p className="mt-1 leading-relaxed">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildStatusHref(pathname || "/internal-admin/documents", tab.value)}
            prefetch={false}
            className={`btn-lux ${
              statusFilter === tab.value ? "btn-lux-primary" : "btn-lux-ghost"
            } !min-h-[36px] text-[11px] sm:!min-h-[40px] sm:text-xs`}
          >
            {tab.label}
          </Link>
        ))}
        {publicCount > 0 && (
          <button
            type="button"
            onClick={() => setShowPublicOnly((v) => !v)}
            className={`btn-lux !min-h-[36px] text-[11px] sm:!min-h-[40px] sm:text-xs ${
              showPublicOnly ? "btn-lux-primary" : "btn-lux-ghost"
            }`}
          >
            Kontribusi publik
            <span className="ml-1.5 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              {publicCount}
            </span>
          </button>
        )}
      </div>

      {(() => {
        const visible = showPublicOnly
          ? documents.filter((doc) => doc.sourceTypeCode === "PUBLIC_CONTRIBUTION")
          : documents;
        if (visible.length === 0) {
          return (
            <div className="lux-card space-y-2 p-8 text-center">
              <FileText size={24} className="mx-auto text-slate-300" aria-hidden />
              <p className="text-sm text-slate-500">Tidak ada dokumen pada filter ini.</p>
            </div>
          );
        }
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onMarkFailed={setFailTarget}
                onNotify={toast}
                isHighlighted={focusDocumentId === doc.id}
              />
            ))}
          </div>
        );
      })()}

      {failTarget ? (
        <MarkFailedModal
          doc={failTarget}
          onNotify={toast}
          onClose={() => setFailTarget(null)}
          onDone={() => {
            setFailTarget(null);
            router.refresh();
          }}
        />
      ) : null}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
