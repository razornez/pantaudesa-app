import type { AdminDesaFilter } from "../AdminDesaFilterBar";

interface FilterOptions {
  provinsi: string[];
  kabupaten: string[];
  kecamatan: string[];
}

export async function fetchDesaFilterOptions(
  filter: Pick<AdminDesaFilter, "provinsi" | "kabupaten">,
): Promise<FilterOptions> {
  const params = new URLSearchParams();
  if (filter.provinsi) params.set("provinsi", filter.provinsi);
  if (filter.kabupaten) params.set("kabupaten", filter.kabupaten);

  const response = await fetch(`/api/internal-admin/desa-filter-options?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Gagal memuat filter desa.");
  }

  return (await response.json()) as FilterOptions;
}
