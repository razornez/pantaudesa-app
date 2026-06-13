export type RegisteredVillageComponentKey =
  | "identitas"
  | "demografi"
  | "perangkat"
  | "sumber_dokumen"
  | "transparansi"
  | "anggaran"
  | "pendapatan"
  | "kinerja"
  | "profil_desa"
  | "panduan_warga"
  | "suara_warga"
  | "agenda_desa";

export type ComponentRendererType =
  | "identity_grid"
  | "demography_metrics"
  | "perangkat_contacts"
  | "source_snapshot"
  | "transparency_metrics"
  | "budget_summary"
  | "pendapatan_breakdown"
  | "kinerja_breakdown"
  | "kelengkapan_tabs"
  | "citizen_guide"
  | "voice_preview"
  | "agenda_preview";

export type ComponentDetailSlot =
  | "first_view"
  | "sumber_dokumen"
  | "transparansi"
  | "ringkasan_anggaran"
  | "kinerja_anggaran"
  | "kelengkapan_desa"
  | "panduan_warga"
  | "suara_warga";

export type ComponentPreviewVariant =
  | "identity"
  | "demography"
  | "perangkat"
  | "source"
  | "transparency"
  | "budget"
  | "pendapatan"
  | "kinerja"
  | "kelengkapan"
  | "guide"
  | "voice"
  | "agenda";

export interface ComponentCatalogManifestField {
  fieldKey: string;
  label: string;
  valueType: string;
  isPublishableNow: boolean;
  displayOrder: number;
}

export interface ComponentCatalogManifestEntry {
  componentKey: RegisteredVillageComponentKey;
  label: string;
  description: string;
  componentType: string;
  isDefaultVisible: boolean;
  displayOrder: number;
  rendererType: ComponentRendererType;
  previewVariant: ComponentPreviewVariant;
  detailSlot: ComponentDetailSlot;
  navLabel?: string;
  anchorId?: string;
  publicGroupKey?: string | null;
  publicTabKey?: string | null;
  highlightFieldKeys?: string[];
  renderConfig?: Record<string, unknown>;
  fields: ComponentCatalogManifestField[];
}

