/**
 * copy.ts — satu sumber kebenaran untuk seluruh teks UI PantauDesa.
 *
 * Prinsip: tidak ada string UI yang di-hardcode di dalam komponen.
 * Setiap perubahan bahasa cukup dilakukan di sini.
 */


export const STATUS_FILTER_LABELS: Record<string, string> = {
  semua:        "Semua Desa",
  ada_anggaran: "Ada Data Anggaran",
  baik:         "Data Lengkap (≥84%)",
  sedang:       "Data Sedang (34–83%)",
  rendah:       "Data Minim (<34%)",
};

// ─── Bidang APBDes → label ramah warga ───────────────────────────────────────

export const BIDANG_CITIZEN_LABELS: Record<string, { label: string; hint: string }> = {
  "1": {
    label: "Operasional Kantor & Gaji Perangkat Desa",
    hint:  "Biaya menjalankan roda pemerintahan desa sehari-hari",
  },
  "2": {
    label: "Pembangunan Fisik (Jalan, Gedung, Drainase, dll.)",
    hint:  "Infrastruktur yang bisa kamu lihat dan rasakan langsung",
  },
  "3": {
    label: "Program Sosial & Kemasyarakatan",
    hint:  "Kegiatan sosial, budaya, keagamaan, dan keamanan warga",
  },
  "4": {
    label: "Pelatihan & Pemberdayaan Warga",
    hint:  "Program untuk meningkatkan kemampuan dan kesejahteraan warga",
  },
  "5": {
    label: "Dana Siaga Bencana & Darurat",
    hint:  "Cadangan untuk situasi tak terduga — bencana alam, wabah, dll.",
  },
};

// ─── Judul seksi ──────────────────────────────────────────────────────────────

export const SECTION = {
  // Home page
  ringkasanNasional:    "Apa yang Sedang Dipetakan?",
  ringkasanNasionalSub: "Gambaran besar kelengkapan data dan Dana Desa untuk desa-desa di seluruh Indonesia",
  alertDini:            "Desa yang Datanya Masih Minim",
  alertDiniSub: (n: number) =>
    `${n} desa datanya masih minim — bantu lengkapi dengan menelusuri sumber resminya.`,
  distribusi:    "Berapa Desa yang Datanya Sudah Lengkap?",
  distribusiSub: "Sebaran desa berdasarkan seberapa lengkap data yang berhasil dikumpulkan",
  topBaik:       "Desa dengan Capaian Tinggi",
  topBaikSub:    "5 desa yang paling aktif dan bertanggung jawab menggunakan anggarannya",
  topRendah:     "Desa yang Perlu Ditinjau",
  topRendahSub:  "5 desa dengan penggunaan anggaran paling rendah dan perlu dicek sumbernya",
  peringkat:     "Provinsi Mana yang Desanya Paling Baik?",
  peringkatSub:  "Rata-rata kinerja penggunaan anggaran per provinsi",

  // Detail desa
  pendapatan:    "Dari Mana Uang Desa Ini Berasal?",
  pendapatanSub: "Desa mendapat anggaran dari beberapa sumber — semuanya uang rakyat",
  skor:          "Seberapa Terbuka Desa Ini ke Warganya?",
  skorSub:       "Dinilai dari keterbukaan informasi, ketepatan laporan, dan respons terhadap warga",
  outputFisik:   "Apa yang Seharusnya Sudah Ada atau Dikerjakan?",
  outputFisikSub:"Hasil nyata yang seharusnya bisa kamu lihat dan rasakan dari anggaran ini",
  apbdes:        "Anggaran Ini Dipakai untuk Apa Saja?",
  apbdesSub:     "Rincian penggunaan per bidang — kamu berhak mengetahui ini",
  perangkat:     "Siapa yang Harus Kamu Tanya?",
  perangkatSub:  "Pejabat desa yang bertanggung jawab atas pengelolaan anggaran ini",
  riwayat:       "Apakah Kinerjanya Membaik dari Tahun ke Tahun?",
  riwayatSub:    "Persentase anggaran yang digunakan dari 2020 hingga 2024",
  dokumen:       "Dokumen yang Bisa Kamu Minta ke Desa",
  dokumenSub:    "Berdasarkan UU Desa No. 6/2014, warga berhak mengakses semua dokumen ini secara gratis",
} as const;

