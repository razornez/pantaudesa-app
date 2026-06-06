/**
 * verdicts.ts — fungsi murni yang menghasilkan pesan berjiwa berdasarkan data.
 *
 * Prinsip: setiap fungsi hanya punya satu tanggung jawab, tidak ada efek samping,
 * dan tidak tahu apapun tentang UI (warna, className, dll.).
 */

import { RiwayatTahunan, SkorTransparansi } from "./types";
import { formatRupiah } from "./utils";

export type VerdictTone = "positive" | "warning" | "danger" | "neutral";

export interface Verdict {
  message: string;
  tone: VerdictTone;
}

// ─── Penyerapan anggaran ──────────────────────────────────────────────────────

/**
 * Menghasilkan pesan manusiawi tentang kondisi serapan anggaran.
 * Tujuan: warga langsung paham tanpa harus mengerti istilah keuangan.
 */
export function getAbsorptionVerdict(persen: number, selisih: number): Verdict {
  const rupiah = formatRupiah(selisih);

  if (persen >= 95) return {
    message: `Hampir seluruh anggaran sudah digunakan. Sisa ${rupiah} masih dalam proses akhir tahun.`,
    tone: "positive",
  };
  if (persen >= 85) return {
    message: `Sebagian besar anggaran sudah digunakan. Sisa ${rupiah} masih berjalan — pantau terus hasilnya.`,
    tone: "positive",
  };
  if (persen >= 70) return {
    message: `${rupiah} belum jelas penggunaannya. Wajar untuk ditanyakan langsung ke kepala desa.`,
    tone: "warning",
  };
  if (persen >= 60) return {
    message: `${rupiah} belum terpakai — jumlah yang cukup besar. Warga berhak menanyakan rencana penggunaannya.`,
    tone: "warning",
  };
  if (persen >= 40) return {
    message: `Hampir separuh anggaran (${rupiah}) belum jelas penggunaannya. Ini perlu dipertanyakan langsung ke desa.`,
    tone: "danger",
  };
  return {
    message: `Sebagian besar anggaran (${rupiah}) belum jelas penggunaannya. Desa ini perlu pengawasan serius dari warganya.`,
    tone: "danger",
  };
}

// ─── Tren historis ────────────────────────────────────────────────────────────

/**
 * Membaca tren riwayat 5 tahun dan menghasilkan kalimat jujur tentang pola kinerjanya.
 */
export function getTrendVerdict(riwayat: RiwayatTahunan[]): Verdict {
  if (riwayat.length < 2) return {
    message: "Data tren belum tersedia untuk desa ini.",
    tone: "neutral",
  };

  const sorted = [...riwayat].sort((a, b) => a.tahun - b.tahun);
  const first   = sorted[0].persentaseSerapan;
  const last    = sorted[sorted.length - 1].persentaseSerapan;
  const diff    = last - first;
  const lastTwo = sorted[sorted.length - 1].persentaseSerapan - sorted[sorted.length - 2].persentaseSerapan;

  if (diff >= 15) return {
    message: `Bagus! Kinerjanya terus membaik — naik ${diff} poin selama 5 tahun terakhir.`,
    tone: "positive",
  };
  if (diff >= 5) return {
    message: `Kinerja perlahan membaik, naik ${diff} poin dari 5 tahun lalu. Perlu terus dipertahankan.`,
    tone: "positive",
  };
  if (diff > -5 && diff < 5) return {
    message: `Kinerja hampir tidak berubah dalam 5 tahun. Belum ada kemajuan yang berarti bagi warga.`,
    tone: "warning",
  };
  if (lastTwo < 0) return {
    message: `Waspada: kinerja makin memburuk setiap tahunnya. Turun ${Math.abs(diff)} poin dalam 5 tahun — ini tanda bahaya.`,
    tone: "danger",
  };
  return {
    message: `Kinerja menurun ${Math.abs(diff)} poin dalam 5 tahun. Warga perlu lebih aktif mengawasi desa ini.`,
    tone: "danger",
  };
}

// ─── Skor transparansi ────────────────────────────────────────────────────────

/**
 * Menerjemahkan skor transparansi teknis ke bahasa yang dimengerti warga.
 */
export function getTransparencyVerdict(skor: SkorTransparansi): Verdict {
  if (skor.total >= 80) return {
    message: "Desa ini cukup terbuka — informasi anggaran bisa diakses warga dengan mudah.",
    tone: "positive",
  };
  if (skor.total >= 60) return {
    message: "Ada informasi yang masih susah diakses. Warga perlu lebih aktif bertanya ke perangkat desa.",
    tone: "warning",
  };
  return {
    message: "Desa ini kurang terbuka ke warganya. Kamu berhak meminta informasi anggaran secara langsung.",
    tone: "danger",
  };
}

// ─── Alert dini ───────────────────────────────────────────────────────────────

/**
 * Menentukan apakah tren riwayat menunjukkan penurunan (untuk ikon peringatan).
 */
export function isDowntrending(riwayat: RiwayatTahunan[] | undefined): boolean {
  if (!riwayat || riwayat.length < 2) return false;
  const sorted = [...riwayat].sort((a, b) => a.tahun - b.tahun);
  return (
    sorted[sorted.length - 1].persentaseSerapan <
    sorted[sorted.length - 2].persentaseSerapan
  );
}
