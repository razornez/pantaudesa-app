"use client";

import { DatabaseZap, Link2, ShieldCheck } from "lucide-react";
import { TemplateFieldEntrySections } from "@/components/back-office/TemplateFieldEntrySections";
import type { TemplateFieldEngineViewModel } from "@/lib/village-data/template-field-contract";
import type { SourceTypeCode } from "@/lib/village-data/source-policy";
import { INTAKE_SOURCE_TYPE_OPTIONS } from "./source-mode";
import type { DesaOption } from "./types";

interface IntakeSourceModeStepProps {
  selectedDesa: DesaOption | null;
  sourceTypeCode: SourceTypeCode;
  sourceName: string;
  sourceUrl: string;
  evidenceNote: string;
  values: Record<string, string>;
  loading: boolean;
  template: TemplateFieldEngineViewModel | null;
  templateLoading: boolean;
  templateError: string | null;
  onSourceTypeCodeChange: (value: SourceTypeCode) => void;
  onSourceNameChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onEvidenceNoteChange: (value: string) => void;
  onValueChange: (fieldKey: string, value: string) => void;
}

export function IntakeSourceModeStep({
  selectedDesa,
  sourceTypeCode,
  sourceName,
  sourceUrl,
  evidenceNote,
  values,
  loading,
  template,
  templateLoading,
  templateError,
  onSourceTypeCodeChange,
  onSourceNameChange,
  onSourceUrlChange,
  onEvidenceNoteChange,
  onValueChange,
}: IntakeSourceModeStepProps) {
  const activeFieldCount = template?.visibleFieldCount ?? 0;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="space-y-1">
            <p className="eyebrow text-[10px]">Mode sumber resmi</p>
            <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
              Siapkan candidate source-backed
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Isi metadata sumber, lengkapi field yang sudah Anda yakini, lalu lanjutkan ke Step 2.
              Fetch isi URL akan dijalankan otomatis saat review pertama kali dibuka.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label text-xs">Source type</label>
              <select
                value={sourceTypeCode}
                onChange={(event) =>
                  onSourceTypeCodeChange(event.target.value as SourceTypeCode)
                }
                className="select-lux text-sm"
                disabled={loading}
              >
                {INTAKE_SOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label text-xs">Source name</label>
              <input
                type="text"
                value={sourceName}
                onChange={(event) => onSourceNameChange(event.target.value)}
                placeholder={
                  selectedDesa
                    ? `Contoh: Web Desa ${selectedDesa.nama}`
                    : "Contoh: Web Desa Batukarut"
                }
                className="field-lux text-sm"
                disabled={loading}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label text-xs">Source URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => onSourceUrlChange(event.target.value)}
                placeholder="https://desa.example.id"
                className="field-lux text-sm"
                disabled={loading}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label text-xs">Evidence note</label>
              <textarea
                rows={3}
                value={evidenceNote}
                onChange={(event) => onEvidenceNoteChange(event.target.value)}
                placeholder="Catatan provenance, periode data, atau konteks kenapa sumber ini dipakai."
                className="textarea-lux text-sm"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <DatabaseZap size={15} className="text-indigo-600" aria-hidden />
              <p className="text-sm font-semibold text-slate-900">Readiness</p>
            </div>
            <div className="mt-3 grid gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Desa target</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedDesa ? selectedDesa.nama : "Pilih desa dulu"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Template aktif</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {template?.templateName ?? (templateLoading ? "Memuat..." : "Menunggu desa")}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Field aktif</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeFieldCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-700" aria-hidden />
              <p className="text-sm font-semibold text-emerald-900">Governance</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-800">
              Internal admin tetap bekerja sebagai reviewer berbasis sumber. Tidak ada publish
              langsung dari layar ini, dan field yang butuh evidence akan dicek lagi di Step 2.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-indigo-700" aria-hidden />
              <p className="text-sm font-semibold text-indigo-900">Auto fetch di Step 2</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-indigo-800">
              URL sumber akan diambil otomatis sekali saat Step 2 pertama kali dibuka. Hasil fetch
              akan disimpan sebagai snapshot agar reviewer tidak perlu mengulang dari awal.
            </p>
          </div>
        </div>
      </div>

      {templateError ? (
        <div className="notice-card notice-danger text-sm">{templateError}</div>
      ) : template ? (
        <TemplateFieldEntrySections
          sections={template.visibleComponents}
          values={values}
          onChange={onValueChange}
          disabled={loading}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
          {selectedDesa
            ? templateLoading
              ? "Memuat field aktif dari template desa..."
              : "Field template belum tersedia untuk desa ini."
            : "Pilih desa dulu untuk memuat field aktif dari template."}
        </div>
      )}
    </div>
  );
}
