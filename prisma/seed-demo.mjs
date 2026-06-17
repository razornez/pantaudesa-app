import prismaPkg from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { PrismaClient } = prismaPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadLocalEnv();

const prisma = new PrismaClient();

const desaRecords = [
  ["ancolmekar", "Ancolmekar", "https://ancolmekar.desa.id/"],
  ["arjasari", "Arjasari", "https://arjasari.desa.id/"],
  ["baros", "Baros", "https://baros.desa.id/"],
  ["batukarut", "Batukarut", "https://batukarut.desa.id/"],
  ["lebakwangi", "Lebakwangi", "https://lebakwangi.desa.id/"],
  ["mangunjaya", "Mangunjaya", "https://mangunjaya.desa.id/"],
  ["mekarjaya", "Mekarjaya", null],
  ["patrolsari", "Patrolsari", "https://patrolsari.desa.id/"],
  ["pinggirsari", "Pinggirsari", "https://pinggirsari.desa.id/"],
  ["rancakole", "Rancakole", "https://rancakole.desa.id/"],
  ["wargaluyu", "Wargaluyu", "https://wargaluyu.desa.id/"],
].map(([slug, nama, websiteUrl]) => ({
  id: `demo-desa-${slug}`,
  slug,
  nama,
  websiteUrl,
}));

const dataSources = [
  {
    id: "source-kecamatan-arjasari-desa-list",
    scopeType: "kecamatan",
    scopeName: "Arjasari",
    sourceName: "Kecamatan Arjasari - profil letak geografis dan daftar desa",
    sourceUrl: "https://kecamatanarjasari.bandungkab.go.id/profil/letak-geografis",
    sourceType: "kecamatan_page",
    accessStatus: "accessible",
    dataAvailability: "mixed",
    dataStatus: "imported",
  },
  {
    id: "source-kecamatan-arjasari-struktur-pemerintahan",
    scopeType: "kecamatan",
    scopeName: "Arjasari",
    sourceName: "Kecamatan Arjasari - struktur pemerintahan",
    sourceUrl: "https://kecamatanarjasari.bandungkab.go.id/profil/struktur-pemerintahan",
    sourceType: "kecamatan_page",
    accessStatus: "accessible",
    dataAvailability: "profile_only",
    dataStatus: "imported",
  },
  ...desaRecords
    .filter((desa) => desa.websiteUrl)
    .map((desa) => ({
      id: `source-desa-${desa.slug}-official-website`,
      desaId: desa.id,
      scopeType: "desa",
      scopeName: desa.nama,
      sourceName: `Website resmi Desa ${desa.nama}`,
      sourceUrl: desa.websiteUrl,
      sourceType: "official_website",
      accessStatus: "accessible",
      dataAvailability: "mixed",
      dataStatus: "imported",
    })),
  {
    id: "source-desa-mekarjaya-kecamatan-detail",
    desaId: "demo-desa-mekarjaya",
    scopeType: "desa",
    scopeName: "Mekarjaya",
    sourceName: "Kecamatan Arjasari - detail Desa Mekarjaya",
    sourceUrl: "https://kecamatanarjasari.bandungkab.go.id/desa/desa-mekarjaya",
    sourceType: "kecamatan_page",
    accessStatus: "requires_review",
    dataAvailability: "profile_only",
    dataStatus: "needs_review",
    notes: "Direct desa website remained unconfirmed in manual discovery.",
  },
  {
    id: "source-desa-wargaluyu-kecamatan-typo-review",
    desaId: "demo-desa-wargaluyu",
    scopeType: "desa",
    scopeName: "Wargaluyu",
    sourceName: "Kecamatan Arjasari - Wargaluyu website field needs review",
    sourceUrl: "http://ww.wargaluyu.desa.id",
    sourceType: "kecamatan_page",
    accessStatus: "requires_review",
    dataAvailability: "unknown",
    dataStatus: "needs_review",
    notes: "Kecamatan website field appears typo-like or stale; working domain is tracked separately.",
  },
];