// ─── Stats cards (home) ───────────────────────────────────────────────────────

export const STATS = {
  totalDanaDesa: {
    label: "Total Dana Desa (DJPK)",
    sub:   (desaCount: string) => `Tersebar di ${desaCount} desa`,
  },
  totalDesa: {
    label: "Desa yang Sedang Dipantau",
    sub:   "Desa aktif dalam pengawasan publik",
  },
  rataRataKelengkapan: {
    label: "Rata-rata Kelengkapan Data",
    sub:   "Seberapa lengkap data tiap desa terkumpul",
  },
  desaLengkap: {
    label: "Desa dengan Data Lengkap",
    sub:   (pct: number) => `${pct}% dari total desa terpantau`,
  },
  desaSedang: {
    label: "Desa dengan Data Sedang",
    sub:   (pct: number) => `${pct}% dari total desa terpantau`,
  },
  desaMinim: {
    label: "Desa dengan Data Minim",
    sub:   (pct: number) => `${pct}% dari total desa terpantau`,
  },
} as const;


export const SKOR = {
  labels: {
    transparan: "Desa ini cukup terbuka ke warganya",
    cukup:      "Masih ada informasi yang sulit diakses warga",
    rendah:     "Desa ini kurang terbuka — kamu berhak meminta informasi",
  },
  metricLabels: {
    ketepatan:   "Laporan disampaikan tepat waktu?",
    kelengkapan: "Dokumen publik bisa diakses warga?",
    konsistensi: "Anggaran dipakai secara konsisten?",
    responsif:   "Cepat merespons pertanyaan warga?",
  },
  nationalLabel: "Rata-rata Keterbukaan Desa se-Indonesia",
  nationalSub:   "Gabungan dari laporan tepat waktu, dokumen terbuka, penggunaan anggaran yang jelas, dan respons desa ke warga",
  methodologyTitle:  "Cara menghitung skor ini",
  methodologyItems: [
    "Ketersediaan dokumen publik (APBDes, RKPDes, Laporan Realisasi)",
    "Kelengkapan laporan tahunan",
    "Konsistensi serapan anggaran sepanjang tahun",
    "Respons desa terhadap kanal pertanyaan warga",
  ],
  methodologyNote: "Skor ini adalah simulasi demo — bukan skor resmi atau final. Angka sebenarnya bergantung pada sumber data yang sudah diverifikasi.",
} as const;

// ─── SeharusnyaAdaSection safety copy (RIGHTS-01, RIGHTS-06) ─────────────────

export const SEHARUSNYA_ADA = {
  estimasiCaution: "Angka ini adalah estimasi panduan, bukan bukti pelanggaran.",
  sectionDisclaimer: "Daftar ini disusun sebagai panduan membaca anggaran, bukan sebagai bukti ada atau tidaknya pelanggaran. Warga perlu mengecek sumber dokumen resmi sebelum membuat kesimpulan.",
  statusLabels: {
    wajib:        "Ada dasar regulasi",
    direncanakan: "Masuk rencana APBDes",
    tanyakan:     "Perlu ditanyakan ke desa",
  },
  verdictDemoNote: "Angka serapan ini adalah data demo untuk panduan baca. Bukan kesimpulan final.",
} as const;

// ─── Sumber pendapatan desa ───────────────────────────────────────────────────

export const PENDAPATAN = {
  danaDesa:         { label: "Dana dari Pemerintah Pusat",    hint: "Transfer langsung dari APBN" },
  add:              { label: "Alokasi dari Kabupaten (ADD)",  hint: "Bagian dari Dana Alokasi Umum kabupaten" },
  pades:            { label: "Pendapatan Asli Desa",          hint: "Hasil usaha, aset, dan retribusi desa" },
  bantuanKeuangan:  { label: "Bantuan Keuangan Lain",         hint: "Dari provinsi, kabupaten, atau pihak lain" },
} as const;


