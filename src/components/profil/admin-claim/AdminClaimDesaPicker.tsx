import { useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import type { AdminClaimDesaOption } from "@/lib/data/admin-claim-read";
import type { AdminClaimEligibility } from "@/lib/admin-claim/eligibility";

export default function AdminClaimDesaPicker({
  loading,
  loadError,
  search,
  onSearchChange,
  filteredDesa,
  visibleCount,
  selectedDesaId,
  onSelect,
  selectedDesa,
  eligibility,
  onContinue,
}: {
  loading: boolean;
  loadError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filteredDesa: AdminClaimDesaOption[];
  visibleCount: number;
  selectedDesaId: string | null;
  onSelect: (desaId: string) => void;
  selectedDesa: AdminClaimDesaOption | null;
  eligibility: AdminClaimEligibility;
  onContinue: () => void;
}) {
  const visibleDesa = filteredDesa.slice(0, visibleCount);
  const [isListOpen, setIsListOpen] = useState(true);

  const handleSelect = (desaId: string) => {
    onSelect(desaId);
    setIsListOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-950">Pilih desa</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Mulai dari desa yang ingin kamu kelola. Kami tampilkan kanal resmi yang sudah tercatat agar langkah berikutnya lebih jelas.
        </p>
      </div>

      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setIsListOpen(true);
          }}
          onFocus={() => setIsListOpen(true)}
          aria-label="Cari desa untuk klaim admin"
          placeholder="Ketik nama desa, kecamatan, atau kabupaten"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {selectedDesa ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pilihan saat ini</p>
            <p className="truncate text-sm font-bold text-slate-900">{selectedDesa.nama}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsListOpen((current) => !current)}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
          >
            {isListOpen ? "Tutup daftar" : "Ganti desa"}
            <ChevronDown
              size={14}
              className={`transition-transform ${isListOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            Memuat desa dan status akses...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm leading-relaxed text-rose-700">
            Data akses admin belum bisa dimuat sekarang. Kamu tetap bisa lanjut dengan tombol Hubungi Kami.
          </div>
        ) : !isListOpen && selectedDesa ? null : visibleDesa.length > 0 ? (
          <>
            {visibleDesa.map((desa) => {
              const selected = desa.id === selectedDesaId;

              return (
                <button
                  key={desa.id}
                  type="button"
                  onClick={() => handleSelect(desa.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 ${
                    selected
                      ? "border-indigo-300 bg-indigo-50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{desa.nama}</p>
                        <DataStatusBadge status={desa.dataStatus} size="xs" />
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {desa.kecamatan}, {desa.kabupaten}, {desa.provinsi}
                      </p>
                    </div>
                    <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <MapPin size={14} />
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredDesa.length > visibleCount ? (
              <p className="text-xs text-slate-500">
                Menampilkan {visibleCount} dari {filteredDesa.length} hasil teratas. Persempit kata kunci jika perlu.
              </p>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            Kami belum menemukan desa dengan kata kunci itu.
          </div>
        )}
      </div>

      {selectedDesa ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Desa terpilih</p>
          <p className="mt-1 text-sm font-black text-slate-900">{selectedDesa.nama}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {selectedDesa.kecamatan}, {selectedDesa.kabupaten}, {selectedDesa.provinsi}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {selectedDesa.sourceLabel}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              Email resmi: {selectedDesa.officialEmailLabel}
            </span>
          </div>
          {!eligibility.canStartNewClaim ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs leading-relaxed text-amber-800">
              {eligibility.message}
            </div>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onContinue}
              disabled={!eligibility.canStartNewClaim}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Lanjut ke cara verifikasi
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