const documents = [
  {
    id: "doc-ancolmekar-realisasi-2019",
    desaId: "demo-desa-ancolmekar",
    sourceId: "source-desa-ancolmekar-official-website",
    tahun: 2019,
    namaDokumen: "Laporan Realisasi Pelaksanaan Anggaran Pendapatan 2019",
    jenisDokumen: "realisasi",
    url: "https://ancolmekar.desa.id/artikel/2020/1/6/laporan-realisasi-pelaksanaan-anggaran-pendapatan-2019",
    dataStatus: "needs_review",
  },
  {
    id: "doc-lebakwangi-apbdes-2022",
    desaId: "demo-desa-lebakwangi",
    sourceId: "source-desa-lebakwangi-official-website",
    tahun: 2022,
    namaDokumen: "APBDes 2022",
    jenisDokumen: "apbdes",
    url: "https://lebakwangi.desa.id/index.php/artikel/2022/1/3/apbdes-2022",
    dataStatus: "imported",
  },
  {
    id: "doc-lebakwangi-realisasi-semester-1-2023",
    desaId: "demo-desa-lebakwangi",
    sourceId: "source-desa-lebakwangi-official-website",
    tahun: 2023,
    namaDokumen: "Laporan Realisasi APBDES 2023 Semester I",
    jenisDokumen: "realisasi",
    dataStatus: "needs_review",
  },
  {
    id: "doc-lebakwangi-realisasi-2020",
    desaId: "demo-desa-lebakwangi",
    sourceId: "source-desa-lebakwangi-official-website",
    tahun: 2020,
    namaDokumen: "Laporan Realisasi APBDes 2020",
    jenisDokumen: "realisasi",
    dataStatus: "needs_review",
  },
  {
    id: "doc-mangunjaya-apbdes-2021",
    desaId: "demo-desa-mangunjaya",
    sourceId: "source-desa-mangunjaya-official-website",
    tahun: 2021,
    namaDokumen: "APBDes 2021 summary",
    jenisDokumen: "apbdes",
    dataStatus: "needs_review",
  },
  {
    id: "doc-mangunjaya-realisasi-2025",
    desaId: "demo-desa-mangunjaya",
    sourceId: "source-desa-mangunjaya-official-website",
    tahun: 2025,
    namaDokumen: "Realisasi Pertanggungjawaban APBDes Tahun 2025",
    jenisDokumen: "realisasi",
    dataStatus: "needs_review",
  },
  {
    id: "doc-patrolsari-apbdes-2026",
    desaId: "demo-desa-patrolsari",
    sourceId: "source-desa-patrolsari-official-website",
    tahun: 2026,
    namaDokumen: "APBDes 2026",
    jenisDokumen: "apbdes",
    dataStatus: "needs_review",
  },
  {
    id: "doc-patrolsari-realisasi-2025",
    desaId: "demo-desa-patrolsari",
    sourceId: "source-desa-patrolsari-official-website",
    tahun: 2025,
    namaDokumen: "Laporan Realisasi APBDes 2025",
    jenisDokumen: "realisasi",
    dataStatus: "needs_review",
  },
  {
    id: "doc-patrolsari-realisasi-2024",
    desaId: "demo-desa-patrolsari",
    sourceId: "source-desa-patrolsari-official-website",
    tahun: 2024,
    namaDokumen: "Realisasi APBDes 2024",
    jenisDokumen: "realisasi",
    url: "https://patrolsari.desa.id/artikel/2025/4/11/realisasi-apbdes-tahun-anggaran-2024",
    dataStatus: "needs_review",
  },
  {
    id: "doc-pinggirsari-realisasi-2025",
    desaId: "demo-desa-pinggirsari",
    sourceId: "source-desa-pinggirsari-official-website",
    tahun: 2025,
    namaDokumen: "Laporan Pertanggungjawaban Realisasi Anggaran Pendapatan dan Belanja Desa Tahun Anggaran 2025",
    jenisDokumen: "realisasi",
    dataStatus: "needs_review",
  },
  {
    id: "doc-rancakole-apbdes-2021",
    desaId: "demo-desa-rancakole",
    sourceId: "source-desa-rancakole-official-website",
    tahun: 2021,
    namaDokumen: "Infografik APBDes 2021",
    jenisDokumen: "apbdes",
    dataStatus: "needs_review",
  },
  {
    id: "doc-rancakole-realisasi-2019",
    desaId: "demo-desa-rancakole",
    sourceId: "source-desa-rancakole-official-website",
    tahun: 2019,
    namaDokumen: "Realisasi APBDesa 2019",
    jenisDokumen: "realisasi",
    dataStatus: "needs_review",
  },
  {
    id: "doc-rancakole-apbdes-2019",
    desaId: "demo-desa-rancakole",
    sourceId: "source-desa-rancakole-official-website",
    tahun: 2019,
    namaDokumen: "APBDes 2019 archive item",
    jenisDokumen: "apbdes",
    dataStatus: "needs_review",
  },
  {
    id: "doc-rancakole-apbdes-2018",
    desaId: "demo-desa-rancakole",
    sourceId: "source-desa-rancakole-official-website",
    tahun: 2018,
    namaDokumen: "APBDes 2018 archive item",
    jenisDokumen: "apbdes",
    dataStatus: "needs_review",
  },
  {
    id: "doc-wargaluyu-apbdes-2025",
    desaId: "demo-desa-wargaluyu",
    sourceId: "source-desa-wargaluyu-official-website",
    tahun: 2025,
    namaDokumen: "APBDes 2025",
    jenisDokumen: "apbdes",
    dataStatus: "needs_review",
  },
  {
    id: "doc-wargaluyu-apbdes-2021",
    desaId: "demo-desa-wargaluyu",
    sourceId: "source-desa-wargaluyu-official-website",
    tahun: 2021,
    namaDokumen: "APBDes 2021 / realisasi-style content",
    jenisDokumen: "apbdes",
    url: "https://wargaluyu.desa.id/artikel/2021/5/29/apbdes-2021",
    dataStatus: "needs_review",
  },
];

