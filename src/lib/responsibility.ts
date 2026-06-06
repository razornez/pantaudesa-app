/**
 * responsibility.ts — data rantai tanggung jawab per jenis masalah warga.
 *
 * Pure data layer: tidak tahu UI, tidak tahu komponen.
 * Pihak-pihak diisi dinamis berdasarkan data desa (nama kecamatan, kabupaten, kepala desa).
 */

import { Desa } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EscalationStep {
  level:       1 | 2 | 3;
  pihak:       string;
  keterangan:  string;   // apa yang warga harus lakukan / ucapkan
  kontak?:     string;   // nomor/alamat kontak jika ada
  url?:        string;   // link pelaporan online
  labelUrl?:   string;   // label untuk URL
}

export interface ProblemCategory {
  id:        string;
  icon:      string;    // emoji sebagai icon
  labelTab:  string;    // singkat, untuk tab
  judul:     string;    // judul lengkap masalah
  deskripsi: string;
  eskalasi:  EscalationStep[];
  tips?:     string;
}

// ─── Factory: isi pihak-pihak dengan data desa ────────────────────────────

export function getResponsibilities(desa: Desa): ProblemCategory[] {
  const kades  = desa.perangkat?.find(p => p.jabatan === "Kepala Desa")?.nama ?? "Kepala Desa";
  const kec    = desa.kecamatan;
  const kab    = desa.kabupaten;
  const dNama  = desa.nama;

  return [

    // ── 1. Infrastruktur & Fasilitas ───────────────────────────────────────
    {
      id:        "infrastruktur",
      icon:      "🛣️",
      labelTab:  "Jalan & Fasilitas",
      judul:     "Jalan Rusak / Fasilitas Tidak Ada",
      deskripsi: "Jalan berlubang, drainase mampet, lapangan tidak dibangun, atau fasilitas desa yang dijanjikan tidak pernah ada.",
      eskalasi: [
        {
          level:      1,
          pihak:      `Kepala Desa — ${kades}`,
          keterangan: `Laporkan langsung ke kantor ${dNama}. Minta jadwal perbaikan secara tertulis. Kepala desa wajib merespons dalam 7 hari kerja.`,
          kontak:     desa.perangkat?.find(p => p.jabatan === "Kepala Desa")?.kontak,
        },
        {
          level:      2,
          pihak:      `Camat Kecamatan ${kec}`,
          keterangan: `Jika kepala desa tidak merespons dalam 7 hari, bawa surat tertulis ke kantor camat. Camat berwenang menegur dan mendorong kepala desa bertindak.`,
        },
        {
          level:      3,
          pihak:      `DPMD (Dinas Pemberdayaan Masyarakat & Desa) Kab. ${kab}`,
          keterangan: `Untuk masalah yang terus diabaikan. DPMD berwenang mengaudit penggunaan dana desa dan memanggil kepala desa.`,
          url:        "https://www.lapor.go.id",
          labelUrl:   "Lapor ke LAPOR.go.id",
        },
      ],
      tips: "Dokumentasikan masalah dengan foto + video sebelum melapor. Ini memperkuat posisimu.",
    },

    // ── 2. Bantuan Sosial / BLT ────────────────────────────────────────────
    {
      id:        "bansos",
      icon:      "💰",
      labelTab:  "Bansos & BLT",
      judul:     "BLT Tidak Cair / Tidak Merata",
      deskripsi: "Bantuan Langsung Tunai (BLT) Dana Desa tidak sampai ke keluarga yang berhak, jumlahnya kurang, atau ada warga tidak layak yang malah dapat bantuan.",
      eskalasi: [
        {
          level:      1,
          pihak:      `Kepala Desa — ${kades}`,
          keterangan: `Kepala desa mengelola daftar penerima BLT (DTKS). Minta penjelasan tertulis kenapa namamu tidak masuk, atau kenapa nominalnya berbeda.`,
          kontak:     desa.perangkat?.find(p => p.jabatan === "Kepala Desa")?.kontak,
        },
        {
          level:      2,
          pihak:      `Dinas Sosial Kabupaten ${kab}`,
          keterangan: `Jika namamu seharusnya masuk tapi tidak ada di daftar, minta re-verifikasi data melalui Dinsos. Bawa KTP, KK, dan surat keterangan tidak mampu dari RT/RW.`,
          url:        "https://cekbansos.kemensos.go.id",
          labelUrl:   "Cek status bansos di Kemensos",
        },
        {
          level:      3,
          pihak:      "Kementerian Sosial RI",
          keterangan: `Ajukan pengaduan online jika Dinsos tidak membantu. Sertakan nomor NIK dan bukti bahwa kamu memenuhi syarat penerima BLT.`,
          url:        "https://lapor.go.id",
          labelUrl:   "Lapor ke LAPOR.go.id",
        },
      ],
      tips: "Cek status bantuan di cekbansos.kemensos.go.id menggunakan NIK sebelum melapor — pastikan datamu benar dulu.",
    },

    // ── 3. Anggaran Tidak Transparan ───────────────────────────────────────
    {
      id:        "anggaran",
      icon:      "📋",
      labelTab:  "Anggaran & APBDes",
      judul:     "Anggaran Besar, Hasil Tidak Terlihat",
      deskripsi: "Dana desa sudah terserap besar tapi tidak ada perubahan nyata di desa, atau dokumen APBDes tidak bisa diakses warga.",
      eskalasi: [
        {
          level:      1,
          pihak:      `Kepala Desa — ${kades} & BPD ${dNama}`,
          keterangan: `Minta salinan APBDes dan Laporan Realisasi Anggaran secara resmi dan tertulis. Ini HAK warga berdasarkan UU Desa No. 6/2014 — tidak boleh ditolak tanpa alasan sah.`,
          kontak:     desa.perangkat?.find(p => p.jabatan === "Kepala Desa")?.kontak,
        },
        {
          level:      2,
          pihak:      `Inspektorat Kabupaten ${kab}`,
          keterangan: `Jika dokumen ditolak atau ada kejanggalan, laporkan ke inspektorat. Mereka berwenang mengaudit laporan keuangan desa.`,
        },
        {
          level:      3,
          pihak:      "BPKP (Badan Pengawasan Keuangan dan Pembangunan)",
          keterangan: `BPKP berwenang melakukan audit khusus atas permintaan masyarakat jika ada dugaan penyimpangan dana desa yang serius.`,
          url:        "https://www.lapor.go.id",
          labelUrl:   "Lapor ke LAPOR.go.id",
        },
      ],
      tips: "Kamu bisa minta APBDes ke papan informasi desa atau website desa. Jika tidak ada, itu sendiri sudah pelanggaran.",
    },

    // ── 4. Dugaan Korupsi ──────────────────────────────────────────────────
    {
      id:        "korupsi",
      icon:      "⚠️",
      labelTab:  "Dugaan Korupsi",
      judul:     "Dugaan Penyimpangan atau Korupsi Dana Desa",
      deskripsi: "Ada indikasi dana desa digunakan tidak semestinya — proyek fiktif, mark-up harga, atau uang hilang tanpa pertanggungjawaban.",
      eskalasi: [
        {
          level:      1,
          pihak:      `Inspektorat Kabupaten ${kab}`,
          keterangan: `Laporkan dengan bukti-bukti awal: foto, dokumen, kesaksian warga. Inspektorat adalah garda terdepan pengawasan desa di tingkat kabupaten.`,
          url:        "https://www.lapor.go.id",
          labelUrl:   "Lapor via LAPOR.go.id",
        },
        {
          level:      2,
          pihak:      "KPK (Komisi Pemberantasan Korupsi)",
          keterangan: `Untuk kasus yang lebih serius atau jika inspektorat tidak menindaklanjuti. KPK memiliki hotline pengaduan masyarakat.`,
          url:        "https://kpk.go.id/id/layanan-publik/pengaduan-masyarakat",
          labelUrl:   "Lapor ke KPK",
          kontak:     "198 (Hotline KPK)",
        },
        {
          level:      3,
          pihak:      "Kejaksaan Negeri / Polres setempat",
          keterangan: `Jika ada bukti kuat, kamu juga bisa melapor ke Kejaksaan atau Polres. Pastikan kamu membawa dokumentasi lengkap dan saksi.`,
        },
      ],
      tips: "JANGAN menghadapi sendiri. Kumpulkan bukti diam-diam, konsultasi ke LSM atau jurnalis terlebih dahulu untuk perlindungan.",
    },

    // ── 5. Perizinan Ilegal ────────────────────────────────────────────────
    {
      id:        "perizinan",
      icon:      "🏗️",
      labelTab:  "Izin Ilegal",
      judul:     "Bangunan atau Aktivitas Ilegal di Desamu",
      deskripsi: "Perumahan dibangun di lahan yang tidak boleh dibangun (lereng, sempadan sungai, kawasan hijau), atau ada usaha yang beroperasi tanpa izin resmi.",
      eskalasi: [
        {
          level:      1,
          pihak:      `Kepala Desa — ${kades} & BPD ${dNama}`,
          keterangan: `Tanyakan apakah ada rekomendasi desa yang dikeluarkan. Desa tidak bisa mengeluarkan IMB/PBG, tapi rekomendasi desa diperlukan untuk proses perizinan.`,
        },
        {
          level:      2,
          pihak:      `Dinas PUPR & Tata Ruang Kab. ${kab}`,
          keterangan: `Dinas PUPR berwenang mengeluarkan dan mencabut izin bangunan (PBG). Laporkan dengan alamat lengkap dan foto bangunan yang diduga ilegal.`,
        },
        {
          level:      3,
          pihak:      `BPBD (Badan Penanggulangan Bencana Daerah) Kab. ${kab} / KLHK`,
          keterangan: `Jika bangunan ada di kawasan rawan bencana atau merusak lingkungan, BPBD dan KLHK berwenang menindak dengan kewenangan lebih kuat.`,
          url:        "https://www.lapor.go.id",
          labelUrl:   "Lapor ke LAPOR.go.id",
        },
      ],
      tips: "Foto koordinat GPS bangunan ilegal menggunakan Google Maps. Ini sangat membantu proses pelaporan.",
    },

    // ── 6. Pelayanan / Pungli ──────────────────────────────────────────────
    {
      id:        "pelayanan",
      icon:      "🪪",
      labelTab:  "Pelayanan & Pungli",
      judul:     "Pelayanan Perlu Ditindaklanjuti atau Pungutan Liar",
      deskripsi: "Dipersulit mengurus surat desa, diminta bayar untuk layanan yang seharusnya gratis, atau diperlakukan tidak adil oleh perangkat desa.",
      eskalasi: [
        {
          level:      1,
          pihak:      `Kepala Desa — ${kades}`,
          keterangan: `Semua layanan administrasi desa (KTP, KK, surat keterangan) adalah GRATIS. Laporkan perangkat desa yang meminta uang secara resmi ke kepala desa.`,
          kontak:     desa.perangkat?.find(p => p.jabatan === "Kepala Desa")?.kontak,
        },
        {
          level:      2,
          pihak:      `Camat Kecamatan ${kec} / Ombudsman RI`,
          keterangan: `Ombudsman RI berwenang menangani maladministrasi (termasuk pungli) di semua instansi pemerintah termasuk desa. Pengaduan gratis dan dilindungi.`,
          url:        "https://www.ombudsman.go.id/pengaduan",
          labelUrl:   "Lapor ke Ombudsman RI",
          kontak:     "137 (Hotline Ombudsman)",
        },
        {
          level:      3,
          pihak:      "LAPOR! (Layanan Aspirasi dan Pengaduan Online Rakyat)",
          keterangan: `Portal resmi pemerintah untuk pengaduan yang langsung terhubung ke kementerian terkait dan wajib direspons dalam 5 hari kerja.`,
          url:        "https://www.lapor.go.id",
          labelUrl:   "Lapor ke LAPOR.go.id",
          kontak:     "1708 (Hotline LAPOR!)",
        },
      ],
      tips: "Catat nama perangkat, tanggal, dan apa yang diminta. Simpan bukti transfer jika kamu sudah terlanjur bayar.",
    },
  ];
}
