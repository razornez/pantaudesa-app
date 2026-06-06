"use client";

import { useState } from "react";
import { Database, ExternalLink, Loader2 } from "lucide-react";
import type { AdminDesaFilter } from "@/components/internal-admin/AdminDesaFilterBar";
import { switchDesaTemplate } from "./api";
import type { DesaRow, TemplateSummary } from "./types";
import {
  DesaStatusPill,
  EmptyState,
  FieldValue,
  SkeletonCards,
} from "./shared";
import { ComponentVisibilityPanel } from "./ComponentVisibilityPanel";

function TemplateSwitchPopover({
  desaId,
  currentTemplateId,
  templateOptions,
  templatesLoading,
  onOpen,
  onApplied,
}: {
  desaId: string;
  currentTemplateId: string | null;
  templateOptions: TemplateSummary[];
  templatesLoading: boolean;
  onOpen: () => void;
  onApplied: () => void;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplateId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  return (
    <details
      className="group relative"
      onToggle={(event) => {
        const details = event.currentTarget;
        if (details.open) {
          onOpen();
          return;
        }
        if (!details.open) {
          setError(null);
          setNotice(null);
          setSelectedTemplateId(currentTemplateId ?? "");
        }
      }}
    >
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
      >
        Ganti template
      </summary>

      <div
        className="absolute left-0 top-[calc(100%+8px)] z-20 w-[320px] rounded-2xl bg-white p-4"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(15,23,42,0.06), 0 18px 40px -24px rgba(15,23,42,0.28)",
        }}
      >
        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-slate-900">Switch template desa</p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Pilih template aktif baru. Setelah diterapkan, urutan komponen publik, intake,
            dan panel desa akan ikut membaca template yang sama.
          </p>
        </div>

        <label className="mt-3 block">
          <span className="eyebrow mb-1.5 block">Template aktif baru</span>
          <select
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
            disabled={templatesLoading || applying}
            className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-medium text-slate-900 outline-none focus:bg-white"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
          >
            <option value="" disabled>
              {templatesLoading ? "Memuat template..." : "Pilih template"}
            </option>
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="mt-3 text-[11px] leading-relaxed text-rose-700">{error}</p>
        ) : null}
        {notice ? (
          <p className="mt-3 text-[11px] leading-relaxed text-emerald-700">{notice}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (applying) return;
              const details = document.activeElement?.closest("details");
              if (details instanceof HTMLDetailsElement) details.open = false;
            }}
            disabled={applying}
            className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={
              applying ||
              templatesLoading ||
              !selectedTemplateId ||
              selectedTemplateId === (currentTemplateId ?? "")
            }
            onClick={() => {
              setApplying(true);
              setError(null);
              setNotice(null);
              void switchDesaTemplate({
                desaId,
                templateId: selectedTemplateId,
              })
                .then((result) => {
                  setNotice(result.message);
                  onApplied();
                })
                .catch((mutationError) => {
                  setError(
                    mutationError instanceof Error
                      ? mutationError.message
                      : "Gagal mengganti template desa.",
                  );
                })
                .finally(() => {
                  setApplying(false);
                });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E1B4B] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#15123a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? <Loader2 size={12} className="animate-spin" aria-hidden /> : null}
            {applying ? "Menerapkan..." : "Terapkan"}
          </button>
        </div>
      </div>
    </details>
  );
}

interface DesaDataResultsProps {
  desa: DesaRow[];
  filter: AdminDesaFilter;
  page: number;
  total: number;
  loading: boolean;
  expanded: string | null;
  onExpandedChange: (desaId: string | null) => void;
  onPageChange: (page: number) => void;
  templateOptions: TemplateSummary[];
  templatesLoading: boolean;
  templateReloadToken: number;
  onTemplateSwitchOpen: () => void;
  onTemplateMutation: () => void;
}

