"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Info, LayoutGrid, List } from "lucide-react";
import SearchFilterBar from "@/components/desa/SearchFilterBar";
import DesaCard from "@/components/desa/DesaCard";
import DesaTable from "@/components/desa/DesaTable";
import { StatusSerapan, SortField, SortOrder } from "@/lib/types";
import { ASSETS } from "@/lib/assets";
import type { DesaListItem, DesaReadState } from "@/lib/data/desa-read";

type ViewMode = "grid" | "table";

interface Props {
  desa: DesaListItem[];
  initialSearch?: string;
  readState?: DesaReadState;
  readMessage?: string;
  dbHostAlias?: string;
}

export default function DesaListClient({
  desa,
  initialSearch = "",
  readState = "ready",
}: Props) {
  const provinsiList = useMemo(
    () => [...new Set(desa.map((d) => d.provinsi))].sort(),
    [desa]
  );

  const [search, setSearch] = useState(initialSearch);
  const [provinsi, setProvinsi] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [status, setStatus] = useState<StatusSerapan>("semua");
  const [sortField, setSortField] = useState<SortField>("nama");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 12;

  const kabupatenList = useMemo<string[]>(
    () => [...new Set(desa
      .filter((d) => !provinsi || d.provinsi === provinsi)
      .map((d) => d.kabupaten))]
      .sort(),
    [desa, provinsi]
  );

  const kecamatanList = useMemo<string[]>(
    () => [...new Set(desa
      .filter((d) => (!provinsi || d.provinsi === provinsi) && (!kabupaten || d.kabupaten === kabupaten))
      .map((d) => d.kecamatan))]
      .sort(),
    [desa, provinsi, kabupaten]
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...desa];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.nama.toLowerCase().includes(q) ||
          d.kecamatan.toLowerCase().includes(q) ||
          d.kabupaten.toLowerCase().includes(q) ||
          d.provinsi.toLowerCase().includes(q)
      );
    }

    if (provinsi) {
      result = result.filter((d) => d.provinsi === provinsi);
    }

    if (kabupaten) {
      result = result.filter((d) => d.kabupaten === kabupaten);
    }

    if (kecamatan) {
      result = result.filter((d) => d.kecamatan === kecamatan);
    }

    if (status !== "semua") {
      const sc = (d: DesaListItem) => d.completenessScore ?? 0;
      if (status === "ada_anggaran") result = result.filter((d) => (d.paguDanaDesa ?? 0) > 0);
      if (status === "baik")         result = result.filter((d) => sc(d) >= 84);
      if (status === "sedang")       result = result.filter((d) => sc(d) >= 34 && sc(d) < 84);
      if (status === "rendah")       result = result.filter((d) => sc(d) < 34);
    }

    result.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "nama") return multiplier * a.nama.localeCompare(b.nama);
      if (sortField === "completenessScore") return multiplier * ((a.completenessScore ?? 0) - (b.completenessScore ?? 0));
      if (sortField === "paguDanaDesa") return multiplier * ((a.paguDanaDesa ?? 0) - (b.paguDanaDesa ?? 0));
      return 0;
    });

    return result;
  }, [desa, search, provinsi, kabupaten, kecamatan, status, sortField, sortOrder]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // B9: scroll results into view when search query produces results
  useEffect(() => {
    if (search && filtered.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [search, filtered.length]);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const isDataReady = readState === "ready";
  const totalSumber = desa.reduce((acc, item) => acc + (item.jumlahSumber ?? 0), 0);
  const totalDokumen = desa.reduce((acc, item) => acc + (item.jumlahDokumenPendukung ?? 0), 0);
  const freshnessLabel = desa.find((item) => item.terakhirDiperbaruiLabel)?.terakhirDiperbaruiLabel;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Desa</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Pantau penyerapan anggaran dari seluruh desa terdaftar
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Tampilkan kartu desa"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${view === "grid" ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutGrid size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-label="Tampilkan tabel desa"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${view === "table" ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <List size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border px-4 py-3 text-sm ${isDataReady ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white ${isDataReady ? "text-emerald-700" : "text-amber-700"}`}>
            <Info size={16} aria-hidden />
          </div>
          <div>
            <p className="font-bold">
              {isDataReady ? "Data desa siap dibaca" : "Data desa belum siap ditampilkan"}
            </p>
            <p className="mt-1 leading-relaxed">
              {isDataReady
                ? `${desa.length} desa, ${totalSumber} sumber, dan ${totalDokumen} dokumen pendukung tercatat. ${freshnessLabel ?? "Tanggal pembaruan belum tercatat."}`
                : "Kami belum bisa menampilkan daftar desa saat ini. Coba muat ulang beberapa saat lagi."}
            </p>
          </div>
        </div>
      </div>

      <SearchFilterBar
        search={search}
        onSearch={handleFilterChange(setSearch)}
        provinsi={provinsi}
        onProvinsi={(value) => {
          setProvinsi(value);
          setKabupaten("");
          setKecamatan("");
          setPage(1);
        }}
        kabupaten={kabupaten}
        onKabupaten={(value) => {
          setKabupaten(value);
          setKecamatan("");
          setPage(1);
        }}
        kecamatan={kecamatan}
        onKecamatan={handleFilterChange(setKecamatan)}
        status={status}
        onStatus={(v) => { setStatus(v); setPage(1); }}
        provinsiList={provinsiList}
        kabupatenList={kabupatenList}
        kecamatanList={kecamatanList}
        totalResults={filtered.length}
      />

      {/* B9 scroll target */}
      <div ref={resultsRef} />

      {readState !== "ready" ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-100 bg-white px-6 py-12 text-center shadow-sm">
          <Image
            src={ASSETS.mascotEmpty}
            alt="Data desa belum siap ditampilkan"
            width={150}
            height={170}
            className="object-contain"
          />
          <div>
            <p className="mb-1 text-base font-semibold text-slate-700 sm:text-sm">Data desa belum tersedia</p>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500 sm:text-xs">
              Beberapa data masih sedang disiapkan. Silakan coba muat ulang halaman ini atau kembali lagi nanti.
            </p>
          </div>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
          <Image
            src={ASSETS.mascotEmpty}
            alt="Pak Waspada tidak menemukan hasil pencarian"
            width={150}
            height={170}
            className="object-contain"
          />
          <div>
            <p className="mb-1 text-base font-semibold text-slate-700 sm:text-sm">Tidak ada desa yang cocok</p>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500 sm:text-xs">
              Pak Waspada sudah mencari ke mana-mana tapi tidak ketemu.
              Coba ubah filter atau kata kunci pencarianmu.
            </p>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((d) => <DesaCard key={d.id} desa={d} />)}
        </div>
      ) : (
        <DesaTable
          desa={paginated}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Sebelumnya
          </button>

          {/* Compact page window: first, ...window..., last */}
          {(() => {
            const btn = (p: number) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-label={`Halaman ${p}`}
                className={`min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            );
            const ellipsis = (k: string) => (
              <span key={k} className="px-1 text-slate-400 text-sm select-none">…</span>
            );
            const WINDOW = 2; // pages each side of current
            const pages: React.ReactNode[] = [];
            const lo = Math.max(2, page - WINDOW);
            const hi = Math.min(totalPages - 1, page + WINDOW);
            pages.push(btn(1));
            if (lo > 2) pages.push(ellipsis("el"));
            for (let p = lo; p <= hi; p++) pages.push(btn(p));
            if (hi < totalPages - 1) pages.push(ellipsis("er"));
            if (totalPages > 1) pages.push(btn(totalPages));
            return pages;
          })()}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya →
          </button>

          <span className="text-[12px] text-slate-400 ml-1">
            Hal {page} dari {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
