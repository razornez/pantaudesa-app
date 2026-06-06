/**
 * expectations.ts — kalkulasi hak warga berdasarkan anggaran desa.
 *
 * Fungsi murni: tidak ada efek samping, tidak tahu UI.
 * Referensi: Permendesa No. 8/2022, PMK Dana Desa 2024, standar biaya umum.
 */

import { Desa } from "./types";
import { formatRupiah } from "./utils";

// ─── Types ───────────────────────────────────────────────────────────────────

/** wajib = diatur regulasi | direncanakan = ada di APBDes | tanyakan = hak warga untuk bertanya */
export type ExpectedStatus = "wajib" | "direncanakan" | "tanyakan";

export interface ExpectedItem {
  label:    string;
  detail:   string;
  status:   ExpectedStatus;
  nilai?:   string;   // nilai ringkas, misal "±45 KK" atau "Rp 687 Jt"
}

export interface DesaExpectation {
  items:          ExpectedItem[];
  ringkasan:      string;          // satu kalimat kesimpulan sesuai serapan
  ringkasanTone: "positive" | "warning" | "danger";
}

// ─── Konstanta referensi ─────────────────────────────────────────────────────

/** BLT: min 20% Dana Desa → @Permendesa 2023 */
const BLT_PERSEN_DANA_DESA   = 0.20;
/** Dana Desa ≈ 65% total anggaran desa rata-rata */
const DANA_DESA_RATIO         = 0.65;
/** Rp 300.000 × 12 bulan per KK per tahun */
const BLT_PER_KK_PERTAHUN     = 3_600_000;
/** 1 posyandu aktif per 500 jiwa (minimal 2 per desa) */
const WARGA_PER_POSYANDU      = 500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bltKK(desa: Desa): number {
  const danaDesa   = desa.pendapatan?.danaDesa ?? desa.totalAnggaran * DANA_DESA_RATIO;
  const bltBudget  = danaDesa * BLT_PERSEN_DANA_DESA;
  return Math.max(10, Math.round(bltBudget / BLT_PER_KK_PERTAHUN));
}

function posyanduCount(desa: Desa): [number, number] {
  const n = Math.max(2, Math.round(desa.penduduk / WARGA_PER_POSYANDU));
  return [n, n + 1];
}

function apbdesAmount(desa: Desa, kode: string): number {
  return desa.apbdes?.find(a => a.kode === kode)?.anggaran ?? 0;
}

function ringkasanByStatus(persen: number): { text: string; tone: DesaExpectation["ringkasanTone"] } {
  if (persen >= 85) return {
    text: "Indikator serapan demo tinggi. Warga bisa cek apakah hasilnya terasa di lapangan dengan melihat dokumen publik desa.",
    tone: "positive",
  };
  if (persen >= 60) return {
    text: `Masih ada ${100 - persen}% anggaran yang belum tercatat terpakai di data demo. Warga bisa bertanya rencana penggunaannya ke desa.`,
    tone: "warning",
  };
  return {
    text: `Indikator serapan demo masih rendah. Data ini perlu dicek dari sumber dokumen resmi sebelum membuat kesimpulan apapun.`,
    tone: "danger",
  };
}

// ─── Fungsi utama ─────────────────────────────────────────────────────────────

export function getExpectations(desa: Desa): DesaExpectation {
  const items: ExpectedItem[] = [];

  // ── WAJIB (berdasarkan regulasi) ─────────────────────────────────────────

  const kk = bltKK(desa);
  items.push({
    label:  "BLT (Bantuan Langsung Tunai)",
    detail: `Sekitar ${kk} keluarga miskin di desa ini seharusnya mendapat Rp 300.000 per bulan — ini diwajibkan regulasi, bukan kebijaksanaan kepala desa.`,
    status: "wajib",
    nilai:  `±${kk} KK`,
  });

  const [posMin, posMax] = posyanduCount(desa);
  items.push({
    label:  "Posyandu Aktif Setiap Bulan",
    detail: `Dengan ${desa.penduduk.toLocaleString("id-ID")} jiwa, idealnya ada ${posMin}–${posMax} posyandu aktif — melayani ibu hamil, balita, dan lansia tanpa biaya.`,
    status: "wajib",
    nilai:  `${posMin}–${posMax} unit`,
  });

  items.push({
    label:  "APBDes Bisa Diakses Publik",
    detail: "Berdasarkan UU Desa No. 6/2014, dokumen APBDes wajib bisa diakses oleh siapapun. Minta ke kantor desa — gratis, tidak boleh ditolak.",
    status: "wajib",
  });

  // ── DIRENCANAKAN (dari APBDes) ────────────────────────────────────────────

  const pembangunan = apbdesAmount(desa, "2");
  if (pembangunan > 0) {
    const desc = pembangunan > 600_000_000
      ? "Cukup untuk memperbaiki jalan desa, membangun drainase, dan minimal 1 fasilitas umum baru."
      : pembangunan > 300_000_000
      ? "Cukup untuk perbaikan jalan desa dan drainase di beberapa titik."
      : "Untuk perbaikan infrastruktur skala kecil — gorong-gorong, tambalan jalan, dll.";

    items.push({
      label:  "Pembangunan & Perbaikan Infrastruktur Fisik",
      detail: `${formatRupiah(pembangunan)} dialokasikan untuk bidang ini. ${desc}`,
      status: "direncanakan",
      nilai:  formatRupiah(pembangunan),
    });
  }

  const pembinaan = apbdesAmount(desa, "3");
  if (pembinaan > 50_000_000) {
    items.push({
      label:  "Kegiatan Sosial & Kemasyarakatan",
      detail: `${formatRupiah(pembinaan)} untuk kegiatan budaya, keagamaan, keamanan warga, dan pembinaan RT/RW.`,
      status: "direncanakan",
      nilai:  formatRupiah(pembinaan),
    });
  }

  const pemberdayaan = apbdesAmount(desa, "4");
  if (pemberdayaan > 80_000_000) {
    items.push({
      label:  "Pelatihan & Pemberdayaan Ekonomi Warga",
      detail: `${formatRupiah(pemberdayaan)} untuk pelatihan wirausaha, keahlian, pertanian, atau perikanan bagi warga desa.`,
      status: "direncanakan",
      nilai:  formatRupiah(pemberdayaan),
    });
  }

  // ── TANYAKAN KE DESA ─────────────────────────────────────────────────────

  items.push({
    label:  "Lapangan Olahraga atau Fasilitas Publik",
    detail: "Banyak desa menganggarkan ini di bidang pembangunan. Tanyakan ke kepala desa apakah ada dalam APBDes tahun ini.",
    status: "tanyakan",
  });

  items.push({
    label:  "WiFi / Internet Gratis di Balai Desa",
    detail: "Program internet desa dari Kominfo tersedia — cek apakah desamu sudah mendapat akses atau sedang dalam proses.",
    status: "tanyakan",
  });

  if (desa.penduduk > 2_500) {
    items.push({
      label:  "Kendaraan Operasional / Ambulans Desa",
      detail: "Desa dengan lebih dari 2.500 jiwa umumnya menganggarkan kendaraan untuk layanan darurat dan operasional desa.",
      status: "tanyakan",
    });
  }

  items.push({
    label:  "Penerangan Jalan Umum (PJU)",
    detail: "Lampu jalan desa seharusnya dianggarkan setiap tahun untuk keamanan warga di malam hari.",
    status: "tanyakan",
  });

  const { text, tone } = ringkasanByStatus(desa.persentaseSerapan);

  return { items, ringkasan: text, ringkasanTone: tone };
}
