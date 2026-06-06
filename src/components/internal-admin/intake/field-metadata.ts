import type { AiMappableDesaField } from "@/lib/admin-claim/ai-mapping";
import type { DiffEntry } from "./types";

export const FIELD_LABELS: Record<AiMappableDesaField, string> = {
  websiteUrl: "Website resmi",
  kategori: "Kategori desa",
  tahunData: "Tahun data",
  jumlahPenduduk: "Jumlah penduduk",
  kecamatan: "Kecamatan",
  kabupaten: "Kabupaten/Kota",
  provinsi: "Provinsi",
};

export const DELTA_LABELS: Record<string, string> = {
  added: "Added",
  removed: "Removed",
  updated: "Updated",
  unchanged: "Same",
};

export const FIELD_SECTION_MAP: Record<AiMappableDesaField, string> = {
  websiteUrl: "Kontak & layanan",
  kategori: "Identitas",
  tahunData: "Identitas",
  jumlahPenduduk: "Identitas",
  kecamatan: "Wilayah",
  kabupaten: "Wilayah",
  provinsi: "Wilayah",
};

export const FIELD_SECTION_ORDER = ["Identitas", "Wilayah", "Kontak & layanan"] as const;

export const BADGE_COLORS = {
  mappingNeedCheck: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  mappingPartial: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  mappingSuccess: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  validationError: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  validationWarning: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  validationOk: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  reviewNotReady: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  reviewReady: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  reviewNotEnough: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  reviewSafe: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  openaiSuccess: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  openaiUnavailable: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  openaiFallback: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  openaiLocal: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  diffAdded: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  diffRemoved: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  diffUpdated: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  diffUnchanged: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
} as const;

export function getDiffBadgeClasses(deltaType: DiffEntry["deltaType"]) {
  switch (deltaType) {
    case "added":
      return BADGE_COLORS.diffAdded;
    case "removed":
      return BADGE_COLORS.diffRemoved;
    case "updated":
      return BADGE_COLORS.diffUpdated;
    default:
      return BADGE_COLORS.diffUnchanged;
  }
}
