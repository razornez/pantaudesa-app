import { describe, expect, it } from "vitest";
import {
  mergePublishedOutputFisik,
  mergePublishedPerangkat,
  mergePublishedProfil,
  mergePublishedRiwayat,
  mergePublishedSkorTransparansi,
} from "@/lib/data/desa-public-view";

describe("mergePublishedPerangkat", () => {
  it("injects published kepala desa into an empty perangkat list", () => {
    expect(mergePublishedPerangkat(undefined, "Bapak Ujang")).toEqual([
      {
        jabatan: "Kepala Desa",
        nama: "Bapak Ujang",
      },
    ]);
  });

  it("replaces existing kepala desa name without dropping other perangkat rows", () => {
    expect(
      mergePublishedPerangkat(
        [
          { jabatan: "Kepala Desa", nama: "Nama Lama" },
          { jabatan: "Sekretaris Desa", nama: "Ibu Sari" },
        ],
        "Bapak Ujang",
      ),
    ).toEqual([
      { jabatan: "Kepala Desa", nama: "Bapak Ujang" },
      { jabatan: "Sekretaris Desa", nama: "Ibu Sari" },
    ]);
  });

  it("keeps existing perangkat untouched when no published kepala desa exists", () => {
    const perangkat = [{ jabatan: "Sekretaris Desa", nama: "Ibu Sari" }];
    expect(mergePublishedPerangkat(perangkat, null)).toEqual(perangkat);
  });
});

describe("published desa view overlays", () => {
  it("merges published profile values into the existing profile shape", () => {
    const result = mergePublishedProfil(
      {
        website: "https://lama.desa.id",
        email: "lama@desa.id",
        telepon: "021000",
        luasWilayah: 12,
        jumlahDusun: 2,
        jumlahRt: 4,
        jumlahRw: 2,
        jumlahKk: 300,
        mataPencaharian: "Pertanian",
        potensiUnggulan: "Padi",
        terakhirDiperbarui: new Date("2026-05-20T00:00:00.000Z"),
        aset: [],
        fasilitas: [],
        lembaga: [],
        historyBelanja: [],
        badge: {
          level: 3,
          label: "Sedang",
          deskripsi: "Mock",
          warna: "indigo",
          icon: "i",
        },
      },
      {
        websiteUrl: "https://batukarut.desa.id",
        teleponDesa: "08123456789",
        emailDesa: "halo@batukarut.desa.id",
        jumlahDusun: 4,
        jumlahRt: 11,
        jumlahRw: 5,
        jumlahKK: 987,
        potensiUnggulan: "Wisata Sungai",
        fasilitasUmum: [
          { nama: "PAUD Melati", jenis: "pendidikan", jumlah: 1, kondisi: "baik" },
        ],
        lembagaDesa: [
          {
            nama: "Karang Taruna Maju",
            jenis: "pemberdayaan",
            ketua: "Rudi",
            anggota: 24,
            tahunBerdiri: 2018,
            aktif: true,
            deskripsi: "Pemuda desa aktif",
          },
        ],
      },
    );

    expect(result?.website).toBe("https://batukarut.desa.id");
    expect(result?.telepon).toBe("08123456789");
    expect(result?.email).toBe("halo@batukarut.desa.id");
    expect(result?.jumlahKk).toBe(987);
    expect(result?.potensiUnggulan).toBe("Wisata Sungai");
    expect(result?.fasilitas[0]?.nama).toBe("PAUD Melati");
    expect(result?.lembaga[0]?.nama).toBe("Karang Taruna Maju");
  });

  it("merges published output, history, and transparency score", () => {
    expect(
      mergePublishedOutputFisik(undefined, [
        { label: "Jalan usaha tani", satuan: "meter", target: 1000, realisasi: 800, persentase: 80 },
      ]),
    ).toEqual([
      { label: "Jalan usaha tani", satuan: "meter", target: 1000, realisasi: 800, persentase: 80 },
    ]);

    expect(
      mergePublishedRiwayat(undefined, [
        { tahun: 2024, totalAnggaran: 1000000, terealisasi: 900000, persentaseSerapan: 90 },
      ]),
    ).toEqual([
      { tahun: 2024, totalAnggaran: 1000000, terealisasi: 900000, persentaseSerapan: 90 },
    ]);

    expect(
      mergePublishedSkorTransparansi(undefined, {
        skorTransparansiTotal: 84,
        skorKetepatan: 82,
        skorKelengkapan: 86,
      }),
    ).toEqual({
      total: 84,
      ketepatan: 82,
      kelengkapan: 86,
      responsif: 0,
      konsistensi: 0,
    });
  });

  it("builds a fallback profile from published template values when legacy profil is missing", () => {
    const result = mergePublishedProfil(undefined, {
      websiteUrl: "https://batukarut.desa.id",
      teleponDesa: "022-87991234",
      emailDesa: "halo@batukarut.desa.id",
      jumlahDusun: 4,
      jumlahRt: 11,
      jumlahRw: 5,
      jumlahKK: 987,
      potensiUnggulan: "Wisata sungai",
      totalAnggaran: 3250000000,
      terealisasi: 2762500000,
      tahunData: 2026,
      fasilitasUmum: [
        { nama: "SD Negeri Batukarut 01", jenis: "pendidikan", jumlah: 1, kondisi: "baik" },
      ],
      asetDesa: [
        {
          nama: "Gedung serbaguna desa",
          jenis: "bangunan",
          nilai: 780000000,
          tahunBeli: 2018,
          kondisi: "baik",
          lokasi: "Dusun Tengah",
        },
      ],
      lembagaDesa: [
        {
          nama: "Karang Taruna Tunas Karya",
          jenis: "pemberdayaan",
          ketua: "Dewi",
          anggota: 28,
          tahunBerdiri: 2017,
          aktif: true,
          deskripsi: "Penggerak pemuda desa",
        },
      ],
      bumdes: {
        nama: "BUMDes Batu Maju",
        bidangUsaha: "Agrowisata",
        tahunBerdiri: 2020,
        modal: 350000000,
        status: "aktif",
        deskripsi: "BUMDes aktif",
      },
    });

    expect(result?.website).toBe("https://batukarut.desa.id");
    expect(result?.telepon).toBe("022-87991234");
    expect(result?.email).toBe("halo@batukarut.desa.id");
    expect(result?.jumlahDusun).toBe(4);
    expect(result?.aset[0]?.nama).toBe("Gedung serbaguna desa");
    expect(result?.fasilitas[0]?.nama).toBe("SD Negeri Batukarut 01");
    expect(result?.lembaga[0]?.nama).toBe("Karang Taruna Tunas Karya");
    expect(result?.bumdes?.nama).toBe("BUMDes Batu Maju");
    expect(result?.historyBelanja.length).toBeGreaterThan(0);
  });
});
