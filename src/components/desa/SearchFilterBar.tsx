"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { StatusSerapan } from "@/lib/types";
import { FILTER, STATUS_FILTER_LABELS } from "@/lib/copy";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  provinsi: string;
  onProvinsi: (v: string) => void;
  kabupaten: string;
  onKabupaten: (v: string) => void;
  kecamatan: string;
  onKecamatan: (v: string) => void;
  status: StatusSerapan;
  onStatus: (v: StatusSerapan) => void;
  provinsiList: string[];
  kabupatenList: string[];
  kecamatanList: string[];
  totalResults: number;
}

type StatusOption = { value: StatusSerapan; color: string };

const STATUS_OPTIONS: StatusOption[] = [
  { value: "semua",        color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "ada_anggaran", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "baik",         color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "sedang",       color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "rendah",       color: "bg-rose-100 text-rose-700 border-rose-200" },
];

export default function SearchFilterBar({
  search, onSearch, provinsi, onProvinsi, kabupaten, onKabupaten, kecamatan, onKecamatan,
  status, onStatus, provinsiList, kabupatenList, kecamatanList, totalResults,
}: Props) {
  const hasFilter = search || provinsi || kabupaten || kecamatan || status !== "semua";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.75fr))]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={FILTER.searchPlaceholder}
            className="min-h-[44px] w-full pl-9 pr-11 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Hapus kata kunci pencarian"
              className="absolute right-1.5 top-1/2 flex min-h-[40px] min-w-[40px] -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden />
          <select
            value={provinsi}
            onChange={(e) => onProvinsi(e.target.value)}
            aria-label="Filter provinsi"
            className="min-h-[44px] w-full pl-8 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition appearance-none cursor-pointer"
          >
            <option value="">{FILTER.allProvinsi}</option>
            {provinsiList.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            value={kabupaten}
            onChange={(e) => onKabupaten(e.target.value)}
            aria-label="Filter kabupaten"
            className="min-h-[44px] w-full px-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition appearance-none cursor-pointer"
          >
            <option value="">Semua Kabupaten</option>
            {kabupatenList.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            value={kecamatan}
            onChange={(e) => onKecamatan(e.target.value)}
            aria-label="Filter kecamatan"
            className="min-h-[44px] w-full px-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition appearance-none cursor-pointer"
          >
            <option value="">Semua Kecamatan</option>
            {kecamatanList.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="flex w-full items-center gap-1 text-sm font-semibold text-slate-600 sm:w-auto sm:mr-1">
          <SlidersHorizontal size={13} aria-hidden /> {FILTER.filterLabel}
        </span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatus(opt.value)}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 ${
              status === opt.value
                ? opt.color + " ring-2 ring-offset-1 ring-indigo-300 font-semibold"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {STATUS_FILTER_LABELS[opt.value]}
          </button>
        ))}
        {hasFilter && (
          <button
            type="button"
            onClick={() => { onSearch(""); onProvinsi(""); onKabupaten(""); onKecamatan(""); onStatus("semua"); }}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 sm:ml-auto"
          >
            <X size={12} aria-hidden /> {FILTER.reset}
          </button>
        )}
      </div>

      <p className="text-sm font-medium text-slate-500">{FILTER.totalResults(totalResults)}</p>
    </div>
  );
}
