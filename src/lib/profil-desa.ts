/**
 * profil-desa.ts — mock data ProfilDesa untuk 20 desa.
 */

import { ProfilDesa, AsetDesa, FasilitasDesa, BumdesInfo, HistoryBelanja, LembagaDesa } from "./types";
import { buildBadge } from "./badge";

const M = (v: number) => v * 1_000_000;
const B = (v: number) => v * 1_000_000_000;

// ─── Aset ─────────────────────────────────────────────────────────────────────

function mkAset(kategori: string, totalAnggaran: number): AsetDesa[] {
  const base: AsetDesa[] = [
    { nama: "Tanah Kas Desa",        jenis: "tanah",         nilai: M(2500), tahunBeli: 1995, kondisi: "baik",   lokasi: "Berbagai RT" },
    { nama: "Kantor Kepala Desa",    jenis: "bangunan",      nilai: M(800),  tahunBeli: 2019, kondisi: "baik",   lokasi: "Pusat Desa" },
    { nama: "Aula/Balai Desa",       jenis: "bangunan",      nilai: M(650),  tahunBeli: 2017, kondisi: "sedang", lokasi: "Pusat Desa" },
    { nama: "Kendaraan Operasional", jenis: "kendaraan",     nilai: M(120),  tahunBeli: 2021, kondisi: "baik",   lokasi: "Kantor Desa" },
    { nama: "Komputer & Printer",    jenis: "peralatan",     nilai: M(45),   tahunBeli: 2022, kondisi: "baik",   lokasi: "Kantor Desa" },
  ];
  const extras: Record<string, AsetDesa[]> = {
    "Infrastruktur": [
      { nama: "Jalan Aspal Desa",    jenis: "infrastruktur", nilai: M(totalAnggaran > B(1) ? 3200 : 1800), tahunBeli: 2022, kondisi: "baik",   lokasi: "Seluruh Desa" },
      { nama: "Drainase/Saluran Air",jenis: "infrastruktur", nilai: M(420),  tahunBeli: 2023, kondisi: "baik",   lokasi: "RT 01–05" },
    ],
    "Kesehatan":     [
      { nama: "Gedung Posyandu",     jenis: "bangunan",      nilai: M(380),  tahunBeli: 2020, kondisi: "baik",   lokasi: "Dusun Tengah" },
      { nama: "Ambulance Desa",      jenis: "kendaraan",     nilai: M(280),  tahunBeli: 2021, kondisi: "sedang", lokasi: "Puskesmas Desa" },
    ],
    "Pendidikan":    [
      { nama: "Gedung PAUD",         jenis: "bangunan",      nilai: M(450),  tahunBeli: 2019, kondisi: "baik",   lokasi: "RT 03" },
      { nama: "Perpustakaan Desa",   jenis: "bangunan",      nilai: M(220),  tahunBeli: 2021, kondisi: "baik",   lokasi: "Pusat Desa" },
    ],
    "Pertanian":     [
      { nama: "Embung/Waduk Desa",   jenis: "infrastruktur", nilai: M(1200), tahunBeli: 2020, kondisi: "baik",   lokasi: "Area Sawah" },
      { nama: "Traktor Desa",        jenis: "peralatan",     nilai: M(185),  tahunBeli: 2022, kondisi: "sedang", lokasi: "Bengkel Desa" },
    ],
    "Pariwisata":    [
      { nama: "Gerbang Wisata",      jenis: "infrastruktur", nilai: M(320),  tahunBeli: 2021, kondisi: "baik",   lokasi: "Pintu Masuk Desa" },
      { nama: "Area Parkir Wisata",  jenis: "infrastruktur", nilai: M(180),  tahunBeli: 2022, kondisi: "baik",   lokasi: "Destinasi Utama" },
    ],
    "Ekonomi":       [
      { nama: "Gedung BUMDes",       jenis: "bangunan",      nilai: M(550),  tahunBeli: 2020, kondisi: "baik",   lokasi: "Jalan Utama" },
      { nama: "Pasar Desa",          jenis: "bangunan",      nilai: M(780),  tahunBeli: 2018, kondisi: "sedang", lokasi: "Pusat Desa" },
    ],
    "Perikanan":     [
      { nama: "Kolam Ikan Komunal",  jenis: "infrastruktur", nilai: M(420),  tahunBeli: 2021, kondisi: "baik",   lokasi: "Dusun Pantai" },
      { nama: "Gudang Pendingin",    jenis: "bangunan",      nilai: M(350),  tahunBeli: 2022, kondisi: "baik",   lokasi: "TPI Desa" },
    ],
    "Perkebunan":    [
      { nama: "Gudang Panen",        jenis: "bangunan",      nilai: M(290),  tahunBeli: 2020, kondisi: "sedang", lokasi: "Area Kebun" },
      { nama: "Alat Pengolah Hasil", jenis: "peralatan",     nilai: M(160),  tahunBeli: 2021, kondisi: "baik",   lokasi: "Koperasi Desa" },
    ],
    "Pertambangan":  [
      { nama: "Alat Ukur & Safety",  jenis: "peralatan",     nilai: M(280),  tahunBeli: 2021, kondisi: "baik",   lokasi: "Base Camp" },
      { nama: "Pos Pengawas Tambang",jenis: "bangunan",      nilai: M(150),  tahunBeli: 2020, kondisi: "baik",   lokasi: "Area Tambang" },
    ],
  };
  return [...base, ...(extras[kategori] ?? [])];
}