export const DEFAULT_COMPONENT_CATALOG_MANIFEST: ComponentCatalogManifestEntry[] = [
  {
    componentKey: "identitas",
    label: "Identitas & Wilayah",
    description: "Informasi dasar identitas dan lokasi desa",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 1,
    rendererType: "identity_grid",
    previewVariant: "identity",
    detailSlot: "first_view",
    highlightFieldKeys: ["websiteUrl", "kategori", "tahunData"],
    fields: [
      { fieldKey: "websiteUrl", label: "Website resmi", valueType: "url", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "kategori", label: "Kategori desa", valueType: "string", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "idmScore", label: "Skor IDM", valueType: "number", isPublishableNow: true, displayOrder: 3 },
      { fieldKey: "idmIks", label: "IKS (Ketahanan Sosial)", valueType: "number", isPublishableNow: true, displayOrder: 4 },
      { fieldKey: "idmIke", label: "IKE (Ketahanan Ekonomi)", valueType: "number", isPublishableNow: true, displayOrder: 5 },
      { fieldKey: "idmIkl", label: "IKL (Ketahanan Lingkungan)", valueType: "number", isPublishableNow: true, displayOrder: 6 },
      { fieldKey: "tahunData", label: "Tahun data", valueType: "number", isPublishableNow: true, displayOrder: 7 },
      { fieldKey: "kecamatan", label: "Kecamatan", valueType: "string", isPublishableNow: true, displayOrder: 8 },
      { fieldKey: "kabupaten", label: "Kabupaten/Kota", valueType: "string", isPublishableNow: true, displayOrder: 9 },
      { fieldKey: "provinsi", label: "Provinsi", valueType: "string", isPublishableNow: true, displayOrder: 10 },
      { fieldKey: "geoLat", label: "Koordinat lintang", valueType: "number", isPublishableNow: true, displayOrder: 11 },
      { fieldKey: "geoLng", label: "Koordinat bujur", valueType: "number", isPublishableNow: true, displayOrder: 12 },
      { fieldKey: "topografi", label: "Topografi", valueType: "string", isPublishableNow: true, displayOrder: 13 },
    ],
  },
  {
    componentKey: "demografi",
    label: "Demografi",
    description: "Data kependudukan desa",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 2,
    rendererType: "demography_metrics",
    previewVariant: "demography",
    detailSlot: "first_view",
    highlightFieldKeys: ["jumlahPenduduk", "jumlahKK", "jumlahDusun"],
    fields: [
      { fieldKey: "jumlahPenduduk", label: "Jumlah penduduk", valueType: "number", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "jumlahKK", label: "Jumlah KK", valueType: "number", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "jumlahDusun", label: "Jumlah dusun", valueType: "number", isPublishableNow: true, displayOrder: 3 },
      { fieldKey: "jumlahRt", label: "Jumlah RT", valueType: "number", isPublishableNow: true, displayOrder: 4 },
      { fieldKey: "jumlahRw", label: "Jumlah RW", valueType: "number", isPublishableNow: true, displayOrder: 5 },
    ],
  },
  {
    componentKey: "perangkat",
    label: "Perangkat Desa",
    description: "Pejabat desa yang menjadi pihak pertama untuk ditanya warga",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 3,
    rendererType: "perangkat_contacts",
    previewVariant: "perangkat",
    detailSlot: "transparansi",
    highlightFieldKeys: ["kepalaDesa", "perangkatDesa"],
    fields: [
      { fieldKey: "kepalaDesa", label: "Nama kepala desa", valueType: "string", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "perangkatDesa", label: "Daftar perangkat desa", valueType: "json", isPublishableNow: true, displayOrder: 2 },
    ],
  },
  {
    componentKey: "sumber_dokumen",
    label: "Sumber & Dokumen",
    description: "Sumber publik dan dokumen pendukung desa",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 4,
    rendererType: "source_snapshot",
    previewVariant: "source",
    detailSlot: "sumber_dokumen",
    fields: [],
  },
  {
    componentKey: "transparansi",
    label: "Transparansi & Skor",
    description: "Skor transparansi inti yang ditayangkan ke publik",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 5,
    rendererType: "transparency_metrics",
    previewVariant: "transparency",
    detailSlot: "transparansi",
    highlightFieldKeys: [
      "skorTransparansiTotal",
      "skorKetepatan",
      "skorKelengkapan",
    ],
    fields: [
      { fieldKey: "skorTransparansiTotal", label: "Skor transparansi total", valueType: "number", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "skorKetepatan", label: "Ketepatan pelaporan", valueType: "number", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "skorKelengkapan", label: "Kelengkapan dokumen", valueType: "number", isPublishableNow: true, displayOrder: 3 },
    ],
  },
  {
    componentKey: "anggaran",
    label: "Anggaran & Realisasi",
    description: "Ringkasan anggaran dan realisasi belanja desa",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 6,
    rendererType: "budget_summary",
    previewVariant: "budget",
    detailSlot: "ringkasan_anggaran",
    highlightFieldKeys: ["totalAnggaran", "terealisasi", "persentaseSerapan"],
    fields: [
      { fieldKey: "totalAnggaran", label: "Total anggaran", valueType: "number", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "terealisasi", label: "Realisasi anggaran", valueType: "number", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "persentaseSerapan", label: "Persentase serapan", valueType: "number", isPublishableNow: true, displayOrder: 3 },
    ],
  },
  {
    componentKey: "pendapatan",
    label: "Sumber Pendapatan",
    description: "Rincian sumber pendapatan APBDes",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 7,
    rendererType: "pendapatan_breakdown",
    previewVariant: "pendapatan",
    detailSlot: "ringkasan_anggaran",
    highlightFieldKeys: ["danaDesa", "add", "pades", "bantuanKeuangan"],
    fields: [
      { fieldKey: "danaDesa", label: "Dana desa", valueType: "number", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "add", label: "ADD", valueType: "number", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "pades", label: "PADes", valueType: "number", isPublishableNow: true, displayOrder: 3 },
      { fieldKey: "bantuanKeuangan", label: "Bantuan keuangan", valueType: "number", isPublishableNow: true, displayOrder: 4 },
    ],
  },
  {
    componentKey: "kinerja",
    label: "Kinerja & Rincian APBDes",
    description: "Output fisik, rincian APBDes, dan riwayat anggaran",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 8,
    rendererType: "kinerja_breakdown",
    previewVariant: "kinerja",
    detailSlot: "kinerja_anggaran",
    highlightFieldKeys: ["outputFisik", "riwayatAPBDes", "apbdesItems"],
    fields: [
      { fieldKey: "outputFisik", label: "Output fisik", valueType: "json", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "riwayatAPBDes", label: "Riwayat anggaran", valueType: "json", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "apbdesItems", label: "Rincian APBDes", valueType: "json", isPublishableNow: true, displayOrder: 3 },
    ],
  },
  {
    componentKey: "profil_desa",
    label: "Profil & Kelengkapan Desa",
    description: "Kontak, potensi, profil wilayah, aset, fasilitas, lembaga, dan BUMDes",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 9,
    rendererType: "kelengkapan_tabs",
    previewVariant: "kelengkapan",
    detailSlot: "kelengkapan_desa",
    highlightFieldKeys: [
      "fasilitasUmum",
      "asetDesa",
      "lembagaDesa",
      "bumdes",
    ],
    fields: [
      { fieldKey: "teleponDesa", label: "Telepon desa", valueType: "string", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "emailDesa", label: "Email desa", valueType: "string", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "potensiUnggulan", label: "Potensi unggulan", valueType: "text", isPublishableNow: true, displayOrder: 3 },
      { fieldKey: "luasWilayah", label: "Luas wilayah", valueType: "number", isPublishableNow: true, displayOrder: 4 },
      { fieldKey: "mataPencaharian", label: "Mata pencaharian", valueType: "text", isPublishableNow: true, displayOrder: 5 },
      { fieldKey: "luasSawah", label: "Luas sawah", valueType: "number", isPublishableNow: true, displayOrder: 6 },
      { fieldKey: "luasHutan", label: "Luas hutan/kebun", valueType: "number", isPublishableNow: true, displayOrder: 7 },
      { fieldKey: "fasilitasUmum", label: "Fasilitas umum", valueType: "json", isPublishableNow: true, displayOrder: 8 },
      { fieldKey: "asetDesa", label: "Aset desa", valueType: "json", isPublishableNow: true, displayOrder: 9 },
      { fieldKey: "lembagaDesa", label: "Lembaga desa", valueType: "json", isPublishableNow: true, displayOrder: 10 },
      { fieldKey: "bumdes", label: "BUMDes", valueType: "json", isPublishableNow: true, displayOrder: 11 },
    ],
  },
  {
    componentKey: "panduan_warga",
    label: "Panduan Warga",
    description: "Panduan hak warga, langkah membaca, dan jalur tanya",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 10,
    rendererType: "citizen_guide",
    previewVariant: "guide",
    detailSlot: "panduan_warga",
    fields: [],
  },
  {
    componentKey: "suara_warga",
    label: "Suara Warga",
    description: "Cerita dan suara warga tentang kondisi desa",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 11,
    rendererType: "voice_preview",
    previewVariant: "voice",
    detailSlot: "suara_warga",
    fields: [],
  },
  {
    componentKey: "agenda_desa",
    label: "Agenda Desa",
    description: "Agenda kegiatan publik desa sebagai komponen opsional untuk uji template",
    componentType: "section",
    isDefaultVisible: true,
    displayOrder: 12,
    rendererType: "agenda_preview",
    previewVariant: "agenda",
    detailSlot: "panduan_warga",
    navLabel: "Agenda Desa",
    anchorId: "agenda-desa",
    publicGroupKey: "panduan_warga",
    publicTabKey: "agenda_desa",
    highlightFieldKeys: ["agendaDesa", "agendaRingkasan", "agendaKontak"],
    fields: [
      { fieldKey: "agendaDesa", label: "Daftar agenda desa", valueType: "json", isPublishableNow: true, displayOrder: 1 },
      { fieldKey: "agendaRingkasan", label: "Ringkasan agenda", valueType: "text", isPublishableNow: true, displayOrder: 2 },
      { fieldKey: "agendaKontak", label: "Kontak agenda", valueType: "string", isPublishableNow: true, displayOrder: 3 },
    ],
  },
];

export const DEFAULT_COMPONENT_CATALOG_BY_KEY = new Map(
  DEFAULT_COMPONENT_CATALOG_MANIFEST.map((component) => [component.componentKey, component]),
);

export const DEFAULT_PUBLISHED_TEMPLATE_FIELD_COUNT = DEFAULT_COMPONENT_CATALOG_MANIFEST.reduce(
  (sum, component) => sum + component.fields.length,
  0,
);

export const DEFAULT_COMPONENT_KEY_BY_FIELD_KEY = new Map(
  DEFAULT_COMPONENT_CATALOG_MANIFEST.flatMap((component) =>
    component.fields.map((field) => [field.fieldKey, component.componentKey] as const),
  ),
);