const perangkatNames = [
  "H. Asep Supriatna, S.H.",
  "Hj. Nani Rohaeni",
  "Yudi Hermawan, A.Md.",
  "Sandi Permana",
  "Dadang Sutisna, A.Md.",
  "Tuti Sundari",
  "Ridwan Fauzi",
  "Yeni Andriyani",
  "Ode Mandra",
  "Rini Wulandari",
  "Tono Setiawan",
  "Rika Novitasari",
  "Sutikno, B.A.",
  "Sunarti",
  "Sigit Raharjo",
  "Tutik Handayani",
  "Slamet Riyadi",
  "Wahyuni",
  "Haryanto",
  "Sari Dewi",
  "Teguh Santoso",
  "Umi Kulsum",
  "Budi Prasetyo",
  "Wulan Sari",
  "H. Zainal Arifin, S.E.",
  "Endang Suryati",
  "Eko Wahyudi",
  "Fitri Handayani",
  "Sugeng Hariyanto",
  "Mujiati",
  "Agus Widodo",
  "Lina Marlina",
  "Suparmin",
  "Nur Cahyati",
  "Wahyu Pratama",
  "Desi Ratnasari",
  "Yohanes Andi, S.P.",
  "Maria Goretti",
  "Petrus Kalimantan",
  "Anastasia Dewi",
  "Markus Dius",
  "Kristina Lampe",
  "Yosef Kura",
  "Theresia Nyai",
  "H. Ahmad Fauzi, S.Ag.",
  "Hj. Maimunah",
  "Syaiful Bahri",
  "Nurhayati",
  "Rohmat Efendi",
  "Sumiati",
  "Dani Kurniawan",
  "Ayu Lestari",
  "Tgk. Mukhlis Ibrahim",
  "Cut Nilawati",
  "Zulkifli Yusuf",
  "Mariani Putri",
  "Hotma Nainggolan",
  "Ria Simatupang",
  "Togi Nababan",
  "Lena Sitorus",
  "H. Muh. Arief, S.Sos.",
  "Hj. Hasnah Dg. Nai",
  "Syarifuddin Kadir",
  "Rahma Dewi",
  "H. Lalu Mukhtar",
  "Baiq Ernawati",
  "Amaq Wirawan",
  "Inaq Sumiati",
  "Ridwan Lamadjido",
  "Nurhafidah",
  "Moh. Rifai",
  "Rosmiati",
  "Elius Wenda",
  "Ones Kogoya",
  "Tinus Pagawak",
  "Yuliana Wetipo",
  "H. Rusli Effendi, S.H.",
  "Hj. Rusnita",
  "Taufik Rahman",
  "Sri Wahyuni",
];

const perangkatRoles = [
  { jabatan: "Kepala Desa", periode: "2021-2027", kontakLabel: "Kanal resmi desa" },
  { jabatan: "Sekretaris Desa", periode: null, kontakLabel: "Kanal resmi desa" },
  { jabatan: "Bendahara Desa", periode: null, kontakLabel: null },
  { jabatan: "Kaur Perencanaan", periode: null, kontakLabel: null },
];

// Removed: 20 fictional cross-Indonesia demo villages (ids "1"–"20") that
// masqueraded as real desa and polluted public listings. The demo dataset now
// rides on the 11 REAL Arjasari desa (desaRecords) instead. Voice + admin-claim
// demos below reference those real desa ids.
const demoVillageRecords = [];

const apbdesFields = [
  ["1", "Penyelenggaraan Pemerintahan Desa", 0.18, 1.03],
  ["2", "Pelaksanaan Pembangunan Desa", 0.44, 0.97],
  ["3", "Pembinaan Kemasyarakatan Desa", 0.14, 1.02],
  ["4", "Pemberdayaan Masyarakat Desa", 0.18, 0.98],
  ["5", "Penanggulangan Bencana dan Darurat", 0.06, 0.55],
];