// ─── Fasilitas ────────────────────────────────────────────────────────────────

function mkFasilitas(kategori: string, penduduk: number): FasilitasDesa[] {
  const posyanduCount = Math.max(1, Math.floor(penduduk / 500));
  const sdCount = Math.max(1, Math.floor(penduduk / 1000));
  const base: FasilitasDesa[] = [
    { nama: "Posyandu",           jenis: "kesehatan",  jumlah: posyanduCount, kondisi: "baik",   ket: `Aktif ${posyanduCount}x/bulan` },
    { nama: "Masjid/Mushola",     jenis: "ibadah",     jumlah: Math.max(2, Math.floor(penduduk / 400)), kondisi: "baik" },
    { nama: "SD/MI",              jenis: "pendidikan", jumlah: sdCount, kondisi: "baik" },
    { nama: "Lapangan Olahraga",  jenis: "olahraga",   jumlah: 1, kondisi: "sedang" },
    { nama: "Kantor Desa",        jenis: "umum",       jumlah: 1, kondisi: "baik" },
  ];
  const extras: Record<string, FasilitasDesa[]> = {
    "Kesehatan":    [{ nama: "Puskesmas Pembantu", jenis: "kesehatan",  jumlah: 1, kondisi: "baik",   ket: "Buka Senin–Sabtu" }],
    "Pendidikan":   [{ nama: "PAUD/TK",            jenis: "pendidikan", jumlah: 2, kondisi: "baik",   ket: "Gratis untuk warga" }],
    "Ekonomi":      [{ nama: "Pasar Mingguan",      jenis: "ekonomi",   jumlah: 1, kondisi: "sedang", ket: "Setiap hari Minggu" }],
    "Pariwisata":   [{ nama: "Rest Area Wisata",    jenis: "umum",      jumlah: 1, kondisi: "baik" }],
    "Perikanan":    [{ nama: "TPI (Tempat Pelelangan Ikan)", jenis: "ekonomi", jumlah: 1, kondisi: "baik" }],
    "Pertambangan": [{ nama: "Klinik K3 Tambang",  jenis: "kesehatan", jumlah: 1, kondisi: "baik",   ket: "24 jam" }],
  };
  return [...base, ...(extras[kategori] ?? [])];
}

// ─── Lembaga Desa ─────────────────────────────────────────────────────────────
// Berdasarkan Permendagri 18/2018 tentang Lembaga Kemasyarakatan Desa

