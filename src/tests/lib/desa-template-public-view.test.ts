import { describe, expect, it } from "vitest";
import {
  buildPublishedProfilSection,
  toPublishedPerangkatDesaArray,
} from "@/lib/data/desa-template-public-view";

describe("desa template public view", () => {
  it("does not invent profile values when no published profile field exists", () => {
    expect(buildPublishedProfilSection({})).toBeNull();
  });

  it("uses published profile values exactly as provided by template data", () => {
    const profil = buildPublishedProfilSection({
      jumlahDusun: 4,
      jumlahRt: 11,
      jumlahRw: 5,
      jumlahKK: 987,
      teleponDesa: "022-87991234",
      emailDesa: "halo@batukarut.desa.id",
      potensiUnggulan: "Kopi rakyat dan wisata sungai.",
      luasWilayah: 12.4,
      mataPencaharian: "Pertanian dan jasa lokal",
      luasSawah: 186,
      luasHutan: 94,
    });

    expect(profil).not.toBeNull();
    expect(profil?.luasWilayah).toBe(12.4);
    expect(profil?.mataPencaharian).toBe("Pertanian dan jasa lokal");
    expect(profil?.luasSawah).toBe(186);
    expect(profil?.luasHutan).toBe(94);
    expect(profil?.potensiUnggulan).toBe("Kopi rakyat dan wisata sungai.");
  });

  it("does not keep perangkat fields inside the published profile component", () => {
    const profil = buildPublishedProfilSection({
      kepalaDesa: "Bapak Asep",
      perangkatDesa: [
        { jabatan: "Sekretaris Desa", nama: "Ibu Sari" },
        { jabatan: "Kaur Keuangan", nama: "Pak Rudi" },
      ],
    });

    expect(profil).toBeNull();
  });

  it("keeps legacy public profile data as a fallback without re-owning perangkat", () => {
    const profil = buildPublishedProfilSection(
      {},
      {
        website: "https://batukarut.desa.id",
        email: "halo@batukarut.desa.id",
        telepon: "022-87991234",
        luasWilayah: 12.4,
        jumlahDusun: 4,
        jumlahRt: 11,
        jumlahRw: 5,
        jumlahKk: 987,
        mataPencaharian: "Pertanian dan jasa lokal",
        potensiUnggulan: "Wisata sungai dan kopi rakyat",
        terakhirDiperbarui: new Date("2026-05-20T00:00:00.000Z"),
        aset: [
          {
            jenis: "kendaraan",
            nama: "Mobil siaga desa",
            lokasi: "Kantor Desa",
            nilai: 285_000_000,
            tahunBeli: 2021,
            kondisi: "sedang",
          },
        ],
        fasilitas: [],
        lembaga: [],
        perangkat: [{ jabatan: "Kepala Desa", nama: "Bapak Asep" }],
        historyBelanja: [],
        badge: {
          level: 3,
          label: "Data publik",
          deskripsi: "Fallback publik",
          warna: "indigo",
          icon: "info",
        },
      },
    );

    expect(profil?.aset).toHaveLength(1);
    expect(profil?.potensiUnggulan).toBe("Wisata sungai dan kopi rakyat");
    expect(profil?.perangkat).toBeUndefined();
  });

  it("merges kepala desa into published perangkat array without creating static filler", () => {
    const perangkat = toPublishedPerangkatDesaArray(
      [
        { jabatan: "Sekretaris Desa", nama: "Nana" },
        { jabatan: "Kaur Keuangan", nama: "Yudi" },
      ],
      "Bapak Asep",
    );

    expect(perangkat[0]).toMatchObject({
      jabatan: "Kepala Desa",
      nama: "Bapak Asep",
    });
    expect(perangkat).toHaveLength(3);
  });
});