// ─── Tabel desa ───────────────────────────────────────────────────────────────

export const TABLE_HEADERS = {
  nama:        "Nama Desa",
  wilayah:     "Wilayah",
  anggaran:    "Dana Desa",
  kelengkapan: "Kelengkapan",
} as const;

// ─── Donut chart ──────────────────────────────────────────────────────────────

export const DONUT_LABELS = {
  baik:   "Data Lengkap (≥75%)",
  sedang: "Data Sedang (34–74%)",
  rendah: "Data Minim (<34%)",
} as const;

// ─── Hero homepage ────────────────────────────────────────────────────────────

export const HERO = {
  badge:     (tahun: number, total: number) => `Data ${tahun} · ${total} Desa Terpantau`,
  title:     "Uang desamu sudah dipakai untuk apa?",
  subtitle:  "Setiap tahun desamu mendapat miliaran rupiah dari negara. Uang itu untuk kamu — rakyatnya. Cari desamu dan lihat: sudah dipakai dengan benar atau belum.",
  ctaSearch: "Cari Desamu Sekarang",
  ctaAll:    "Cara Membaca Data",
} as const;

export const NAVBAR_COPY = {
  publicDataNote: "Data publik bebas diakses",
} as const;

export const AUTH_COPY = {
  whyAccountTitle: "Kenapa perlu akun?",
  whyAccountBody:
    "Data publik tetap bisa dilihat tanpa akun. Namun akun membantu kamu ikut berperan lebih jauh: menyimpan desa yang kamu pedulikan, mengikuti perubahan data, memberi kontribusi, dan membangun reputasi sebagai warga aktif. Dengan akun, partisipasi tidak lagi anonim dan acak.",
  publicAccess: "Kamu tetap bisa melihat data publik tanpa akun.",
  seePublicData: "Lihat dulu tanpa daftar",
  login: {
    title: "Masuk kembali ke ruang pantau desamu.",
    subtitle:
      "Lanjutkan memantau desa yang kamu simpan, lihat kontribusimu, dan ikuti perkembangan transparansi yang kamu pedulikan.",
    sideTitle: "Transparansi desa adalah kerja bersama warga.",
    sideBody:
      "Masuk untuk melanjutkan pantauan, mengikuti perkembangan desa, dan menjaga kontribusimu tetap tertata.",
    primaryCta: "Masuk ke PantauDesa",
    registerPrompt: "Baru pertama kali ikut memantau?",
    registerCta: "Buat akun warga peduli",
  },
  register: {
    title: "Ikut menjaga desa dari tempat paling dekat: sebagai warga yang peduli.",
    subtitle:
      "Dengan akun PantauDesa, kamu bisa menyimpan desa yang kamu pedulikan, mengikuti perubahan data, memberi kontribusi, dan membangun reputasi sebagai warga aktif.",
    sideTitle: "Buat akun untuk ikut memantau, memahami, dan menjaga transparansi desa.",
    sideBody:
      "Akun membuat partisipasi warga lebih bertanggung jawab: kontribusi punya identitas, reputasi bisa dibangun, dan perkembangan desa lebih mudah diikuti.",
    primaryCta: "Mulai Ikut Memantau",
    loginPrompt: "Sudah punya akun?",
    loginCta: "Masuk ke PantauDesa",
    benefits: [
      "Simpan desa yang ingin kamu pantau.",
      "Ikuti perubahan data dan status anggaran.",
      "Beri kontribusi informasi atau koreksi dengan lebih bertanggung jawab.",
      "Kumpulkan badge kontribusi sebagai tanda partisipasi.",
      "Bangun profil warga peduli yang bisa dipercaya komunitas.",
    ],
  },
} as const;