const voiceExamples = [
  { id: "v1", desaId: "demo-desa-batukarut", category: "infrastruktur", text: "Jalan di RT 04 baru selesai diperbaiki bulan lalu, hasilnya bagus dan mulus. Terima kasih desanya sudah gerak cepat.", author: "Pak Hendra", days: 3, helpful: 12, benar: 18, bohong: 0, status: "RESOLVED" },
  { id: "v4", desaId: "demo-desa-batukarut", category: "infrastruktur", text: "Lampu jalan di gang belakang balai desa masih mati sudah 3 minggu. Mohon segera diperbaiki, warga takut jalan malam.", author: "Pak Darto", days: 2, helpful: 21, benar: 28, bohong: 1, status: "RESOLVED" },
  { id: "v2", desaId: "demo-desa-batukarut", category: "fasilitas", text: "Posyandu di RT 02 aktif tiap bulan, petugas ramah dan tidak pernah minta bayaran. Mantap.", author: "Bu Ratna", days: 8, helpful: 7, benar: 15, bohong: 0, status: "OPEN" },
  { id: "v3", desaId: "demo-desa-batukarut", category: "bansos", text: "BLT sudah cair ke keluarga saya, prosesnya lancar dan transparan. Semoga terus begini.", author: "Anonim", isAnon: true, days: 15, helpful: 5, benar: 9, bohong: 0, status: "OPEN" },
  { id: "v5", desaId: "demo-desa-ancolmekar", category: "anggaran", text: "Sudah minta lihat APBDes ke pak kades, katanya nanti-nanti terus. Padahal ini hak warga kan? Sudah 2 minggu bolak-balik.", author: "Ibu Sumarni", days: 5, helpful: 34, benar: 41, bohong: 2, status: "OPEN" },
  { id: "v6", desaId: "demo-desa-ancolmekar", category: "infrastruktur", text: "Saluran drainase RT 01 sudah mampet 2 bulan. Waktu hujan banjir kecil-kecilan masuk halaman. Sudah lapor ke RT tapi tidak ada tindakan.", author: "Anonim", isAnon: true, days: 12, helpful: 18, benar: 23, bohong: 0, status: "IN_PROGRESS" },
  { id: "v7", desaId: "demo-desa-ancolmekar", category: "fasilitas", text: "PAUD di desa ini bagus, gurunya rajin dan gedungnya baru direnovasi. Anak saya senang sekolah di sini.", author: "Bu Wulandari", days: 20, helpful: 9, benar: 11, bohong: 0, status: "OPEN" },
  { id: "v8", desaId: "demo-desa-baros", category: "bansos", text: "BLT sudah 3 bulan tidak cair. Sudah lapor ke RT tapi katanya lagi diproses. Keluarga saya butuh sekarang.", author: "Pak Sugeng", days: 1, helpful: 67, benar: 78, bohong: 2, status: "OPEN" },
  { id: "v9", desaId: "demo-desa-baros", category: "infrastruktur", text: "Jalan utama berlubang parah. Motor saya sudah dua kali rusak karena jalan ini. Warga perlu penjelasan rencana perbaikannya.", author: "Anonim", isAnon: true, days: 4, helpful: 89, benar: 112, bohong: 3, status: "OPEN" },
  { id: "v10", desaId: "demo-desa-baros", category: "anggaran", text: "Serapan hanya 48% tapi saya tidak melihat ada pembangunan berarti. Saya ingin tahu dokumen APBDes dan rencana kegiatannya.", author: "Pak Muryanto", days: 7, helpful: 102, benar: 98, bohong: 1, status: "OPEN" },
  { id: "v11", desaId: "demo-desa-baros", category: "fasilitas", text: "Posyandu buka tidak teratur, kadang buka kadang tidak ada kabar. Ibu-ibu bingung kapan harus datang.", author: "Bu Endang", days: 10, helpful: 45, benar: 52, bohong: 0, status: "OPEN" },
  { id: "v12", desaId: "demo-desa-wargaluyu", category: "infrastruktur", text: "Pengerjaan jalan desa sangat rapi dan kualitasnya bagus. Warga ikut mengawasi langsung saat pengerjaan.", author: "Pak Zainal", days: 6, helpful: 15, benar: 18, bohong: 0, status: "OPEN" },
  { id: "v13", desaId: "demo-desa-wargaluyu", category: "bansos", text: "Pembagian BLT tertib dan transparan. Ada daftar nama yang ditempel di balai desa, siapapun bisa cek.", author: "Bu Mahmudah", days: 14, helpful: 28, benar: 31, bohong: 0, status: "OPEN" },
  { id: "v14", desaId: "demo-desa-mangunjaya", category: "anggaran", text: "Dana desa katanya lebih dari Rp 1 miliar, tapi warga belum melihat penjelasan kegiatan. Saya ingin tahu dokumennya.", author: "Anonim", isAnon: true, days: 2, helpful: 156, benar: 134, bohong: 5, status: "OPEN" },
  { id: "v15", desaId: "demo-desa-mangunjaya", category: "infrastruktur", text: "Jalan ke sawah sudah rusak bertahun-tahun. Petani rugi karena sulit angkut hasil panen. Mohon dicek prioritasnya.", author: "Pak Sarpan", days: 9, helpful: 78, benar: 89, bohong: 0, status: "OPEN" },
  { id: "v16", desaId: "demo-desa-mangunjaya", category: "bansos", text: "Tetangga saya mampu tapi dapat BLT. Saya yang susah belum dapat. Tolong dicek datanya secara terbuka.", author: "Anonim", isAnon: true, days: 3, helpful: 134, benar: 98, bohong: 8, status: "IN_PROGRESS" },
];

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, "..", fileName);
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const equalIndex = line.indexOf("=");
      if (equalIndex === -1) continue;

      const key = line.slice(0, equalIndex).trim();
      if (process.env[key]) continue;

      let value = line.slice(equalIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

async function seedDesa() {
  for (const desa of desaRecords) {
    await prisma.desa.upsert({
      where: { id: desa.id },
      update: {
        nama: desa.nama,
        slug: desa.slug,
        kecamatan: "Arjasari",
        kabupaten: "Bandung",
        provinsi: "Jawa Barat",
        tahunData: 2026,
        websiteUrl: desa.websiteUrl,
        dataStatus: "demo",
      },
      create: {
        id: desa.id,
        nama: desa.nama,
        slug: desa.slug,
        kecamatan: "Arjasari",
        kabupaten: "Bandung",
        provinsi: "Jawa Barat",
        tahunData: 2026,
        websiteUrl: desa.websiteUrl,
        dataStatus: "demo",
      },
    });
  }

  for (const desa of demoVillageRecords) {
    await prisma.desa.upsert({
      where: { id: desa.id },
      update: {
        nama: desa.nama,
        slug: desa.id,
        kecamatan: desa.kecamatan,
        kabupaten: desa.kabupaten,
        provinsi: desa.provinsi,
        tahunData: 2024,
        jumlahPenduduk: desa.penduduk,
        kategori: desa.kategori,
        dataStatus: "demo",
      },
      create: {
        id: desa.id,
        nama: desa.nama,
        slug: desa.id,
        kecamatan: desa.kecamatan,
        kabupaten: desa.kabupaten,
        provinsi: desa.provinsi,
        tahunData: 2024,
        jumlahPenduduk: desa.penduduk,
        kategori: desa.kategori,
        dataStatus: "demo",
      },
    });
  }
}

async function seedDataSources() {
  for (const source of dataSources) {
    const { id, ...data } = source;
    await prisma.dataSource.upsert({
      where: { id },
      update: data,
      create: source,
    });
  }
}

async function seedDocuments() {
  for (const document of documents) {
    const { id, ...data } = document;
    await prisma.dokumenPublik.upsert({
      where: { id },
      update: {
        ...data,
        status: "needs_review",
      },
      create: {
        ...document,
        status: "needs_review",
      },
    });
  }
}

function perangkatSeedRows(desa, offset, sourceId) {
  return perangkatRoles.map((role, index) => {
    const name = perangkatNames[(offset + index) % perangkatNames.length];
    return {
      id: `perangkat-${desa.id}-${index + 1}`,
      desaId: desa.id,
      nama: name,
      jabatan: role.jabatan,
      periode: role.periode,
      fotoUrl: null,
      kontakLabel: role.kontakLabel,
      dataStatus: "demo",
      sourceId,
    };
  });
}

async function seedPerangkat() {
  const perangkatSources = [
    ...demoVillageRecords.map((desa) => ({
      desaId: desa.id,
      rows: perangkatSeedRows(desa, Number(desa.id) * 4, demoSourceId(desa.id)),
    })),
    ...desaRecords.map((desa, index) => ({
      desaId: desa.id,
      rows: perangkatSeedRows(desa, index * 4, desa.websiteUrl ? `source-desa-${desa.slug}-official-website` : null),
    })),
  ];

  for (const item of perangkatSources) {
    for (const row of item.rows) {
      const { id, ...data } = row;
      await prisma.perangkatDesa.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }
  }
}

function demoSourceId(desaId) {
  return `source-demo-village-${desaId}`;
}

async function seedDemoSourcesAndBudgets() {
  // arjasariSummaries removed: Arjasari desa now use REAL data from the
  // ingestion pipeline (DJPK danaDesa). Fake APBDes summaries were
  // misleading — Lebakwangi/Rancakole showed "kinerjanya baik" from
  // fabricated 86% serapan. Without a summary, desa correctly shows
  // "Belum ada data" for budget status.
  const summaryRecords = [
    ...demoVillageRecords,
    // arjasariSummaries removed — no fake APBDes for real Arjasari desa
  ];

  for (const desa of demoVillageRecords) {
    await prisma.dataSource.upsert({
      where: { id: demoSourceId(desa.id) },
      update: {
        desaId: desa.id,
        scopeType: "desa",
        scopeName: desa.nama,
        sourceName: `${desa.nama} demo dataset`,
        sourceType: "demo",
        accessStatus: "accessible",
        dataAvailability: "budget_summary",
        dataStatus: "demo",
        notes: "Demo/mock record seeded for DB-first displayed data verification.",
      },
      create: {
        id: demoSourceId(desa.id),
        desaId: desa.id,
        scopeType: "desa",
        scopeName: desa.nama,
        sourceName: `${desa.nama} demo dataset`,
        sourceType: "demo",
        accessStatus: "accessible",
        dataAvailability: "budget_summary",
        dataStatus: "demo",
        notes: "Demo/mock record seeded for DB-first displayed data verification.",
      },
    });
  }

  for (const desa of summaryRecords) {
    const sourceId = demoVillageRecords.some((record) => record.id === desa.id) ? demoSourceId(desa.id) : null;
    await prisma.anggaranDesaSummary.upsert({
      where: { desaId_tahun: { desaId: desa.id, tahun: 2024 } },
      update: {
        totalAnggaran: BigInt(desa.total),
        totalRealisasi: BigInt(desa.realisasi),
        persentaseRealisasi: desa.persen,
        statusSerapan: desa.status,
        sourceId,
        dataStatus: "demo",
      },
      create: {
        desaId: desa.id,
        tahun: 2024,
        totalAnggaran: BigInt(desa.total),
        totalRealisasi: BigInt(desa.realisasi),
        persentaseRealisasi: desa.persen,
        statusSerapan: desa.status,
        sourceId,
        dataStatus: "demo",
      },
    });

    for (const [kode, namaBidang, weight, variation] of apbdesFields) {
      const anggaran = Math.round(desa.total * weight);
      const persentase = Math.min(100, Math.max(0, Math.round(desa.persen * variation)));
      await prisma.aPBDesItem.upsert({
        where: { id: `apbdes-demo-${desa.id}-${kode}-2024` },
        update: {
          desaId: desa.id,
          tahun: 2024,
          kodeBidang: kode,
          namaBidang,
          anggaran: BigInt(anggaran),
          realisasi: BigInt(Math.round(anggaran * persentase / 100)),
          persentase,
          sourceId,
          dataStatus: "demo",
        },
        create: {
          id: `apbdes-demo-${desa.id}-${kode}-2024`,
          desaId: desa.id,
          tahun: 2024,
          kodeBidang: kode,
          namaBidang,
          anggaran: BigInt(anggaran),
          realisasi: BigInt(Math.round(anggaran * persentase / 100)),
          persentase,
          sourceId,
          dataStatus: "demo",
        },
      });
    }
  }

  for (const desa of demoVillageRecords) {
    const docRows = [
      ["apbdes", `APBDes ${desa.tahun ?? 2024}`, 2024, "tersedia"],
      ["rkpdes", "RKP Desa 2024", 2024, "tersedia"],
      ["realisasi", "Laporan Realisasi Semester I", 2024, desa.persen >= 50 ? "tersedia" : "needs_review"],
      ["realisasi", "Laporan Realisasi Semester II", 2024, desa.persen >= 80 ? "tersedia" : "needs_review"],
      ["lppd", "LPPD 2023", 2023, desa.persen >= 60 ? "tersedia" : "needs_review"],
    ];

    for (const [jenisDokumen, namaDokumen, tahun, status] of docRows) {
      await prisma.dokumenPublik.upsert({
        where: { id: `doc-demo-${desa.id}-${jenisDokumen}-${tahun}-${namaDokumen.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
        update: {
          desaId: desa.id,
          tahun,
          namaDokumen,
          jenisDokumen,
          status,
          sourceId: demoSourceId(desa.id),
          dataStatus: "demo",
        },
        create: {
          id: `doc-demo-${desa.id}-${jenisDokumen}-${tahun}-${namaDokumen.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          desaId: desa.id,
          tahun,
          namaDokumen,
          jenisDokumen,
          status,
          sourceId: demoSourceId(desa.id),
          dataStatus: "demo",
        },
      });
    }
  }
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86_400_000);
}

function userIdForName(name) {
  return `demo-user-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anonim"}`;
}

async function seedDemoVoices() {
  const userNames = [...new Set(voiceExamples.filter((voice) => !voice.isAnon).map((voice) => voice.author))];
  for (const name of userNames) {
    await prisma.user.upsert({
      where: { email: `${userIdForName(name)}@pantaudesa.local` },
      update: { name, nama: name, role: "WARGA" },
      create: {
        id: userIdForName(name),
        email: `${userIdForName(name)}@pantaudesa.local`,
        name,
        nama: name,
        role: "WARGA",
      },
    });
  }

  await prisma.user.createMany({
    data: Array.from({ length: 180 }, (_, index) => {
      const i = index + 1;
      return {
        id: `demo-signal-${i}`,
        email: `demo-signal-${i}@pantaudesa.local`,
        name: `Demo Signal ${i}`,
        nama: `Demo Signal ${i}`,
        role: "WARGA",
      };
    }),
    skipDuplicates: true,
  });

  await prisma.voiceVote.deleteMany({ where: { voiceId: { in: voiceExamples.map((voice) => voice.id) } } });
  await prisma.voiceHelpful.deleteMany({ where: { voiceId: { in: voiceExamples.map((voice) => voice.id) } } });

  for (const voice of voiceExamples) {
    await prisma.voice.upsert({
      where: { id: voice.id },
      update: {
        desaId: voice.desaId,
        category: voice.category,
        text: `${voice.text} (contoh demo dari database)`,
        isAnon: Boolean(voice.isAnon),
        status: voice.status,
        resolvedAt: voice.status === "RESOLVED" ? daysAgo(1) : null,
        createdAt: daysAgo(voice.days),
        authorId: voice.isAnon ? null : userIdForName(voice.author),
      },
      create: {
        id: voice.id,
        desaId: voice.desaId,
        category: voice.category,
        text: `${voice.text} (contoh demo dari database)`,
        isAnon: Boolean(voice.isAnon),
        status: voice.status,
        resolvedAt: voice.status === "RESOLVED" ? daysAgo(1) : null,
        createdAt: daysAgo(voice.days),
        authorId: voice.isAnon ? null : userIdForName(voice.author),
      },
    });

    if (voice.helpful > 0) {
      await prisma.voiceHelpful.createMany({
        data: Array.from({ length: voice.helpful }, (_, index) => {
          const i = index + 1;
          return {
            id: `demo-helpful-${voice.id}-${i}`,
            voiceId: voice.id,
            userId: `demo-signal-${i}`,
            createdAt: daysAgo(Math.max(0, voice.days - 1)),
          };
        }),
        skipDuplicates: true,
      });
    }

    if (voice.benar + voice.bohong > 0) {
      await prisma.voiceVote.createMany({
        data: Array.from({ length: voice.benar + voice.bohong }, (_, index) => {
          const i = index + 1;
          return {
            id: `demo-vote-${voice.id}-${i}`,
            voiceId: voice.id,
            userId: `demo-signal-${i}`,
            type: i <= voice.benar ? "BENAR" : "BOHONG",
            createdAt: daysAgo(Math.max(0, voice.days - 1)),
          };
        }),
        skipDuplicates: true,
      });
    }
  }

  await prisma.voiceReply.upsert({
    where: { id: "demo-reply-v1-desa" },
    update: {
      voiceId: "v1",
      text: "Terima kasih apresiasinya. Ini balasan demo dari database untuk verifikasi DB-first.",
      isOfficialDesa: true,
      createdAt: daysAgo(2),
    },
    create: {
      id: "demo-reply-v1-desa",
      voiceId: "v1",
      text: "Terima kasih apresiasinya. Ini balasan demo dari database untuk verifikasi DB-first.",
      isOfficialDesa: true,
      createdAt: daysAgo(2),
    },
  });
}

async function seedAdminClaimDemo() {
  const demoPinHash = await bcrypt.hash("246810", 10);
  const now = new Date();

  const demoUsers = [
    {
      id: "admin-claim-demo-warga",
      email: "warga.demo@pantaudesa.local",
      name: "Warga Demo",
      username: "warga-demo",
      nama: "Warga Demo",
      role: "WARGA",
    },
    {
      id: "admin-claim-demo-pending",
      email: "pengaju.admin.demo@pantaudesa.local",
      name: "Pengaju Admin Demo",
      username: "pengaju-admin-demo",
      nama: "Pengaju Admin Demo",
      role: "WARGA",
    },
    {
      id: "admin-claim-demo-limited",
      email: "admin.desa.limited.demo@pantaudesa.local",
      name: "Admin Desa Limited",
      username: "admin-desa-limited-demo",
      nama: "Admin Desa Limited",
      role: "DESA",
    },
    {
      id: "admin-claim-demo-verified",
      email: "admin.desa.verified.demo@pantaudesa.local",
      name: "Admin Desa Verified",
      username: "admin-desa-verified-demo",
      nama: "Admin Desa Verified",
      role: "DESA",
    },
    {
      id: "admin-claim-demo-rejected",
      email: "admin.desa.rejected.demo@pantaudesa.local",
      name: "Admin Desa Rejected",
      username: "admin-desa-rejected-demo",
      nama: "Admin Desa Rejected",
      role: "WARGA",
    },
    {
      id: "admin-claim-demo-suspended",
      email: "admin.desa.suspended.demo@pantaudesa.local",
      name: "Admin Desa Suspended",
      username: "admin-desa-suspended-demo",
      nama: "Admin Desa Suspended",
      role: "DESA",
    },
    {
      id: "platform-admin-demo",
      email: "platform.admin.demo@pantaudesa.local",
      name: "Platform Admin Demo",
      username: "platform-admin-demo",
      nama: "Platform Admin Demo",
      role: "ADMIN",
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        nama: user.nama,
        username: user.username,
        role: user.role,
        emailVerified: now,
        pinHash: demoPinHash,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        nama: user.nama,
        username: user.username,
        role: user.role,
        emailVerified: now,
        pinHash: demoPinHash,
      },
    });
  }

  const claimStates = [
    {
      id: "admin-claim-pending-demo",
      desaId: "demo-desa-lebakwangi",
      email: "pengaju.admin.demo@pantaudesa.local",
      status: "PENDING",
      method: "OFFICIAL_EMAIL",
      officialEmail: "pemdes-demo@pantaudesa.local",
      websiteUrl: "https://lebakwangi.desa.id",
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
    },
    {
      id: "admin-claim-verified-demo",
      desaId: "demo-desa-lebakwangi",
      email: "admin.desa.verified.demo@pantaudesa.local",
      status: "APPROVED",
      method: "WEBSITE_TOKEN",
      officialEmail: "pemdes-demo@pantaudesa.local",
      websiteUrl: "https://lebakwangi.desa.id",
      verifiedAt: now,
      rejectedAt: null,
      rejectionReason: null,
    },
    {
      id: "admin-claim-rejected-demo",
      desaId: "demo-desa-mangunjaya",
      email: "admin.desa.rejected.demo@pantaudesa.local",
      status: "REJECTED",
      method: "SUPPORT_REVIEW",
      officialEmail: "kontak-demo@pantaudesa.local",
      websiteUrl: null,
      verifiedAt: null,
      rejectedAt: now,
      rejectionReason: "Bukti kanal resmi belum cukup untuk demo ini.",
    },
  ];

  for (const claim of claimStates) {
    const user = await prisma.user.findUnique({ where: { email: claim.email }, select: { id: true } });
    if (!user) continue;

    await prisma.desaAdminClaim.upsert({
      where: { id: claim.id },
      update: {
        desaId: claim.desaId,
        userId: user.id,
        status: claim.status,
        method: claim.method,
        officialEmail: claim.officialEmail,
        websiteUrl: claim.websiteUrl,
        tokenHash: null,
        tokenExpiresAt: null,
        verifiedAt: claim.verifiedAt,
        rejectedAt: claim.rejectedAt,
        rejectionReason: claim.rejectionReason,
      },
      create: {
        id: claim.id,
        desaId: claim.desaId,
        userId: user.id,
        status: claim.status,
        method: claim.method,
        officialEmail: claim.officialEmail,
        websiteUrl: claim.websiteUrl,
        tokenHash: null,
        tokenExpiresAt: null,
        verifiedAt: claim.verifiedAt,
        rejectedAt: claim.rejectedAt,
        rejectionReason: claim.rejectionReason,
      },
    });
  }

  const memberStates = [
    {
      id: "admin-member-limited-demo",
      desaId: "demo-desa-lebakwangi",
      email: "admin.desa.limited.demo@pantaudesa.local",
      role: "LIMITED_ADMIN",
      status: "LIMITED",
      invitedById: "platform-admin-demo",
      verifiedById: null,
    },
    {
      id: "admin-member-verified-demo",
      desaId: "demo-desa-lebakwangi",
      email: "admin.desa.verified.demo@pantaudesa.local",
      role: "VERIFIED_ADMIN",
      status: "VERIFIED",
      invitedById: "platform-admin-demo",
      verifiedById: "platform-admin-demo",
    },
    {
      id: "admin-member-suspended-demo",
      desaId: "demo-desa-batukarut",
      email: "admin.desa.suspended.demo@pantaudesa.local",
      role: "LIMITED_ADMIN",
      status: "REVOKED",
      invitedById: "platform-admin-demo",
      verifiedById: null,
      revokedAt: new Date(),
      revokedReason: "Demo: akses dicabut untuk keperluan QA.",
    },
  ];

  for (const member of memberStates) {
    const user = await prisma.user.findUnique({ where: { email: member.email }, select: { id: true } });
    if (!user) continue;

    await prisma.desaAdminMember.upsert({
      where: { desaId_userId: { desaId: member.desaId, userId: user.id } },
      update: {
        role: member.role,
        status: member.status,
        invitedById: member.invitedById,
        verifiedById: member.verifiedById,
        revokedAt: member.revokedAt ?? null,
        revokedReason: member.revokedReason ?? null,
      },
      create: {
        id: member.id,
        desaId: member.desaId,
        userId: user.id,
        role: member.role,
        status: member.status,
        invitedById: member.invitedById,
        verifiedById: member.verifiedById,
        revokedAt: member.revokedAt ?? null,
        revokedReason: member.revokedReason ?? null,
      },
    });
  }

  const invitee = await prisma.user.findUnique({
    where: { email: "admin.desa.limited.demo@pantaudesa.local" },
    select: { id: true },
  });
  if (invitee) {
    await prisma.desaAdminInvite.upsert({
      where: { id: "admin-invite-demo-limited" },
      update: {
        desaId: "demo-desa-lebakwangi",
        email: "admin.desa.limited.demo@pantaudesa.local",
        tokenHash: "demo-token-hash",
        invitedById: "platform-admin-demo",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: null,
      },
      create: {
        id: "admin-invite-demo-limited",
        desaId: "demo-desa-lebakwangi",
        email: "admin.desa.limited.demo@pantaudesa.local",
        tokenHash: "demo-token-hash",
        invitedById: "platform-admin-demo",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: null,
      },
    });
  }

  const auditRows = [
    {
      id: "admin-audit-claim-pending",
      desaId: "demo-desa-lebakwangi",
      actorUserId: "admin-claim-demo-pending",
      targetUserId: "admin-claim-demo-pending",
      claimId: "admin-claim-pending-demo",
      eventType: "CLAIM_STARTED",
      method: "OFFICIAL_EMAIL",
      previousStatus: null,
      nextStatus: "PENDING",
    },
    {
      id: "admin-audit-claim-verified",
      desaId: "demo-desa-lebakwangi",
      actorUserId: "platform-admin-demo",
      targetUserId: "admin-claim-demo-verified",
      claimId: "admin-claim-verified-demo",
      eventType: "INTERNAL_CLAIM_APPROVED",
      method: "WEBSITE_TOKEN",
      previousStatus: "IN_REVIEW",
      nextStatus: "APPROVED",
    },
    {
      id: "admin-audit-member-limited",
      desaId: "demo-desa-lebakwangi",
      actorUserId: "platform-admin-demo",
      targetUserId: "admin-claim-demo-limited",
      claimId: null,
      eventType: "INVITE_ACCEPTED",
      method: "INVITE",
      previousStatus: null,
      nextStatus: "LIMITED",
    },
    {
      id: "admin-audit-claim-rejected",
      desaId: "demo-desa-mangunjaya",
      actorUserId: "platform-admin-demo",
      targetUserId: "admin-claim-demo-rejected",
      claimId: "admin-claim-rejected-demo",
      eventType: "CLAIM_REJECTED",
      method: "SUPPORT_REVIEW",
      previousStatus: "PENDING",
      nextStatus: "REJECTED",
    },
    {
      id: "admin-audit-member-suspended",
      desaId: "demo-desa-batukarut",
      actorUserId: "platform-admin-demo",
      targetUserId: "admin-claim-demo-suspended",
      claimId: null,
      eventType: "MEMBER_REVOKED",
      method: "INVITE",
      previousStatus: "LIMITED",
      nextStatus: "REVOKED",
    },
  ];

  for (const audit of auditRows) {
    await prisma.adminClaimAudit.upsert({
      where: { id: audit.id },
      update: {
        desaId: audit.desaId,
        actorUserId: audit.actorUserId,
        targetUserId: audit.targetUserId,
        claimId: audit.claimId,
        eventType: audit.eventType,
        method: audit.method,
        previousStatus: audit.previousStatus,
        nextStatus: audit.nextStatus,
        metadata: { demo: true },
      },
      create: {
        id: audit.id,
        desaId: audit.desaId,
        actorUserId: audit.actorUserId,
        targetUserId: audit.targetUserId,
        claimId: audit.claimId,
        eventType: audit.eventType,
        method: audit.method,
        previousStatus: audit.previousStatus,
        nextStatus: audit.nextStatus,
        metadata: { demo: true },
      },
    });
  }
}

function assertNoVerifiedData() {
  const hasVerified = [...desaRecords, ...dataSources, ...documents].some(
    (record) => record.dataStatus === "verified"
  );
  if (hasVerified) {
    throw new Error("Seed is not allowed to write verified records.");
  }
}

async function main() {
  assertNoVerifiedData();
  await seedDesa();
  await seedDataSources();
  await seedDocuments();
  await seedDemoSourcesAndBudgets();
  await seedPerangkat();
  await seedDemoVoices();
  await seedAdminClaimDemo();

  console.log(`Prepared demo seed records: ${desaRecords.length + demoVillageRecords.length} desa, ${dataSources.length + demoVillageRecords.length} sources, ${documents.length + demoVillageRecords.length * 5} documents, ${demoVillageRecords.length + desaRecords.length} summaries, ${(demoVillageRecords.length + desaRecords.length) * apbdesFields.length} APBDes items, ${(demoVillageRecords.length + desaRecords.length) * perangkatRoles.length} perangkat, ${voiceExamples.length} voices.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
