import { AI_MAPPABLE_DESA_FIELDS } from "@/lib/admin-claim/ai-mapping";
import type { DocStatus, FieldLabelMap } from "./types";

export const STATUS_META: Record<
  DocStatus,
  { label: string; pill: string; note: string }
> = {
  WAITING_VERIFIED_APPROVAL: {
    label: "Belum masuk review",
    pill: "pill-warn",
    note: "Admin verified desa diutamakan untuk mengecek dulu, tetapi admin internal tetap bisa ambil alih bila operasional perlu jalan.",
  },
  PROCESSING: {
    label: "Perlu review internal",
    pill: "pill-info",
    note: "Dokumen siap dicek, dilengkapi, lalu diputuskan untuk dipublish atau tidak.",
  },
  PUBLISHED: {
    label: "Sudah dipublikasikan",
    pill: "pill-ok",
    note: "Data dari dokumen ini sudah diterapkan ke halaman desa dan tidak perlu aksi lanjut.",
  },
  REJECTED: {
    label: "Ditolak verified",
    pill: "pill-danger",
    note: "Dokumen dihentikan oleh admin verified desa. Pengunggah perlu unggah dokumen baru dengan perbaikan.",
  },
  FAILED: {
    label: "Perlu unggahan ulang",
    pill: "pill-danger",
    note: "Dokumen tidak bisa dipakai dan pengunggah perlu menerima alasan yang jelas.",
  },
};

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "WAITING_VERIFIED_APPROVAL", label: "Menunggu" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "PUBLISHED", label: "Sudah tayang" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "FAILED", label: "Gagal" },
] as const;

export const FIELD_LABELS: FieldLabelMap = {
  websiteUrl: "Website resmi",
  kategori: "Kategori desa",
  tahunData: "Tahun data",
  jumlahPenduduk: "Jumlah penduduk",
  kecamatan: "Kecamatan",
  kabupaten: "Kabupaten/Kota",
  provinsi: "Provinsi",
};

export const REVIEW_FIELDS = [...AI_MAPPABLE_DESA_FIELDS];
