import type { SourceTypeCode } from "@/lib/village-data/source-policy";

export const INTAKE_SOURCE_TYPE_OPTIONS = [
  { value: "OFFICIAL_WEBSITE", label: "Website resmi desa" },
  { value: "GOVERNMENT_SOURCE", label: "Sumber pemerintah" },
  { value: "PROVINCE_PARTNER", label: "Sumber mitra provinsi / kabupaten" },
  { value: "TRUSTED_GOVERNANCE_SOURCE", label: "Sumber governance terpercaya" },
] as const satisfies ReadonlyArray<{ value: SourceTypeCode; label: string }>;

export const DEFAULT_INTAKE_SOURCE_TYPE: SourceTypeCode = "OFFICIAL_WEBSITE";

export function buildDefaultSourceName(
  sourceTypeCode: SourceTypeCode,
  desaName: string | null,
) {
  const suffix = desaName?.trim() ? ` ${desaName.trim()}` : "";

  switch (sourceTypeCode) {
    case "OFFICIAL_WEBSITE":
      return `Web Desa${suffix}`;
    case "GOVERNMENT_SOURCE":
      return `Sumber Pemerintah${suffix}`;
    case "PROVINCE_PARTNER":
      return `Sumber Mitra Provinsi${suffix}`;
    case "TRUSTED_GOVERNANCE_SOURCE":
      return `Sumber Governance${suffix}`;
    default:
      return `Sumber Resmi${suffix}`;
  }
}
