import type { ScopeType, SourceType } from "@/generated/prisma";

/**
 * Canonical registry of public data sources (BMAD-T-001-v2).
 * `code` is used as the DataSource.id (stable FK target) when seeded, and as
 * DataDesa.sourceId / DataSourceFetchRun reference by the ingestion runner.
 *
 * Seeding into the `DataSource` table is a separate sub-task; this file is the
 * single source of truth for the list.
 */
export interface DataSourceDef {
  code: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  scopeType: ScopeType;
  scopeName: string;
  /** 1–5 editorial trust (kept here; DataSource table has no trust column) */
  trustLevel: number;
  format: "EXCEL" | "PDF" | "HTML" | "API_JSON" | "WEB" | "MANUAL";
  frekuensiUpdate: string;
}

export const DATA_SOURCE_REGISTRY: DataSourceDef[] = [
  { code: "BPS-KW", sourceName: "BPS Kode Wilayah", sourceUrl: "https://sig.bps.go.id", sourceType: "official_website", scopeType: "national", scopeName: "Indonesia", trustLevel: 5, format: "HTML", frekuensiUpdate: "tahunan" },
  { code: "BPS-PODES", sourceName: "BPS Potensi Desa (Podes)", sourceUrl: "https://www.bps.go.id", sourceType: "official_document", scopeType: "kabupaten", scopeName: "per kabupaten", trustLevel: 5, format: "EXCEL", frekuensiUpdate: "3-tahunan" },
  { code: "IDM", sourceName: "Indeks Desa Membangun (Kemendesa)", sourceUrl: "https://idm.kemendesa.go.id", sourceType: "official_website", scopeType: "national", scopeName: "Indonesia", trustLevel: 5, format: "EXCEL", frekuensiUpdate: "tahunan" },
  { code: "DJPK-PMK", sourceName: "PMK Rincian Dana Desa (DJPK Kemenkeu)", sourceUrl: "https://djpk.kemenkeu.go.id", sourceType: "official_document", scopeType: "national", scopeName: "Indonesia", trustLevel: 5, format: "EXCEL", frekuensiUpdate: "tahunan" },
  { code: "OMSPAN-DD", sourceName: "OM-SPAN Dana Desa (Kemenkeu)", sourceUrl: "https://omspan.kemenkeu.go.id", sourceType: "official_website", scopeType: "national", scopeName: "Indonesia", trustLevel: 5, format: "WEB", frekuensiUpdate: "real-time" },
  { code: "PRODESKEL", sourceName: "Profil Desa Kemendagri (Prodeskel)", sourceUrl: "https://prodeskel.binapemdes.kemendagri.go.id", sourceType: "official_website", scopeType: "national", scopeName: "Indonesia", trustLevel: 4, format: "WEB", frekuensiUpdate: "tahunan" },
  { code: "PPID-BANDUNG", sourceName: "PPID Kabupaten Bandung", sourceUrl: "https://ppid.bandungkab.go.id", sourceType: "official_website", scopeType: "kabupaten", scopeName: "Kabupaten Bandung", trustLevel: 4, format: "HTML", frekuensiUpdate: "variabel" },
  { code: "OSM", sourceName: "OpenStreetMap", sourceUrl: "https://nominatim.openstreetmap.org", sourceType: "official_website", scopeType: "national", scopeName: "Global", trustLevel: 3, format: "API_JSON", frekuensiUpdate: "komunitas" },
  { code: "BUMDES-REG", sourceName: "Registry BUMDes Kemendesa", sourceUrl: "https://bumdes.kemendesa.go.id", sourceType: "official_website", scopeType: "national", scopeName: "Indonesia", trustLevel: 4, format: "WEB", frekuensiUpdate: "variabel" },
  { code: "DESA-WEB", sourceName: "Website Resmi Desa (OpenSID)", sourceUrl: "", sourceType: "official_website", scopeType: "desa", scopeName: "per desa", trustLevel: 4, format: "HTML", frekuensiUpdate: "variabel" },
  { code: "KECAMATAN-BDG", sourceName: "Situs Kecamatan Kab. Bandung (profil desa)", sourceUrl: "https://kecamatan{kec}.bandungkab.go.id", sourceType: "official_website", scopeType: "kabupaten", scopeName: "Kabupaten Bandung", trustLevel: 4, format: "HTML", frekuensiUpdate: "tahunan" },
];

export const DATA_SOURCE_BY_CODE: Record<string, DataSourceDef> = Object.fromEntries(
  DATA_SOURCE_REGISTRY.map((s) => [s.code, s]),
);