function mkLembaga(penduduk: number, serapan: number): LembagaDesa[] {
  const aktif = serapan >= 65;
  return [
    {
      nama: "BPD (Badan Permusyawaratan Desa)",
      jenis: "pemerintahan",
      ketua: "Ketua BPD",
      anggota: Math.max(5, Math.round(penduduk / 700) * 1 + 4),
      tahunBerdiri: 2019,
      aktif: true,
      deskripsi: "Lembaga pengawas & perwakilan warga dalam pemerintahan desa. BPD berhak meminta pertanggungjawaban kepala desa.",
      program: "Sidang musrenbangdes tahunan, pengawasan APBDes",
    },
    {
      nama: "LPMD (Lembaga Pemberdayaan Masyarakat Desa)",
      jenis: "pemerintahan",
      ketua: "Ketua LPMD",
      anggota: 9,
      tahunBerdiri: 2018,
      aktif: aktif,
      deskripsi: "Merencanakan dan mengawasi pembangunan desa bersama pemerintah desa. Menyusun Rencana Kerja Pembangunan Desa (RKP).",
      program: "Penyusunan RKPDes, monitoring pembangunan",
    },
    {
      nama: "PKK (Pemberdayaan Kesejahteraan Keluarga)",
      jenis: "pemberdayaan",
      ketua: "Ketua PKK",
      anggota: Math.max(15, Math.round(penduduk / 80)),
      tahunBerdiri: 2015,
      aktif: true,
      deskripsi: "Memberdayakan keluarga untuk meningkatkan kesejahteraan. Mengelola 10 Program PKK termasuk posyandu, PAUD, dan ketahanan pangan.",
      program: "Posyandu balita & lansia, demo masak sehat, Dasawisma",
    },
    {
      nama: "Karang Taruna",
      jenis: "pemberdayaan",
      ketua: "Ketua Karang Taruna",
      anggota: Math.max(20, Math.round(penduduk / 60)),
      tahunBerdiri: 2016,
      aktif: aktif,
      deskripsi: "Organisasi kepemudaan yang menangani masalah sosial generasi muda dan mengembangkan potensi anak-anak serta remaja desa.",
      program: "Olahraga mingguan, kegiatan 17 Agustus, pelatihan wirausaha muda",
    },
    {
      nama: "Linmas (Perlindungan Masyarakat)",
      jenis: "keamanan",
      ketua: "Komandan Linmas",
      anggota: Math.max(10, Math.round(penduduk / 200)),
      tahunBerdiri: 2017,
      aktif: true,
      deskripsi: "Menjaga keamanan, ketertiban, dan ketentraman masyarakat desa. Membantu penanganan bencana dan keadaan darurat.",
      program: "Ronda malam, pengamanan acara desa, siaga bencana",
    },
    {
      nama: "MUI Desa / FKUB",
      jenis: "keagamaan",
      ketua: "Ketua MUI",
      anggota: 7,
      tahunBerdiri: 2018,
      aktif: true,
      deskripsi: "Menjaga kerukunan antar umat beragama dan memberikan fatwa/panduan keagamaan bagi masyarakat desa.",
      program: "Pengajian rutin, perayaan hari besar keagamaan",
    },
    {
      nama: "Posyandu (Pos Pelayanan Terpadu)",
      jenis: "kesehatan",
      ketua: "Bidan Desa / Kader Posyandu",
      anggota: Math.max(5, Math.round(penduduk / 500) * 5),
      tahunBerdiri: 2010,
      aktif: true,
      deskripsi: "Pelayanan kesehatan dasar untuk ibu hamil, bayi, dan balita. Memantau tumbuh kembang anak, imunisasi, dan gizi.",
      program: "Timbang balita bulanan, imunisasi, konseling gizi ibu hamil",
    },
    {
      nama: "Kelompok Tani / Nelayan",
      jenis: "ekonomi",
      ketua: "Ketua Kelompok Tani",
      anggota: Math.max(15, Math.round(penduduk / 100)),
      tahunBerdiri: 2014,
      aktif: aktif,
      deskripsi: "Wadah petani/nelayan untuk mendapatkan akses pupuk bersubsidi, penyuluhan pertanian, dan pemasaran hasil panen bersama.",
      program: "Pertemuan bulanan, pengajuan subsidi pupuk, demo pertanian",
    },
  ];
}

// ─── BUMDes ───────────────────────────────────────────────────────────────────