export const RESPONSIBILITY_CARD = {
  title: "Tanyakan ke pihak yang tepat",
  body:
    "Tidak semua masalah di wilayah desa menjadi kewenangan pemerintah desa. Lihat dulu apakah hal ini terkait APBDes, program desa, kewenangan kabupaten, provinsi, atau pusat agar pertanyaanmu lebih tepat sasaran.",
  cta: "Lihat panduan kewenangan",
  disclaimer: "Panduan kewenangan bersifat umum. Detail perlu diverifikasi dengan sumber resmi.",
} as const;


export const PHILOSOPHY = {
  homeTitle: "Kenapa desa harus dipantau?",
  homeIntro:
    "Karena desa adalah akar dari kemakmuran masyarakat. Saat dana sampai ke desa lalu dikelola dengan terbuka, manfaatnya terasa paling dekat: jalan, posyandu, irigasi, bantuan sosial, sampai pelayanan dasar warga.",
  homeBody:
    "PantauDesa tidak dibangun untuk mengajak orang membenci aparat desa. Platform ini dibangun agar warga dan pemerintah desa sama-sama punya pijakan yang jernih: mana yang sudah berjalan baik, mana yang perlu dibenahi, dan di titik mana anggaran berhenti tersalurkan dengan benar.",
  homeClosing:
    "Kalau struktur paling bawah sehat, transparan, dan responsif, pengawasan ke tingkat atas juga jadi lebih kuat dan lebih adil.",
  authorityTitle: "Awasi sesuai kewenangan, supaya kritik tepat sasaran",
  authorityIntro:
    "Tidak semua masalah adalah tanggung jawab kepala desa. Warga perlu tahu batas wewenang tiap level pemerintahan agar pengawasan tidak berubah jadi tuduhan yang salah alamat.",
  authorityNote:
    "Pantau yang menjadi urusan desa, lalu eskalasikan dengan benar saat masalahnya memang berada di tingkat kecamatan, kabupaten, atau provinsi.",
} as const;

export const WHY_MONITORING_PAGE = {
  eyebrow: "Kenapa desa dipantau?",
  title: "Memantau desa bukan berarti menuduh. Memantau desa berarti ikut menjaga akar kemakmuran bersama.",
  intro:
    "Desa adalah tempat banyak kebutuhan warga bermula: jalan lingkungan, posyandu, irigasi, bantuan sosial, pelayanan administrasi, sampai program pemberdayaan. Karena itu, transparansi desa bukan ancaman. Transparansi adalah cara membangun kepercayaan.",
  sections: [
    {
      title: "Desa adalah titik paling dekat dengan warga",
      body:
        "Ketika anggaran desa jelas, warga lebih mudah memahami program yang berjalan dan pihak desa lebih mudah menjelaskan prioritasnya.",
    },
    {
      title: "Pengawasan membuat pembangunan lebih tepat sasaran",
      body:
        "Warga yang paham data bisa bertanya dengan lebih tenang, membawa bukti, dan membantu menemukan bagian yang perlu diperbaiki.",
    },
    {
      title: "Adil untuk warga dan pihak desa",
      body:
        "PantauDesa tidak mengajak warga menyimpulkan pelanggaran tanpa dasar. PantauDesa membantu membedakan mana yang sudah baik, mana yang perlu ditanyakan, dan mana yang perlu diverifikasi.",
    },
  ],
  closing:
    "Jika desa terbuka, bekerja baik, dan warganya aktif bertanya dengan cara yang benar, pengawasan ke tingkat kecamatan, kabupaten, provinsi, sampai pusat akan lebih mudah dibangun.",
} as const;

