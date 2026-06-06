import type {
  DashboardRankingFilters,
  InternalDashboardRankingResponse,
} from "@/lib/internal-admin/dashboard-types";

function buildRankingParams(filters: DashboardRankingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.provinsi) params.set("provinsi", filters.provinsi);
  if (filters.kabupaten) params.set("kabupaten", filters.kabupaten);
  if (filters.kecamatan) params.set("kecamatan", filters.kecamatan);
  if (filters.preset) params.set("preset", filters.preset);
  return params.toString();
}

export async function fetchDashboardRankings(
  filters: DashboardRankingFilters,
  signal?: AbortSignal,
): Promise<InternalDashboardRankingResponse> {
  const response = await fetch(
    `/api/internal-admin/dashboard/village-rankings?${buildRankingParams(filters)}`,
    { signal },
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Gagal memuat ranking desa.");
  }
  return (await response.json()) as InternalDashboardRankingResponse;
}