const BUMDES_TEMPLATES: Record<string, Omit<BumdesInfo, "modal" | "omsetPerTahun">> = {
  "Infrastruktur": { nama: "BUMDes Maju Mandiri",   bidangUsaha: "Material Bangunan & Jasa Konstruksi",   tahunBerdiri: 2019, status: "aktif", deskripsi: "Menyediakan material bangunan untuk warga dan pengerjaan proyek desa." },
  "Kesehatan":     { nama: "BUMDes Sehat Sejahtera", bidangUsaha: "Apotek & Simpan Pinjam",               tahunBerdiri: 2020, status: "aktif", deskripsi: "Apotek desa dengan harga terjangkau dan koperasi simpan pinjam warga." },
  "Pendidikan":    { nama: "BUMDes Cerdas Mandiri",  bidangUsaha: "Toko ATK & Kantin Sekolah",            tahunBerdiri: 2021, status: "aktif", deskripsi: "Melayani kebutuhan alat tulis warga dan kantin sekolah desa." },
  "Pertanian":     { nama: "BUMDes Tani Makmur",     bidangUsaha: "Penggilingan Padi & Kios Pupuk",       tahunBerdiri: 2018, status: "aktif", deskripsi: "Penggilingan padi dan distribusi pupuk bersubsidi untuk petani desa." },
  "Pariwisata":    { nama: "BUMDes Wisata Desa",     bidangUsaha: "Pengelolaan Wisata & Homestay",        tahunBerdiri: 2020, status: "aktif", deskripsi: "Mengelola destinasi wisata desa dan menyediakan akomodasi homestay." },
  "Ekonomi":       { nama: "BUMDes Karya Mandiri",   bidangUsaha: "Pasar Digital & Simpan Pinjam",        tahunBerdiri: 2019, status: "aktif", deskripsi: "Platform pemasaran produk UMKM desa secara online dan koperasi modal usaha." },
  "Perikanan":     { nama: "BUMDes Bahari",          bidangUsaha: "Pengolahan Hasil Laut & Cold Storage", tahunBerdiri: 2020, status: "aktif", deskripsi: "Pengolahan ikan dan penyimpanan dingin untuk nelayan desa." },
  "Perkebunan":    { nama: "BUMDes Kebun Sejahtera", bidangUsaha: "Pengolahan & Pemasaran Hasil Kebun",   tahunBerdiri: 2019, status: "aktif", deskripsi: "Mengolah dan memasarkan produk unggulan perkebunan langsung ke konsumen." },
  "Pertambangan":  { nama: "BUMDes Bumi Mandiri",    bidangUsaha: "Jasa Logistik & Kios BBM Desa",       tahunBerdiri: 2021, status: "aktif", deskripsi: "Melayani kebutuhan logistik operasional tambang dan menjual BBM untuk warga." },
};

// ─── History Belanja ──────────────────────────────────────────────────────────