export function DesaDataResults({
  desa,
  filter,
  page,
  total,
  loading,
  expanded,
  onExpandedChange,
  onPageChange,
  templateOptions,
  templatesLoading,
  templateReloadToken,
  onTemplateSwitchOpen,
  onTemplateMutation,
}: DesaDataResultsProps) {
  const totalPages = Math.ceil(total / 20);
  const hasFilter = Boolean(
    filter.q || filter.provinsi || filter.kabupaten || filter.kecamatan,
  );

  return (
    <>
      {!loading ? (
        <p className="text-[12px] text-slate-500 tabular-nums">
          {total.toLocaleString("id-ID")} desa{" "}
          {hasFilter && filter.q ? `· hasil pencarian "${filter.q}"` : ""}
        </p>
      ) : null}

      {loading && desa.length === 0 ? (
        <SkeletonCards count={5} height="h-16" />
      ) : desa.length === 0 ? (
        <EmptyState
          icon={<Database size={20} />}
          title="Tidak ada desa ditemukan"
          note={hasFilter ? "Tidak ada hasil untuk filter ini." : "Belum ada data desa."}
        />
      ) : (
        <section
          className="rounded-3xl bg-white overflow-hidden"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="hidden sm:grid px-6 py-3 border-b border-slate-100 text-[10.5px] uppercase tracking-[0.14em] font-semibold text-slate-400"
            style={{ gridTemplateColumns: "1fr 120px 80px 100px" }}
          >
            <span>Desa</span>
            <span>Field terisi</span>
            <span>Versi</span>
            <span>Dipublish</span>
          </div>
          <div>
            {desa.map((item, index) => {
              const totalFieldCount = Math.max(item.totalFieldCount ?? 0, 1);
              const filledCount = Math.min(
                item.filledFieldCount ?? 0,
                totalFieldCount,
              );
              const isExpanded = expanded === item.id;

              return (
                <div
                  key={item.id}
                  className={`border-b border-slate-50 last:border-b-0 ${index % 2 === 0 ? "" : "bg-slate-50/30"}`}
                >
                  <button
                    type="button"
                    onClick={() => onExpandedChange(isExpanded ? null : item.id)}
                    className="w-full text-left px-4 sm:px-6 py-3.5 hover:bg-indigo-50/30 transition-colors duration-150"
                  >
                    <div className="sm:hidden flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{item.nama}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.kecamatan}, {item.kabupaten}
                        </p>
                      </div>
                      <DesaStatusPill status={item.dataStatus} />
                    </div>
                    <div
                      className="hidden sm:grid items-center gap-4"
                      style={{ gridTemplateColumns: "1fr 120px 80px 100px" }}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">
                          {item.nama}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.kecamatan}, {item.kabupaten}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {item.detailTemplateAssignment?.template.name ?? "Default template"} ·{" "}
                          <span className="opacity-60">
                            {item.detailTemplateAssignment?.template.key ??
                              "TEMPLATE_UMUM_DESA"}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 flex-1 max-w-[60px] rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.round((filledCount / totalFieldCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {filledCount}/{totalFieldCount}
                        </span>
                      </div>
                      <span className="text-[11.5px] text-slate-600 tabular-nums">
                        {item._count.villageDataVersions}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.dataPublishedAt
                          ? new Date(item.dataPublishedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="px-4 sm:px-6 pb-4 pt-1 bg-indigo-50/20 border-t border-indigo-100/60 space-y-4">
                      <div>
                        {item.mismatchPublishedFieldCount ? (
                          <div
                            className="mb-3 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800"
                            style={{ boxShadow: "inset 0 0 0 1px rgba(217,119,6,0.14)" }}
                          >
                            Ditemukan {item.mismatchPublishedFieldCount} field published lama yang belum sinkron
                            dengan template aktif. Counter desa di atas sekarang hanya menghitung field yang valid
                            untuk template aktif saat ini.
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <FieldValue label="Website" value={item.websiteUrl} />
                          <FieldValue label="Kategori" value={item.kategori} />
                          <FieldValue
                            label="Tahun data"
                            value={item.tahunData ? String(item.tahunData) : null}
                          />
                          <FieldValue
                            label="Penduduk"
                            value={
                              item.jumlahPenduduk
                                ? `${item.jumlahPenduduk.toLocaleString("id-ID")} jiwa`
                                : null
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          <FieldValue label="Kecamatan" value={item.kecamatan} />
                          <FieldValue label="Kabupaten" value={item.kabupaten} />
                          <FieldValue label="Provinsi" value={item.provinsi} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={`/internal-admin/intake?desaId=${item.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
                            style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.15)" }}
                          >
                            <ExternalLink size={11} aria-hidden /> Buka di Intake
                          </a>
                          <a
                            href={`/desa/${item.slug || item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.1)" }}
                          >
                            <ExternalLink size={11} aria-hidden /> Lihat profil publik
                          </a>
                          <TemplateSwitchPopover
                            key={`${item.id}:${item.detailTemplateAssignment?.template.id ?? "default"}`}
                            desaId={item.id}
                            currentTemplateId={
                              item.detailTemplateAssignment?.template.id ?? null
                            }
                            templateOptions={templateOptions}
                            templatesLoading={templatesLoading}
                            onOpen={onTemplateSwitchOpen}
                            onApplied={onTemplateMutation}
                          />
                          {item.dataSourceLabel ? (
                            <span className="text-[11px] text-slate-400">
                              Sumber: {item.dataSourceLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <ComponentVisibilityPanel
                        key={`${item.id}:${item.detailTemplateAssignment?.template.id ?? "default"}:${templateReloadToken}`}
                        desaId={item.id}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-[12px] text-slate-500">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
            >
              ← Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
            >
              Berikutnya →
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
