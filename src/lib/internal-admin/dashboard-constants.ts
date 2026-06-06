import type {
  DashboardOfficialReference,
  DashboardRankingFilters,
  DashboardRankingPreset,
} from "./dashboard-types";

export const INTERNAL_DASHBOARD_ROUTE = "/internal-admin/dashboard";
export const INTERNAL_DASHBOARD_RANKING_LIMIT = 12;

export const INDONESIA_DESA_REFERENCE: DashboardOfficialReference = {
  totalCount: 75_753,
  sourceName: "BPS Podes 2024",
  sourceUrl:
    "https://www.bps.go.id/id/publication/2024/12/10/2f5217e2d6a695a0830290a7/village-potential-statistics-of-indonesia-2024.html",
  sourceDate: "2024-12-10",
  lastCheckedAt: "2026-05-18",
};

export const DASHBOARD_TRAFFIC_EMPTY_STATE = {
  kind: "unconfigured" as const,
  title: "Traffic analytics belum dikonfigurasi",
  body: "Sambungkan Vercel Analytics, PostHog, Plausible, atau Umami untuk melihat traffic publik PantauDesa dan halaman desa.",
  providerLabel: "Belum ada provider traffic aktif",
};

export const DASHBOARD_RANKING_PRESETS: ReadonlyArray<{
  key: DashboardRankingPreset;
  label: string;
}> = [
  { key: "least_complete", label: "Paling kurang lengkap" },
  { key: "docs_pending", label: "Dokumen pending" },
  { key: "dummy_heavy", label: "Dummy tertinggi" },
  { key: "unresolved_comments", label: "Suara belum selesai" },
  { key: "no_verified_admin", label: "Tanpa admin verified" },
  { key: "most_comments", label: "Komentar terbanyak" },
  { key: "outdated", label: "Paling lama diupdate" },
  { key: "source_backed_best", label: "Paling siap dipromosikan" },
] as const;

export const DEFAULT_DASHBOARD_RANKING_FILTERS: DashboardRankingFilters = {
  q: "",
  provinsi: "",
  kabupaten: "",
  kecamatan: "",
  preset: null,
};

export const COMPONENT_LABEL_FALLBACKS: ReadonlyArray<{
  componentKey: string;
  label: string;
}> = [
  { componentKey: "identitas", label: "Identitas & Wilayah" },
  { componentKey: "demografi", label: "Demografi" },
  { componentKey: "sumber_dokumen", label: "Sumber & Dokumen" },
  { componentKey: "transparansi", label: "Transparansi & Skor" },
  { componentKey: "anggaran", label: "Anggaran & Realisasi" },
  { componentKey: "pendapatan", label: "Sumber Pendapatan" },
  { componentKey: "kinerja", label: "Kinerja & APBDes" },
  { componentKey: "profil_desa", label: "Profil & Kelengkapan" },
  { componentKey: "panduan_warga", label: "Panduan Warga" },
  { componentKey: "suara_warga", label: "Suara Warga" },
] as const;
