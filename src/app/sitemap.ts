import type { MetadataRoute } from "next";
import { getDesaListResult } from "@/lib/data/desa-read";

const BASE_URL = "https://pantaudesa.id";

// Regenerate at most once per hour. If the DB is unavailable, getDesaListResult
// returns an empty list and the sitemap gracefully degrades to static routes
// only (never throws).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/desa`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/bandingkan`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/suara-warga`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/panduan`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/panduan/kewenangan`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/tentang/kenapa-desa-dipantau`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/badge`, changeFrequency: "monthly", priority: 0.3 },
  ];

  let desaRoutes: MetadataRoute.Sitemap = [];
  try {
    const result = await getDesaListResult();
    desaRoutes = result.items.map((desa) => ({
      url: `${BASE_URL}/desa/${desa.id}`,
      lastModified: desa.dataPublishedAt ? new Date(desa.dataPublishedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable — ship the static routes so the sitemap is still valid.
  }

  return [...staticRoutes, ...desaRoutes];
}
