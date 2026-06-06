import type {
  AsetDesa,
  BumdesInfo,
  FasilitasDesa,
  HistoryBelanja,
  LembagaDesa,
  OutputFisik,
  PerangkatDesa,
  ProfilDesa,
  RiwayatTahunan,
  SkorTransparansi,
} from "@/lib/types";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function readString(input: unknown) {
  return typeof input === "string" && input.trim().length > 0 ? input.trim() : null;
}

function readNumber(input: unknown) {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && input.trim().length > 0) {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isKepalaDesa(jabatan: string | undefined) {
  return typeof jabatan === "string" && /kepala desa/i.test(jabatan);
}

function hasPublishedProfilSignal(publishedValues: Record<string, unknown>) {
  return [
    "websiteUrl",
    "teleponDesa",
    "emailDesa",
    "kepalaDesa",
    "perangkatDesa",
    "jumlahDusun",
    "jumlahRt",
    "jumlahRw",
    "jumlahKK",
    "potensiUnggulan",
    "asetDesa",
    "fasilitasUmum",
    "lembagaDesa",
    "bumdes",
  ].some((key) => publishedValues[key] !== undefined && publishedValues[key] !== null);
}

function buildFallbackHistoryBelanja(
  publishedValues: Record<string, unknown>,
): HistoryBelanja[] {
  const tahun =
    readNumber(publishedValues.tahunData) ??
    new Date().getFullYear();
  const totalAnggaran = readNumber(publishedValues.totalAnggaran);
  const terealisasi = readNumber(publishedValues.terealisasi);
  const danaDesa = readNumber(publishedValues.danaDesa);
  const add = readNumber(publishedValues.add);
  const pades = readNumber(publishedValues.pades);
  const bantuanKeuangan = readNumber(publishedValues.bantuanKeuangan);

  const rows: HistoryBelanja[] = [];
  if (danaDesa !== null) {
    rows.push({
      tahun,
      semester: 1,
      kode: "4.1",
      uraian: "Pendanaan program dari Dana Desa",
      anggaran: danaDesa,
      realisasi: Math.round(danaDesa * 0.88),
      penyedia: "Kas Desa",
    });
  }
  if (add !== null) {
    rows.push({
      tahun,
      semester: 1,
      kode: "4.2",
      uraian: "Alokasi Dana Desa (ADD)",
      anggaran: add,
      realisasi: Math.round(add * 0.82),
      penyedia: "Kas Desa",
    });
  }
  if (pades !== null) {
    rows.push({
      tahun,
      semester: 2,
      kode: "4.3",
      uraian: "Pendapatan Asli Desa",
      anggaran: pades,
      realisasi: Math.round(pades * 0.76),
      penyedia: "BUMDes / PAD",
    });
  }
  if (bantuanKeuangan !== null) {
    rows.push({
      tahun,
      semester: 2,
      kode: "4.4",
      uraian: "Bantuan Keuangan Lainnya",
      anggaran: bantuanKeuangan,
      realisasi: Math.round(bantuanKeuangan * 0.8),
      penyedia: "Kabupaten / Provinsi",
    });
  }

  if (rows.length > 0) return rows;

  if (totalAnggaran !== null && terealisasi !== null) {
    return [
      {
        tahun,
        semester: 2,
        kode: "5.1",
        uraian: "Ringkasan belanja desa (contoh template)",
        anggaran: totalAnggaran,
        realisasi: terealisasi,
        penyedia: "Kas Desa",
      },
    ];
  }

  return [];
}

function buildFallbackProfil(
  publishedValues: Record<string, unknown>,
): ProfilDesa | undefined {
  if (!hasPublishedProfilSignal(publishedValues)) return undefined;

  return {
    website: readString(publishedValues.websiteUrl) ?? undefined,
    email: readString(publishedValues.emailDesa) ?? undefined,
    telepon: readString(publishedValues.teleponDesa) ?? undefined,
    luasWilayah: 12.4,
    luasSawah: 186,
    luasHutan: 94,
    jumlahDusun: readNumber(publishedValues.jumlahDusun) ?? 0,
    jumlahRt: readNumber(publishedValues.jumlahRt) ?? 0,
    jumlahRw: readNumber(publishedValues.jumlahRw) ?? 0,
    jumlahKk: readNumber(publishedValues.jumlahKK) ?? 0,
    mataPencaharian: "Pertanian hortikultura, UMKM desa, dan jasa lokal",
    potensiUnggulan:
      readString(publishedValues.potensiUnggulan) ?? "Potensi desa sedang diperkaya bertahap.",
    terakhirDiperbarui: new Date(),
    aset: toAsetDesaArray(publishedValues.asetDesa) ?? [],
    fasilitas: toFasilitasDesaArray(publishedValues.fasilitasUmum) ?? [],
    lembaga: toLembagaDesaArray(publishedValues.lembagaDesa) ?? [],
    perangkat: mergePublishedPerangkat(undefined, publishedValues.kepalaDesa),
    bumdes: toBumdesInfo(publishedValues.bumdes) ?? undefined,
    historyBelanja: buildFallbackHistoryBelanja(publishedValues),
    badge: {
      level: 3,
      label: "Template aktif",
      deskripsi: "Data contoh template tersedia untuk review publik.",
      warna: "indigo",
      icon: "info",
    },
  };
}

function toAsetDesaArray(input: unknown): AsetDesa[] | null {
  if (!Array.isArray(input)) return null;
  const items = input
    .filter(isRecord)
    .map((item) => {
      const nama = readString(item.nama);
      const lokasi = readString(item.lokasi);
      const jenis = readString(item.jenis) as AsetDesa["jenis"] | null;
      const nilai = readNumber(item.nilai);
      const tahunBeli = readNumber(item.tahunBeli);
      const kondisi = readString(item.kondisi) as AsetDesa["kondisi"] | null;
      if (!nama || !lokasi || !jenis || nilai === null || tahunBeli === null || !kondisi) {
        return null;
      }
      return {
        nama,
        lokasi,
        jenis,
        nilai,
        tahunBeli,
        kondisi,
      } satisfies AsetDesa;
    })
    .filter((item): item is AsetDesa => item !== null);

  return items.length > 0 ? items : null;
}

function toFasilitasDesaArray(input: unknown): FasilitasDesa[] | null {
  if (!Array.isArray(input)) return null;
  const items = input
    .filter(isRecord)
    .map((item): FasilitasDesa | null => {
      const nama = readString(item.nama);
      const jenis = readString(item.jenis) as FasilitasDesa["jenis"] | null;
      const jumlah = readNumber(item.jumlah);
      const kondisi = readString(item.kondisi) as FasilitasDesa["kondisi"] | null;
      const ket = readString(item.ket) ?? undefined;
      if (!nama || !jenis || jumlah === null || !kondisi) return null;
      return {
        nama,
        jenis,
        jumlah,
        kondisi,
        ...(ket ? { ket } : {}),
      };
    })
    .filter((item): item is FasilitasDesa => item !== null);

  return items.length > 0 ? items : null;
}

function toLembagaDesaArray(input: unknown): LembagaDesa[] | null {
  if (!Array.isArray(input)) return null;
  const items = input
    .filter(isRecord)
    .map((item): LembagaDesa | null => {
      const nama = readString(item.nama);
      const jenis = readString(item.jenis) as LembagaDesa["jenis"] | null;
      const ketua = readString(item.ketua);
      const anggota = readNumber(item.anggota);
      const tahunBerdiri = readNumber(item.tahunBerdiri);
      const aktif = typeof item.aktif === "boolean" ? item.aktif : null;
      const deskripsi = readString(item.deskripsi);
      const program = readString(item.program) ?? undefined;
      if (!nama || !jenis || !ketua || anggota === null || tahunBerdiri === null || aktif === null || !deskripsi) {
        return null;
      }
      return {
        nama,
        jenis,
        ketua,
        anggota,
        tahunBerdiri,
        aktif,
        deskripsi,
        ...(program ? { program } : {}),
      };
    })
    .filter((item): item is LembagaDesa => item !== null);

  return items.length > 0 ? items : null;
}

function toBumdesInfo(input: unknown): BumdesInfo | null {
  if (!isRecord(input)) return null;
  const nama = readString(input.nama);
  const bidangUsaha = readString(input.bidangUsaha);
  const tahunBerdiri = readNumber(input.tahunBerdiri);
  const modal = readNumber(input.modal);
  const status = readString(input.status) as BumdesInfo["status"] | null;
  const deskripsi = readString(input.deskripsi);
  const omsetPerTahun = readNumber(input.omsetPerTahun) ?? undefined;
  if (!nama || !bidangUsaha || tahunBerdiri === null || modal === null || !status || !deskripsi) {
    return null;
  }
  return {
    nama,
    bidangUsaha,
    tahunBerdiri,
    modal,
    status,
    deskripsi,
    omsetPerTahun,
  };
}

function toOutputFisikArray(input: unknown): OutputFisik[] | null {
  if (!Array.isArray(input)) return null;
  const items = input
    .filter(isRecord)
    .map((item) => {
      const label = readString(item.label);
      const satuan = readString(item.satuan);
      const target = readNumber(item.target);
      const realisasi = readNumber(item.realisasi);
      const persentase = readNumber(item.persentase);
      if (!label || !satuan || target === null || realisasi === null || persentase === null) {
        return null;
      }
      return {
        label,
        satuan,
        target,
        realisasi,
        persentase,
      } satisfies OutputFisik;
    })
    .filter((item): item is OutputFisik => item !== null);

  return items.length > 0 ? items : null;
}

function toRiwayatTahunanArray(input: unknown): RiwayatTahunan[] | null {
  if (!Array.isArray(input)) return null;
  const items = input
    .filter(isRecord)
    .map((item) => {
      const tahun = readNumber(item.tahun);
      const totalAnggaran = readNumber(item.totalAnggaran);
      const terealisasi = readNumber(item.terealisasi);
      const persentaseSerapan = readNumber(item.persentaseSerapan);
      if (
        tahun === null ||
        totalAnggaran === null ||
        terealisasi === null ||
        persentaseSerapan === null
      ) {
        return null;
      }
      return {
        tahun,
        totalAnggaran,
        terealisasi,
        persentaseSerapan,
      } satisfies RiwayatTahunan;
    })
    .filter((item): item is RiwayatTahunan => item !== null);

  return items.length > 0 ? items : null;
}

export function mergePublishedPerangkat(
  existingPerangkat: PerangkatDesa[] | undefined,
  publishedKepalaDesa: unknown,
): PerangkatDesa[] | undefined {
  const kepalaDesaName = readString(publishedKepalaDesa) ?? "";
  const perangkat = existingPerangkat ? [...existingPerangkat] : [];

  if (!kepalaDesaName) {
    return perangkat.length > 0 ? perangkat : existingPerangkat;
  }

  const kepalaDesaIndex = perangkat.findIndex((item) => isKepalaDesa(item.jabatan));
  if (kepalaDesaIndex >= 0) {
    perangkat[kepalaDesaIndex] = {
      ...perangkat[kepalaDesaIndex],
      nama: kepalaDesaName,
    };
    return perangkat;
  }

  return [{ jabatan: "Kepala Desa", nama: kepalaDesaName }, ...perangkat];
}

export function mergePublishedProfil(
  existingProfil: ProfilDesa | undefined,
  publishedValues: Record<string, unknown>,
): ProfilDesa | undefined {
  const base = existingProfil ?? buildFallbackProfil(publishedValues);
  if (!base) return existingProfil;

  return {
    ...base,
    website: readString(publishedValues.websiteUrl) ?? base.website,
    telepon: readString(publishedValues.teleponDesa) ?? base.telepon,
    email: readString(publishedValues.emailDesa) ?? base.email,
    jumlahDusun: readNumber(publishedValues.jumlahDusun) ?? base.jumlahDusun,
    jumlahRt: readNumber(publishedValues.jumlahRt) ?? base.jumlahRt,
    jumlahRw: readNumber(publishedValues.jumlahRw) ?? base.jumlahRw,
    jumlahKk: readNumber(publishedValues.jumlahKK) ?? base.jumlahKk,
    potensiUnggulan:
      readString(publishedValues.potensiUnggulan) ?? base.potensiUnggulan,
    aset: toAsetDesaArray(publishedValues.asetDesa) ?? base.aset,
    fasilitas:
      toFasilitasDesaArray(publishedValues.fasilitasUmum) ?? base.fasilitas,
    lembaga: toLembagaDesaArray(publishedValues.lembagaDesa) ?? base.lembaga,
    perangkat: mergePublishedPerangkat(base.perangkat, publishedValues.kepalaDesa),
    bumdes: toBumdesInfo(publishedValues.bumdes) ?? base.bumdes,
  };
}

export function mergePublishedOutputFisik(
  existingOutputFisik: OutputFisik[] | undefined,
  publishedOutputFisik: unknown,
): OutputFisik[] | undefined {
  return toOutputFisikArray(publishedOutputFisik) ?? existingOutputFisik;
}

export function mergePublishedRiwayat(
  existingRiwayat: RiwayatTahunan[] | undefined,
  publishedRiwayat: unknown,
): RiwayatTahunan[] | undefined {
  return toRiwayatTahunanArray(publishedRiwayat) ?? existingRiwayat;
}

export function mergePublishedSkorTransparansi(
  existingSkor: SkorTransparansi | undefined,
  publishedValues: Record<string, unknown>,
): SkorTransparansi | undefined {
  const total = readNumber(publishedValues.skorTransparansiTotal);
  const ketepatan = readNumber(publishedValues.skorKetepatan);
  const kelengkapan = readNumber(publishedValues.skorKelengkapan);
  const base = existingSkor ?? {
    total: 0,
    ketepatan: 0,
    kelengkapan: 0,
    responsif: 0,
    konsistensi: 0,
  };

  if (total === null && ketepatan === null && kelengkapan === null) {
    return existingSkor;
  }

  return {
    ...base,
    total: total ?? base.total,
    ketepatan: ketepatan ?? base.ketepatan,
    kelengkapan: kelengkapan ?? base.kelengkapan,
  };
}
