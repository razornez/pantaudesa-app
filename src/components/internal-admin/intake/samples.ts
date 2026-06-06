export const SAMPLE_VALID_TEXT = `Website: https://contoh-desa.go.id
Jumlah Penduduk: 2450 jiwa
Tahun Data: 2024
Kategori Desa: Mandiri
Kecamatan: Cibungbulang
Kabupaten: Bogor
Provinsi: Jawa Barat`;

export const SAMPLE_COMPLEX_TEXT = `BERITA ACARA PEMBARUAN DATA DESA

Nama Desa: Baros
Tanggal Penyusunan: 6 Mei 2026
Website: https://baros-arjasari.desa.id
Jumlah Penduduk: 3786 jiwa
Tahun Data: 2025
Kategori Desa: Maju
Kecamatan: Arjasari
Kabupaten: Bandung
Provinsi: Jawa Barat

RINGKASAN PERUBAHAN
- Website resmi diperbarui dari domain lama ke domain desa.id.
- Jumlah penduduk disesuaikan berdasarkan rekap pelayanan semester II 2025.
- Kategori desa diperbarui menjadi Maju.
- Metadata wilayah diverifikasi ulang oleh tim administrasi desa.

CATATAN REVIEW INTERNAL
Dokumen ini dipakai sebagai contoh uji intake.
Data ini belum boleh dipublikasikan otomatis dan tetap harus melalui review internal.`;

export const ACCEPTED_FILE_TYPES = [
  ".docx",
  ".xlsx",
  ".pdf",
  ".txt",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
].join(",");

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
].join(",");

export const MAX_FILE_SIZE_MB = 10;

export function buildSampleDiffText(selectedDesa: {
  slug?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
} | null) {
  const slug = selectedDesa?.slug ?? "desa-contoh-maju";
  const kecamatan = selectedDesa?.kecamatan ?? "Cibungbulang";
  const kabupaten = selectedDesa?.kabupaten ?? "Bogor";
  const provinsi = selectedDesa?.provinsi ?? "Jawa Barat";

  return `Website: https://${slug}.desa.id
Jumlah Penduduk: 3210 jiwa
Tahun Data: 2025
Kategori Desa: Maju
Kecamatan: ${kecamatan}
Kabupaten: ${kabupaten}
Provinsi: ${provinsi}`;
}