export const AUTHORITY_GUIDE_PAGE = {
  eyebrow: "Panduan kewenangan",
  title: "Tanyakan ke pihak yang tepat sebelum menyimpulkan masalah desa.",
  intro:
    "Tidak semua masalah di wilayah desa otomatis menjadi kewenangan pemerintah desa. Ada urusan yang berada di desa, kecamatan, kabupaten/kota, provinsi, atau pemerintah pusat. Panduan ini membantu warga bertanya lebih tepat sasaran.",
  disclaimer:
    "Catatan: pembagian kewenangan di halaman ini bersifat panduan umum. Detail hukum, program, dan kanal resmi perlu diverifikasi kembali dengan sumber pemerintah yang berlaku.",
  categories: [
    {
      level: "Biasanya terkait desa",
      items: ["APBDes", "Program desa", "Dokumen publik desa", "Perangkat desa", "Musyawarah desa", "BUMDes"],
    },
    {
      level: "Bisa terkait kecamatan/kabupaten/kota",
      items: ["Jalan kabupaten", "Program dinas", "Perizinan tertentu", "Puskesmas", "Pembinaan pemerintahan desa"],
    },
    {
      level: "Bisa terkait provinsi",
      items: ["Jalan provinsi", "Program lintas kabupaten/kota", "Bantuan provinsi", "Kebijakan sektoral provinsi"],
    },
    {
      level: "Bisa terkait pemerintah pusat",
      items: ["Dana transfer pusat", "Program nasional", "Bantuan sosial nasional", "Regulasi kementerian"],
    },
  ],
} as const;

export const AUTHORITY_HIGHLIGHTS = [
  {
    level: "Desa",
    scope: "APBDes, jalan desa, drainase lingkungan, posyandu, BUMDes, pendataan bansos desa",
    tone: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  {
    level: "Camat",
    scope: "Pembinaan dan koordinasi antar desa, pengawasan administratif, fasilitasi masalah lintas desa",
    tone: "bg-sky-50 border-sky-200 text-sky-800",
  },
  {
    level: "Bupati/Wali Kota",
    scope: "Jalan kabupaten, puskesmas, sekolah negeri kabupaten, APBD kabupaten, dinas teknis",
    tone: "bg-amber-50 border-amber-200 text-amber-800",
  },
  {
    level: "Gubernur/Provinsi",
    scope: "Jalan provinsi, program provinsi, bantuan provinsi, koordinasi lintas kabupaten",
    tone: "bg-violet-50 border-violet-200 text-violet-800",
  },
] as const;

// ─── Dokumen publik ───────────────────────────────────────────────────────────

export const DOKUMEN = {
  tersedia: "Lihat dokumen",
  belum:    "Belum ada — kamu berhak memintanya!",
} as const;

// ─── Pre-report checklist gate (REPORT-01 through REPORT-07) ─────────────────

export const PRE_REPORT = {
  gateTitle:   "Cek Langkah Sebelum Melapor",
  gateSubtitle: "Laporan yang kuat adalah laporan yang sudah disiapkan dengan baik. Pastikan hal-hal ini sebelum melanjutkan.",
  checklist: [
    "Pastikan data berasal dari dokumen resmi.",
    "Cek apakah masalah termasuk kewenangan desa.",
    "Dokumentasikan bukti lapangan.",
    "Gunakan jalur tanya dulu sebelum eskalasi.",
  ],
  ctaReady:    "Saya sudah cek — lanjut melihat jalur pelaporan",
  ctaNotReady: "Belum siap — kembali ke panduan",
  lapor:       "Lapor ke LAPOR.go.id",
  hotline:     "Hotline 1708",
  inspektorat: (kab: string) => `Inspektorat ${kab}`,
  note:        "Jalur pelaporan di atas adalah untuk masalah yang benar-benar terkait kewenangan desa dan sudah didukung bukti. Baca panduan kewenangan sebelum melapor.",
} as const;

// ─── Pengaduan (Pak Waspada CTA — kept for homepage bottom CTA) ──────────────


// ─── Filter bar ───────────────────────────────────────────────────────────────

export const FILTER = {
  searchPlaceholder: "Ketik nama desa, kecamatan, atau kabupaten",
  allProvinsi:       "Semua Provinsi",
  filterLabel:       "Tampilkan:",
  totalResults:      (n: number) => `Ditemukan ${n} desa`,
  reset:             "Reset filter",
} as const;

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER = {
  tagline:   "Kami hadir untuk menjawab pertanyaan yang selama ini tidak pernah dijawab — tentang uang desamu.",
  copyright: (year: number) => `© ${year} PantauDesa`,
} as const;