function mkHistoryBelanja(totalAnggaran: number, serapan: number): HistoryBelanja[] {
  const items = [
    { kode: "1.1", uraian: "Penghasilan Tetap Kepala Desa & Perangkat",  pct: 0.12, penyedia: "Langsung" },
    { kode: "1.2", uraian: "Operasional Kantor Desa",                    pct: 0.05, penyedia: "Toko Sumber Jaya" },
    { kode: "2.1", uraian: "Pembangunan/Perbaikan Jalan Desa",           pct: 0.28, penyedia: "CV Bangun Nusantara" },
    { kode: "2.2", uraian: "Pembangunan Drainase & Sanitasi",            pct: 0.14, penyedia: "CV Karya Mandiri" },
    { kode: "3.1", uraian: "BLT Dana Desa — Keluarga Penerima Manfaat",  pct: 0.20, penyedia: "Langsung ke KPM" },
    { kode: "3.2", uraian: "Pemberdayaan PKK & Posyandu",                pct: 0.06, penyedia: "Langsung" },
    { kode: "4.1", uraian: "Pelatihan & Pemberdayaan Usaha Masyarakat",  pct: 0.08, penyedia: "BLK Kabupaten" },
    { kode: "5.1", uraian: "Dana Siaga Bencana",                         pct: 0.07, penyedia: "Kas Desa" },
  ];
  return items.map((it, i) => {
    const anggaran = Math.round(totalAnggaran * it.pct);
    const s1pct    = Math.min(serapan, 55);
    const s2pct    = serapan - s1pct;
    return {
      tahun:    2024,
      semester: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      kode:     it.kode,
      uraian:   it.uraian,
      anggaran,
      realisasi: Math.round(anggaran * (i % 2 === 0 ? s1pct : s2pct) / 100),
      penyedia:  it.penyedia,
    };
  });
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const MATA_PENCAHARIAN: Record<string, string> = {
  "Infrastruktur": "Petani & Pedagang",  "Kesehatan": "Petani & Buruh",
  "Pendidikan":    "PNS & Pedagang",     "Pertanian": "Petani",
  "Pariwisata":    "Pelaku Wisata & UMKM","Ekonomi":  "Pedagang & UMKM",
  "Perikanan":     "Nelayan & Petani",   "Perkebunan":"Petani Kebun",
  "Pertambangan":  "Penambang & Petani",
};

const POTENSI: Record<string, string> = {
  "Infrastruktur": "Konektivitas jalan & aksesibilitas wilayah",
  "Kesehatan":     "Layanan kesehatan berbasis komunitas",
  "Pendidikan":    "SDM terdidik & literasi tinggi",
  "Pertanian":     "Padi, sayuran, dan tanaman pangan",
  "Pariwisata":    "Destinasi alam & budaya lokal",
  "Ekonomi":       "UMKM, kuliner, dan kerajinan lokal",
  "Perikanan":     "Ikan laut & produk olahan laut",
  "Perkebunan":    "Sawit, karet, kopi, atau kakao",
  "Pertambangan":  "Mineral & energi lokal",
};

// ─── Generator utama ─────────────────────────────────────────────────────────

interface BaseInfo {
  kategori:      string;
  penduduk:      number;
  totalAnggaran: number;
  serapan:       number;
  skorTotal:     number;
  updateDaysAgo: number;
  website?:      string;
}

export function mkProfilDesa(info: BaseInfo): ProfilDesa {
  const { kategori, penduduk, totalAnggaran, serapan, skorTotal, updateDaysAgo, website } = info;
  const kk    = Math.round(penduduk / 3.8);
  const modal = Math.round(totalAnggaran * 0.05);
  const bumdesTemplate = BUMDES_TEMPLATES[kategori] ?? BUMDES_TEMPLATES["Infrastruktur"];

  return {
    website,
    luasWilayah:     Math.round(penduduk / 350 * 10) / 10,
    luasSawah:       kategori === "Pertanian" ? Math.round(penduduk / 8) : undefined,
    luasHutan:       ["Perkebunan","Pertambangan"].includes(kategori) ? Math.round(penduduk / 15) : undefined,
    jumlahDusun:     Math.max(2, Math.round(penduduk / 700)),
    jumlahRt:        Math.max(4, Math.round(penduduk / 150)),
    jumlahRw:        Math.max(2, Math.round(penduduk / 400)),
    jumlahKk:        kk,
    mataPencaharian: MATA_PENCAHARIAN[kategori] ?? "Beragam",
    potensiUnggulan: POTENSI[kategori] ?? "Beragam",
    terakhirDiperbarui: new Date(Date.now() - updateDaysAgo * 86_400_000),
    aset:            mkAset(kategori, totalAnggaran),
    fasilitas:       mkFasilitas(kategori, penduduk),
    lembaga:         mkLembaga(penduduk, serapan),
    bumdes:          { ...bumdesTemplate, modal, omsetPerTahun: serapan >= 80 ? Math.round(modal * 1.4) : Math.round(modal * 0.7) },
    historyBelanja:  mkHistoryBelanja(totalAnggaran, serapan),
    badge:           buildBadge(serapan, skorTotal),
  };
}

// ─── Per-desa constants ───────────────────────────────────────────────────────

export const DESA_UPDATE_DAYS = [
  3, 14, 60, 2, 7, 21, 1, 30, 120, 5, 45, 4, 90, 3, 18, 2, 60, 10, 180, 8,
];

export const DESA_WEBSITES = [
  "https://sukamaju.desa.id", undefined, undefined,
  "https://sumberrejeki.desa.id", "https://mekarsari-sleman.desa.id", undefined,
  "https://barumakmur.desa.id", undefined, undefined,
  "https://tirtamulya.desa.id", undefined, "https://talanghijau.desa.id",
  undefined, "https://inginjaya.desa.id", undefined,
  "https://bontomarannu.desa.id", undefined, undefined, undefined,
  "https://batulicin.desa.id",
];
