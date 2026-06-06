"use client";

import { useRef, useState, startTransition, useDeferredValue } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronRight, LoaderCircle } from "lucide-react";
import AdminDesaFilterBar, { type AdminDesaFilter } from "@/components/internal-admin/AdminDesaFilterBar";
import {
  DASHBOARD_RANKING_PRESETS,
} from "@/lib/internal-admin/dashboard-constants";
import type {
  DashboardRankingFilters,
  DashboardVillageRankingItem,
  InternalDashboardRankingResponse,
} from "@/lib/internal-admin/dashboard-types";
import { fetchDashboardRankings } from "./api";
import {
  EmptyNotice,
  SectionHeading,
  SecondaryLink,
  Surface,
  ToneBadge,
  formatPercent,
  formatRelativeDays,
  formatWholeNumber,
  toneClasses,
} from "./shared";

function buildSearchParams(filters: DashboardRankingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.provinsi) params.set("provinsi", filters.provinsi);
  if (filters.kabupaten) params.set("kabupaten", filters.kabupaten);
  if (filters.kecamatan) params.set("kecamatan", filters.kecamatan);
  if (filters.preset) {
    params.set("preset", filters.preset);
  }
  return params.toString();
}

function RankingCard({ item }: { item: DashboardVillageRankingItem }) {
  const styles = toneClasses(item.tone);
  return (
    <div
      className="rounded-[1.35rem] bg-white p-4 sm:p-5"
      style={{ boxShadow: `inset 0 0 0 1px ${styles.border}` }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge
              tone={item.tone}
              label={
                item.tone === "critical"
                  ? "Perlu aksi cepat"
                  : item.tone === "warning"
                    ? "Perlu dibereskan"
                    : "Lebih siap"
              }
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              risk score {item.riskScore}
            </span>
          </div>
          <div>
            <h3 className="text-[20px] font-semibold text-slate-950" style={{ letterSpacing: "-0.04em" }}>
              {item.desaName}
            </h3>
            <p className="mt-1 text-[13px] leading-6 text-slate-500">
              {item.locationLabel} · {item.dataStatusLabel}
            </p>
          </div>
          <p className="max-w-2xl text-[14px] leading-7 text-slate-700">{item.summaryLabel}</p>
          <div className="flex flex-wrap gap-2">
            <span className="pill-info inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold">
              {formatWholeNumber(item.sourceBackedFields)} source-backed
            </span>
            <span className="pill-warn inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold">
              {formatWholeNumber(item.pendingDocumentCount)} dokumen pending
            </span>
            <span className="pill-danger inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold">
              {formatWholeNumber(item.unresolvedVoiceCount)} suara belum selesai
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
              {formatWholeNumber(item.verifiedAdminCount)} admin verified
            </span>
          </div>
        </div>

        <div className="w-full max-w-[320px] space-y-3 lg:w-[320px]">
          <div className="rounded-[1.15rem] bg-slate-50 px-3.5 py-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>Kelengkapan nyata</span>
              <span className="text-slate-900">{formatPercent(item.completenessRatio)}</span>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white">
              <div className="bg-emerald-500" style={{ width: `${item.completenessRatio}%` }} />
              <div
                className="bg-indigo-400"
                style={{
                  width:
                    item.visibleFieldCount > 0
                      ? `${(item.fallbackFields / item.visibleFieldCount) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-2 text-[12px] text-slate-500">
              Publish terakhir {formatRelativeDays(item.lastPublishedAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={item.workHref} className="btn-lux-secondary text-[12px]">
              Buka Data Desa
            </Link>
            <Link href={item.publicHref} className="btn-lux-ghost text-[12px]">
              Detail Publik
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RankingExplorer({
  initialResponse,
}: {
  initialResponse: InternalDashboardRankingResponse;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fetchControllerRef = useRef<AbortController | null>(null);
  const [filters, setFilters] = useState<DashboardRankingFilters>(initialResponse.filters);
  const [rankingResponse, setRankingResponse] =
    useState<InternalDashboardRankingResponse>(initialResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredItems = useDeferredValue(rankingResponse.items);
  const hasSelectedPreset = filters.preset !== null;
  const visibleItems = hasSelectedPreset ? deferredItems : [];
  const visibleError = hasSelectedPreset ? error : null;
  const visibleLoading = hasSelectedPreset && isLoading;

  const applyFilters = (nextFilters: DashboardRankingFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("provinsi");
    params.delete("kabupaten");
    params.delete("kecamatan");
    params.delete("preset");
    const nextParams = buildSearchParams(nextFilters);
    if (nextParams) {
      for (const [key, value] of new URLSearchParams(nextParams)) {
        params.set(key, value);
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const commitFilters = (nextFilters: DashboardRankingFilters) => {
    setFilters(nextFilters);
    applyFilters(nextFilters);
    fetchControllerRef.current?.abort();

    if (!nextFilters.preset) {
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    fetchControllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    fetchDashboardRankings(nextFilters, controller.signal)
      .then((response) => {
        startTransition(() => {
          setRankingResponse(response);
        });
      })
      .catch((fetchError) => {
          if (controller.signal.aborted) return;
          setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat ranking desa.");
      })
      .finally(() => {
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
        }
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
  };

  const handleFilterChange = (next: AdminDesaFilter) => {
    commitFilters({
      ...filters,
      ...next,
    });
  };

  const handlePresetChange = (preset: DashboardRankingFilters["preset"]) => {
    commitFilters({
      ...filters,
      preset,
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Ranking desa perlu perhatian"
        title="Begitu melihat list ini, owner harus langsung tahu desa mana yang perlu disentuh dulu"
        note="List tidak langsung dibuka semua. Pilih dulu kriteria yang ingin Anda lihat, baru dashboard menampilkan desa yang paling relevan untuk sudut pandang itu."
        action={
          !hasSelectedPreset ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
              Pilih kriteria dulu
              <ChevronRight size={13} aria-hidden />
            </span>
          ) : visibleLoading ? (
            <span className="inline-flex items-center gap-2 text-[12px] text-slate-500">
              <LoaderCircle size={14} className="animate-spin" aria-hidden />
              Memuat ulang ranking
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
              {visibleItems.length} desa ditampilkan
              <ChevronRight size={13} aria-hidden />
            </span>
          )
        }
      />

      <Surface>
        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <AdminDesaFilterBar
            key={`${filters.q}|${filters.provinsi}|${filters.kabupaten}|${filters.kecamatan}`}
            initialFilter={filters}
            onChange={handleFilterChange}
          />

          <div className="flex flex-wrap gap-2">
            {DASHBOARD_RANKING_PRESETS.map((preset) => {
              const isActive = filters.preset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePresetChange(preset.key)}
                  className={`rounded-full px-3.5 py-2 text-[11.5px] font-semibold transition-colors ${
                    isActive
                      ? "bg-[#1E1B4B] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            {hasSelectedPreset ? (
              <button
                type="button"
                onClick={() => handlePresetChange(null)}
                className="rounded-full bg-white px-3.5 py-2 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
              >
                Reset pilihan
              </button>
            ) : null}
          </div>

          {visibleError ? (
            <EmptyNotice title="Ranking belum bisa dimuat" body={visibleError} />
          ) : null}

          {!visibleError && !hasSelectedPreset ? (
            <EmptyNotice
              title="Pilih kriteria ranking dulu"
              body="Supaya tidak melelahkan saat dibaca, dashboard tidak langsung menampilkan seluruh daftar desa. Pilih salah satu preset di atas, misalnya desa paling kurang lengkap atau tanpa admin verified, lalu hasilnya baru dimunculkan."
            />
          ) : null}

          {!visibleError && hasSelectedPreset && visibleItems.length === 0 ? (
            <EmptyNotice
              title="Belum ada desa yang cocok dengan filter ini"
              body="Coba longgarkan preset atau filter wilayah. Dashboard akan langsung menampilkan desa begitu ada kandidat yang cocok."
            />
          ) : null}

          {!visibleError && hasSelectedPreset && visibleItems.length > 0 ? (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <RankingCard key={item.desaId} item={item} />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
              <p>
                Ranking ini sengaja memadukan sinyal data publik, dokumen, admin desa, dan suara warga.
                Suara warga tetap dianggap sinyal, bukan sumber fakta final.
              </p>
            </div>
            <Link href="/internal-admin/village-data?tab=activity">
              <SecondaryLink label="Buka log aktivitas" />
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  );
}
