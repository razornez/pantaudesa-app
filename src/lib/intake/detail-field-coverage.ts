import {
  AI_MAPPABLE_DESA_FIELDS,
  type AiMappableDesaField,
  type AiMappingFields,
} from "@/lib/admin-claim/ai-mapping";
import { getDesaByIdOrSlugWithFallback, type DesaListItem } from "@/lib/data/desa-read";
import type {
  CoverageTemplateInfo,
  CurrentValueStatus,
  DetailFieldCoverageEntry,
  DetailFieldCoverageSummary,
  DetectedDetailField,
  OpenAIResult,
  UnknownUsefulField,
  UploadedCoverageStatus,
} from "@/lib/intake/types";
import { DEFAULT_COMPONENT_KEY_BY_FIELD_KEY } from "@/lib/village-data/component-catalog-manifest";
import { buildRuntimeTemplateManifest } from "@/lib/village-data/runtime-template-manifest";
import type { ResolvedTemplate } from "@/lib/village-data/template-resolver";

// Maps DETAIL_FIELD_STANDARDS sectionKey → template componentKey(s)
const LEGACY_SECTION_TO_COMPONENT: Record<string, string[]> = {
  identitas:    ["identitas"],
  demografi:    ["demografi"],
  pemerintahan: ["profil_desa"],
  profil:       ["profil_desa"],
  dokumen:      ["sumber_dokumen", "transparansi"],
  anggaran:     ["anggaran", "pendapatan", "kinerja"],
};

function getOwnerComponentKeys(fieldKey: string, sectionKey: string): string[] {
  const ownerFromCatalog = DEFAULT_COMPONENT_KEY_BY_FIELD_KEY.get(fieldKey);
  if (ownerFromCatalog) return [ownerFromCatalog];
  return LEGACY_SECTION_TO_COMPONENT[sectionKey] ?? [sectionKey];
}

export type DetailFieldStandard = Omit<
  DetailFieldCoverageEntry,
  "currentValueStatus" | "currentValuePreview" | "uploadedCoverageStatus" | "uploadedValuePreview"
>;

const KNOWN_FIELD_KEYS = new Set<string>(AI_MAPPABLE_DESA_FIELDS);

export const DETAIL_FIELD_STANDARDS: DetailFieldStandard[] = [
  {
    sectionKey: "identitas",
    sectionLabel: "Identitas & wilayah",
    fieldKey: "websiteUrl",
    fieldLabel: "Website resmi",
    currentModelSource: "Desa.websiteUrl",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Sumber resmi desa / dokumen resmi",
    validationRequirement: "URL valid http/https",
  },
  {
    sectionKey: "identitas",
    sectionLabel: "Identitas & wilayah",
    fieldKey: "kategori",
    fieldLabel: "Kategori desa",
    currentModelSource: "Desa.kategori",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Dokumen profil / status desa",
    validationRequirement: "Teks kategori yang masuk akal",
  },
  {
    sectionKey: "identitas",
    sectionLabel: "Identitas & wilayah",
    fieldKey: "tahunData",
    fieldLabel: "Tahun data",
    currentModelSource: "Desa.tahunData",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Dokumen resmi yang menyebut periode data",
    validationRequirement: "Tahun valid 1990-2100",
  },
  {
    sectionKey: "demografi",
    sectionLabel: "Demografi",
    fieldKey: "jumlahPenduduk",
    fieldLabel: "Jumlah penduduk",
    currentModelSource: "Desa.jumlahPenduduk",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Dokumen statistik / profil desa",
    validationRequirement: "Angka positif",
  },
  {
    sectionKey: "identitas",
    sectionLabel: "Identitas & wilayah",
    fieldKey: "kecamatan",
    fieldLabel: "Kecamatan",
    currentModelSource: "Desa.kecamatan",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Dokumen resmi",
    validationRequirement: "Nama wilayah tidak kosong",
  },
  {
    sectionKey: "identitas",
    sectionLabel: "Identitas & wilayah",
    fieldKey: "kabupaten",
    fieldLabel: "Kabupaten/Kota",
    currentModelSource: "Desa.kabupaten",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Dokumen resmi",
    validationRequirement: "Nama wilayah tidak kosong",
  },
  {
    sectionKey: "identitas",
    sectionLabel: "Identitas & wilayah",
    fieldKey: "provinsi",
    fieldLabel: "Provinsi",
    currentModelSource: "Desa.provinsi",
    currentlyMappable: true,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "Dokumen resmi",
    validationRequirement: "Nama wilayah tidak kosong",
  },
  {
    sectionKey: "perangkat",
    sectionLabel: "Perangkat desa",
    fieldKey: "kepalaDesa",
    fieldLabel: "Nama kepala desa",
    currentModelSource: "PerangkatDesa[nama/jabatan]",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "SK perangkat / profil resmi desa",
    validationRequirement: "Nama + jabatan harus jelas",
  },
  {
    sectionKey: "perangkat",
    sectionLabel: "Perangkat desa",
    fieldKey: "perangkatDesa",
    fieldLabel: "Daftar perangkat desa",
    currentModelSource: "PerangkatDesa[]",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: true,
    shouldBeMappableInSprint05: true,
    deferredReason: null,
    sourceRequirement: "SK perangkat / struktur organisasi",
    validationRequirement: "Perlu nama, jabatan, dan review admin",
  },
  {
    sectionKey: "profil",
    sectionLabel: "Profil desa",
    fieldKey: "teleponDesa",
    fieldLabel: "Telepon desa",
    currentModelSource: "ProfilDesa.telepon",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Belum ada target publish resmi ke model fleksibel/public profile.",
    sourceRequirement: "Kontak resmi desa",
    validationRequirement: "Nomor kontak valid dan non-pribadi",
  },
  {
    sectionKey: "profil",
    sectionLabel: "Profil desa",
    fieldKey: "emailDesa",
    fieldLabel: "Email desa",
    currentModelSource: "ProfilDesa.email",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Belum ada target publish resmi ke model fleksibel/public profile.",
    sourceRequirement: "Email resmi desa",
    validationRequirement: "Email valid",
  },
  {
    sectionKey: "profil",
    sectionLabel: "Profil desa",
    fieldKey: "potensiUnggulan",
    fieldLabel: "Potensi unggulan",
    currentModelSource: "ProfilDesa.potensiUnggulan",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Perlu DataDesa fleksibel atau target publish yang lebih tepat.",
    sourceRequirement: "Profil / potensi desa",
    validationRequirement: "Perlu kategori dan sumber yang jelas",
  },
  {
    sectionKey: "dokumen",
    sectionLabel: "Dokumen & transparansi",
    fieldKey: "dokumenPublik",
    fieldLabel: "Dokumen publik",
    currentModelSource: "DokumenPublik[]",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Perlu pemetaan dokumen per item, bukan dipaksa ke field scalar.",
    sourceRequirement: "Judul, status, file/reference, sumber",
    validationRequirement: "Per item wajib title/status/source/file reference",
  },
  {
    sectionKey: "dokumen",
    sectionLabel: "Dokumen & transparansi",
    fieldKey: "skorTransparansi",
    fieldLabel: "Skor transparansi",
    currentModelSource: "Derived skor transparansi",
    currentlyMappable: false,
    aiDetectable: false,
    publishableNow: false,
    shouldBeMappableInSprint05: false,
    deferredReason: "Skor turunan dihitung sistem, bukan dipublish langsung dari intake dokumen.",
    sourceRequirement: "Turunan sistem",
    validationRequirement: "Tidak berlaku",
  },
  {
    sectionKey: "anggaran",
    sectionLabel: "Anggaran & realisasi",
    fieldKey: "totalAnggaran",
    fieldLabel: "Total anggaran",
    currentModelSource: "AnggaranDesaSummary.totalAnggaran",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Publish dari intake ke summary anggaran belum dibuka agar tidak salah model.",
    sourceRequirement: "APBDes / dokumen anggaran resmi",
    validationRequirement: "Perlu tahun dan sumber yang jelas",
  },
  {
    sectionKey: "anggaran",
    sectionLabel: "Anggaran & realisasi",
    fieldKey: "terealisasi",
    fieldLabel: "Realisasi anggaran",
    currentModelSource: "AnggaranDesaSummary.totalRealisasi",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Perlu review angka dan sinkronisasi ke summary anggaran.",
    sourceRequirement: "Dokumen realisasi resmi",
    validationRequirement: "Angka + tahun + sumber harus jelas",
  },
  {
    sectionKey: "anggaran",
    sectionLabel: "Anggaran & realisasi",
    fieldKey: "apbdesItems",
    fieldLabel: "Rincian APBDes",
    currentModelSource: "APBDesItem[]",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Butuh mapping item-per-item ke APBDesItem, bukan scalar publish langsung.",
    sourceRequirement: "Dokumen APBDes resmi",
    validationRequirement: "Per item perlu bidang, nilai, dan tahun",
  },
  {
    sectionKey: "profil",
    sectionLabel: "Profil desa",
    fieldKey: "fasilitasUmum",
    fieldLabel: "Fasilitas umum",
    currentModelSource: "ProfilDesa.fasilitas[]",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Perlu target model fleksibel atau relasi fasilitas yang lebih tepat.",
    sourceRequirement: "Profil/fasilitas resmi desa",
    validationRequirement: "Perlu label, jumlah, kondisi, dan sumber",
  },
  {
    sectionKey: "profil",
    sectionLabel: "Profil desa",
    fieldKey: "asetDesa",
    fieldLabel: "Aset desa",
    currentModelSource: "ProfilDesa.aset[]",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: false,
    deferredReason: "Perlu model aset yang lebih terstruktur dan sensitif terhadap detail nilai.",
    sourceRequirement: "Dokumen aset resmi",
    validationRequirement: "Per item perlu nama, nilai, tahun, kondisi",
  },
  {
    sectionKey: "profil",
    sectionLabel: "Profil desa",
    fieldKey: "bumdesNama",
    fieldLabel: "BUMDes",
    currentModelSource: "ProfilDesa.bumdes",
    currentlyMappable: false,
    aiDetectable: true,
    publishableNow: false,
    shouldBeMappableInSprint05: true,
    deferredReason: "Belum ada target publish resmi ke profile fleksibel.",
    sourceRequirement: "Profil / dokumen BUMDes resmi",
    validationRequirement: "Perlu nama, status, dan sumber",
  },
];

function formatPreviewValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Belum terisi";
  }

  return String(value);
}

function formatArrayCount(label: string, count: number | undefined): string {
  if (!count || count <= 0) return "Belum terisi";
  return `${count} ${label}`;
}

function getKnownFieldValue(
  fieldKey: string,
  currentKnownFields: Partial<Record<AiMappableDesaField, string | number | null>>,
  desa: DesaListItem | null,
): string | number | null | undefined {
  switch (fieldKey) {
    case "websiteUrl":
      return currentKnownFields.websiteUrl ?? desa?.profil?.website ?? null;
    case "kategori":
      return currentKnownFields.kategori ?? desa?.kategori ?? null;
    case "tahunData":
      return currentKnownFields.tahunData ?? desa?.tahun ?? null;
    case "jumlahPenduduk":
      return currentKnownFields.jumlahPenduduk ?? desa?.penduduk ?? null;
    case "kecamatan":
      return currentKnownFields.kecamatan ?? desa?.kecamatan ?? null;
    case "kabupaten":
      return currentKnownFields.kabupaten ?? desa?.kabupaten ?? null;
    case "provinsi":
      return currentKnownFields.provinsi ?? desa?.provinsi ?? null;
    default:
      return undefined;
  }
}

function getCurrentValueForStandard(
  standard: DetailFieldStandard,
  desa: DesaListItem | null,
  currentKnownFields: Partial<Record<AiMappableDesaField, string | number | null>>,
): { status: CurrentValueStatus; preview: string } {
  const knownValue = getKnownFieldValue(standard.fieldKey, currentKnownFields, desa);
  if (knownValue !== undefined) {
    return {
      status: knownValue === null || knownValue === "" ? "empty" : "filled",
      preview: formatPreviewValue(knownValue),
    };
  }

  switch (standard.fieldKey) {
    case "kepalaDesa": {
      const kepalaDesa = desa?.perangkat?.find((item) => /kepala desa/i.test(item.jabatan));
      return kepalaDesa
        ? { status: "filled", preview: kepalaDesa.nama }
        : { status: "empty", preview: "Belum terisi" };
    }
    case "perangkatDesa":
      return desa?.perangkat?.length
        ? { status: "filled", preview: formatArrayCount("perangkat", desa.perangkat.length) }
        : { status: "empty", preview: "Belum terisi" };
    case "teleponDesa":
      return desa?.profil?.telepon
        ? { status: "filled", preview: desa.profil.telepon }
        : { status: "empty", preview: "Belum terisi" };
    case "emailDesa":
      return desa?.profil?.email
        ? { status: "filled", preview: desa.profil.email }
        : { status: "empty", preview: "Belum terisi" };
    case "potensiUnggulan":
      return desa?.profil?.potensiUnggulan
        ? { status: "filled", preview: desa.profil.potensiUnggulan }
        : { status: "empty", preview: "Belum terisi" };
    case "dokumenPublik":
      return desa?.dokumen?.length
        ? { status: "filled", preview: formatArrayCount("dokumen", desa.dokumen.length) }
        : { status: "empty", preview: "Belum terisi" };
    case "skorTransparansi":
      return desa?.skorTransparansi
        ? { status: "filled", preview: `${desa.skorTransparansi.total} / 100` }
        : { status: "empty", preview: "Belum terisi" };
    case "totalAnggaran":
      return desa?.totalAnggaran
        ? { status: "filled", preview: `Rp ${desa.totalAnggaran.toLocaleString("id-ID")}` }
        : { status: "empty", preview: "Belum terisi" };
    case "terealisasi":
      return desa?.terealisasi
        ? { status: "filled", preview: `Rp ${desa.terealisasi.toLocaleString("id-ID")}` }
        : { status: "empty", preview: "Belum terisi" };
    case "apbdesItems":
      return desa?.apbdes?.length
        ? { status: "filled", preview: formatArrayCount("item APBDes", desa.apbdes.length) }
        : { status: "empty", preview: "Belum terisi" };
    case "fasilitasUmum":
      return desa?.profil?.fasilitas?.length
        ? { status: "filled", preview: formatArrayCount("fasilitas", desa.profil.fasilitas.length) }
        : { status: "empty", preview: "Belum terisi" };
    case "asetDesa":
      return desa?.profil?.aset?.length
        ? { status: "filled", preview: formatArrayCount("aset", desa.profil.aset.length) }
        : { status: "empty", preview: "Belum terisi" };
    case "bumdesNama":
      return desa?.profil?.bumdes?.nama
        ? { status: "filled", preview: desa.profil.bumdes.nama }
        : { status: "empty", preview: "Belum terisi" };
    default:
      return { status: "empty", preview: "Belum terisi" };
  }
}

function compactSnippet(value: string, max = 120): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}...`;
}

function appendDetectedField(
  items: DetectedDetailField[],
  next: DetectedDetailField,
): void {
  const key = `${next.sectionKey}:${next.fieldKey}:${next.value.toLowerCase()}`;
  if (items.some((item) => `${item.sectionKey}:${item.fieldKey}:${item.value.toLowerCase()}` === key)) {
    return;
  }

  items.push(next);
}

function appendUnknownField(items: UnknownUsefulField[], next: UnknownUsefulField): void {
  const key = `${next.label.toLowerCase()}:${next.value.toLowerCase()}`;
  if (items.some((item) => `${item.label.toLowerCase()}:${item.value.toLowerCase()}` === key)) {
    return;
  }

  items.push(next);
}

export function detectLocalFlexibleSignals(rawText: string): {
  detectedButNotPublishable: DetectedDetailField[];
  unknownUsefulFields: UnknownUsefulField[];
} {
  const text = rawText.slice(0, 50_000);
  const detectedButNotPublishable: DetectedDetailField[] = [];
  const unknownUsefulFields: UnknownUsefulField[] = [];

  const patterns: Array<{
    regex: RegExp;
    build: (match: RegExpExecArray) => DetectedDetailField;
  }> = [
    {
      regex: /(?:telepon|telp|kontak)\s*[:=-]?\s*([\d+\-\s()]{6,30})/i,
      build: (match) => ({
        sectionKey: "profil",
        sectionLabel: "Profil desa",
        fieldKey: "teleponDesa",
        fieldLabel: "Telepon desa",
        value: match[1]?.trim() ?? "",
        reason: "Belum ada target publish resmi ke model fleksibel/public profile.",
        sourceRequirement: "Kontak resmi desa",
        validationRequirement: "Nomor kontak valid dan non-pribadi",
        evidenceSnippet: compactSnippet(match[0] ?? ""),
      }),
    },
    {
      regex: /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i,
      build: (match) => ({
        sectionKey: "profil",
        sectionLabel: "Profil desa",
        fieldKey: "emailDesa",
        fieldLabel: "Email desa",
        value: match[1]?.trim() ?? "",
        reason: "Belum ada target publish resmi ke model fleksibel/public profile.",
        sourceRequirement: "Email resmi desa",
        validationRequirement: "Email valid",
        evidenceSnippet: compactSnippet(match[0] ?? ""),
      }),
    },
    {
      regex: /potensi(?:\s+unggulan)?\s*[:=-]?\s*([^\n]{4,140})/i,
      build: (match) => ({
        sectionKey: "profil",
        sectionLabel: "Profil desa",
        fieldKey: "potensiUnggulan",
        fieldLabel: "Potensi unggulan",
        value: match[1]?.trim() ?? "",
        reason: "Perlu DataDesa fleksibel atau target publish yang lebih tepat.",
        sourceRequirement: "Profil / potensi desa",
        validationRequirement: "Perlu kategori dan sumber yang jelas",
        evidenceSnippet: compactSnippet(match[0] ?? ""),
      }),
    },
    {
      regex: /bumdes\s*[:=-]?\s*([^\n]{3,120})/i,
      build: (match) => ({
        sectionKey: "profil",
        sectionLabel: "Profil desa",
        fieldKey: "bumdesNama",
        fieldLabel: "BUMDes",
        value: match[1]?.trim() ?? "",
        reason: "Belum ada target publish resmi ke profile fleksibel.",
        sourceRequirement: "Profil / dokumen BUMDes resmi",
        validationRequirement: "Perlu nama, status, dan sumber",
        evidenceSnippet: compactSnippet(match[0] ?? ""),
      }),
    },
  ];

  for (const pattern of patterns) {
    const match = pattern.regex.exec(text);
    if (!match) continue;
    appendDetectedField(detectedButNotPublishable, pattern.build(match));
  }

  const keywordSignals: Array<{
    pattern: RegExp;
    label: string;
    possibleCategory: string;
  }> = [
    { pattern: /\b(apbdes|realisasi anggaran|dana desa)\b/i, label: "Indikasi dokumen anggaran", possibleCategory: "anggaran" },
    { pattern: /\b(sekolah|puskesmas|posyandu|pasar|masjid|gereja)\b/i, label: "Indikasi fasilitas umum", possibleCategory: "fasilitas" },
    { pattern: /\b(blt|bantuan langsung tunai)\b/i, label: "Indikasi program BLT", possibleCategory: "anggaran" },
  ];

  for (const signal of keywordSignals) {
    const match = signal.pattern.exec(text);
    if (!match) continue;
    appendUnknownField(unknownUsefulFields, {
      label: signal.label,
      value: compactSnippet(match[0] ?? ""),
      possibleCategory: signal.possibleCategory,
      evidenceSnippet: compactSnippet(match[0] ?? ""),
    });
  }

  return {
    detectedButNotPublishable,
    unknownUsefulFields,
  };
}

function findDetectedMatch(
  standard: DetailFieldStandard,
  detected: DetectedDetailField[],
): DetectedDetailField | null {
  return (
    detected.find((item) => item.fieldKey === standard.fieldKey) ??
    detected.find(
      (item) => item.sectionKey === standard.sectionKey && item.fieldLabel === standard.fieldLabel,
    ) ??
    null
  );
}

// Lookup map for cross-referencing DB template fields with hardcoded metadata
const STANDARDS_BY_KEY = new Map(DETAIL_FIELD_STANDARDS.map(s => [s.fieldKey, s]));

function buildEntryFromDbField(input: {
  fieldKey: string;
  fieldLabel: string;
  componentKey: string;
  componentLabel: string;
  isPublishableNow: boolean;
  uploadedCoverageStatus: UploadedCoverageStatus;
  uploadedValuePreview: string | null;
  currentValueStatus: CurrentValueStatus;
  currentValuePreview: string;
}): DetailFieldCoverageEntry {
  // Cross-reference with hardcoded metadata where available
  const meta = STANDARDS_BY_KEY.get(input.fieldKey);
  return {
    sectionKey:   input.componentKey,
    sectionLabel: input.componentLabel,
    fieldKey:     input.fieldKey,
    fieldLabel:   input.fieldLabel,
    currentModelSource:       meta?.currentModelSource       ?? "DataDesa",
    currentlyMappable:        meta?.currentlyMappable        ?? false,
    aiDetectable:             meta?.aiDetectable             ?? false,
    publishableNow:           input.isPublishableNow,
    shouldBeMappableInSprint05: meta?.shouldBeMappableInSprint05 ?? false,
    deferredReason:           meta?.deferredReason           ?? null,
    sourceRequirement:        meta?.sourceRequirement        ?? "Sumber resmi desa",
    validationRequirement:    meta?.validationRequirement    ?? "Nilai harus valid",
    currentValueStatus:       input.currentValueStatus,
    currentValuePreview:      input.currentValuePreview,
    uploadedCoverageStatus:   input.uploadedCoverageStatus,
    uploadedValuePreview:     input.uploadedValuePreview,
  };
}

export async function buildDetailFieldCoverageSummary(input: {
  desaId?: string;
  currentKnownFields: Partial<Record<AiMappableDesaField, string | number | null>>;
  mappedFields: AiMappingFields;
  extractedText: string;
  openaiResult?: OpenAIResult | null;
  resolvedTemplate?: ResolvedTemplate | null;
}): Promise<DetailFieldCoverageSummary> {
  const desa = input.desaId ? await getDesaByIdOrSlugWithFallback(input.desaId) : null;
  const localSignals = detectLocalFlexibleSignals(input.extractedText);
  const detectedButNotPublishable: DetectedDetailField[] = [];
  const unknownUsefulFields: UnknownUsefulField[] = [];

  for (const item of localSignals.detectedButNotPublishable) appendDetectedField(detectedButNotPublishable, item);
  for (const item of input.openaiResult?.detectedButNotPublishable ?? []) appendDetectedField(detectedButNotPublishable, item);
  for (const item of localSignals.unknownUsefulFields) appendUnknownField(unknownUsefulFields, item);
  for (const item of input.openaiResult?.unknownUsefulFields ?? []) appendUnknownField(unknownUsefulFields, item);

  const resolved = input.resolvedTemplate;
  const useDbTemplate = resolved && resolved.templateId !== "fallback" && resolved.visibleComponents.length > 0;
  const runtimeManifest = resolved ? buildRuntimeTemplateManifest(resolved) : null;

  // ── Branch A: DB template available ──────────────────────────────────────────
  if (useDbTemplate && runtimeManifest) {
    const entries: DetailFieldCoverageEntry[] = [];

    // All fieldKeys in template (visible + hidden) — for outside_template detection
    const allTemplateFieldKeys = new Set<string>(
      runtimeManifest.components.flatMap((component) =>
        component.fields.map((field) => field.fieldKey),
      ),
    );

    // Entries for VISIBLE component fields
    for (const component of runtimeManifest.visibleComponents) {
      for (const field of component.fields) {
        const knownMappedValue = KNOWN_FIELD_KEYS.has(field.fieldKey)
          ? input.mappedFields[field.fieldKey as AiMappableDesaField]
          : undefined;
        const detectedMatch = findDetectedMatch(
          { fieldKey: field.fieldKey, fieldLabel: field.label, sectionKey: component.componentKey, sectionLabel: component.label } as DetailFieldStandard,
          detectedButNotPublishable
        );
        const currentValue = getCurrentValueForStandard(
          STANDARDS_BY_KEY.get(field.fieldKey) ?? { fieldKey: field.fieldKey, fieldLabel: field.label, sectionKey: component.componentKey, sectionLabel: component.label } as DetailFieldStandard,
          desa, input.currentKnownFields
        );

        let uploadedCoverageStatus: UploadedCoverageStatus = "missing";
        let uploadedValuePreview: string | null = null;

        if (knownMappedValue !== undefined) {
          uploadedCoverageStatus = "covered";
          uploadedValuePreview = formatPreviewValue(knownMappedValue);
        } else if (detectedMatch) {
          uploadedCoverageStatus = "detected_not_publishable";
          uploadedValuePreview = detectedMatch.value;
        }

        entries.push(buildEntryFromDbField({
          fieldKey: field.fieldKey, fieldLabel: field.label,
          componentKey: component.componentKey, componentLabel: component.label,
          isPublishableNow: field.isPublishableNow,
          uploadedCoverageStatus, uploadedValuePreview,
          currentValueStatus: currentValue.status, currentValuePreview: currentValue.preview,
        }));
      }
    }

    // Entries for HIDDEN component fields come from the same runtime contract.
    for (const component of runtimeManifest.hiddenComponents) {
      for (const field of component.fields) {
        if (entries.some((entry) => entry.fieldKey === field.fieldKey)) continue;

        const currentValue = getCurrentValueForStandard(
          STANDARDS_BY_KEY.get(field.fieldKey) ??
            ({
              fieldKey: field.fieldKey,
              fieldLabel: field.label,
              sectionKey: component.componentKey,
              sectionLabel: component.label,
            } as DetailFieldStandard),
          desa,
          input.currentKnownFields,
        );
        entries.push(buildEntryFromDbField({
          fieldKey: field.fieldKey,
          fieldLabel: field.label,
          componentKey: component.componentKey,
          componentLabel: component.label,
          isPublishableNow: field.isPublishableNow,
          uploadedCoverageStatus: "component_hidden",
          uploadedValuePreview: null,
          currentValueStatus: currentValue.status,
          currentValuePreview: currentValue.preview,
        }));
      }
    }

    // Synthetic entries for OUTSIDE_TEMPLATE detected fields
    for (const detected of detectedButNotPublishable) {
      if (allTemplateFieldKeys.has(detected.fieldKey)) continue; // already covered above
      if (entries.some(e => e.fieldKey === detected.fieldKey)) continue;
      entries.push({
        sectionKey: "outside_template",
        sectionLabel: "Di luar template",
        fieldKey: detected.fieldKey,
        fieldLabel: detected.fieldLabel,
        currentModelSource: "—",
        currentlyMappable: false,
        aiDetectable: true,
        publishableNow: false,
        shouldBeMappableInSprint05: false,
        deferredReason: "Field ini tidak ada di template aktif desa ini.",
        sourceRequirement: detected.sourceRequirement,
        validationRequirement: detected.validationRequirement,
        currentValueStatus: "empty",
        currentValuePreview: "—",
        uploadedCoverageStatus: "outside_template",
        uploadedValuePreview: detected.value,
      });
    }

    const templateInfo: CoverageTemplateInfo = {
      templateKey:            resolved.templateKey,
      templateName:           resolved.templateName,
      source:                 "db",
      visibleComponentCount:  runtimeManifest.visibleComponents.length,
      hiddenComponentCount:   runtimeManifest.hiddenComponents.length,
      totalFieldCount:        runtimeManifest.visibleFieldCount,
    };

    return {
      entries,
      filledCount:                  entries.filter(e => e.currentValueStatus === "filled").length,
      emptyCount:                   entries.filter(e => e.currentValueStatus === "empty").length,
      coveredCount:                 entries.filter(e => e.uploadedCoverageStatus === "covered").length,
      detectedNotPublishableCount:  entries.filter(e => e.uploadedCoverageStatus === "detected_not_publishable").length,
      publishableNowCount:          entries.filter(e => e.publishableNow).length,
      detectedButNotPublishable,
      unknownUsefulFields,
      templateInfo,
    };
  }

  // ── Branch B: Fallback — hardcoded DETAIL_FIELD_STANDARDS ────────────────────
  const hiddenComponentKeys = new Set<string>(
    resolved?.hiddenComponents.map(c => c.componentKey) ?? []
  );
  const isSectionHidden = (sectionKey: string) => {
    const componentKeys = getOwnerComponentKeys("__section__", sectionKey);
    return componentKeys.some(k => hiddenComponentKeys.has(k));
  };

  const entries: DetailFieldCoverageEntry[] = DETAIL_FIELD_STANDARDS.map((standard) => {
    const currentValue = getCurrentValueForStandard(standard, desa, input.currentKnownFields);
    const knownMappedValue = KNOWN_FIELD_KEYS.has(standard.fieldKey)
      ? input.mappedFields[standard.fieldKey as AiMappableDesaField]
      : undefined;
    const detectedMatch = findDetectedMatch(standard, detectedButNotPublishable);

    let uploadedCoverageStatus: UploadedCoverageStatus = "missing";
    let uploadedValuePreview: string | null = null;

    if (isSectionHidden(standard.sectionKey)) {
      uploadedCoverageStatus = "component_hidden";
    } else if (knownMappedValue !== undefined) {
      uploadedCoverageStatus = "covered";
      uploadedValuePreview = formatPreviewValue(knownMappedValue);
    } else if (detectedMatch) {
      uploadedCoverageStatus = "detected_not_publishable";
      uploadedValuePreview = detectedMatch.value;
    }

    return {
      ...standard,
      currentValueStatus: currentValue.status,
      currentValuePreview: currentValue.preview,
      uploadedCoverageStatus,
      uploadedValuePreview,
    };
  });

  const fallbackTemplateInfo: CoverageTemplateInfo = {
    templateKey:           "DETAIL_FIELD_STANDARDS_FALLBACK",
    templateName:          "Standar Fallback (DB template belum tersedia)",
    source:                "fallback",
    visibleComponentCount: 0,
    hiddenComponentCount:  0,
    totalFieldCount:       DETAIL_FIELD_STANDARDS.length,
  };

  return {
    entries,
    filledCount:                  entries.filter(e => e.currentValueStatus === "filled").length,
    emptyCount:                   entries.filter(e => e.currentValueStatus === "empty").length,
    coveredCount:                 entries.filter(e => e.uploadedCoverageStatus === "covered").length,
    detectedNotPublishableCount:  entries.filter(e => e.uploadedCoverageStatus === "detected_not_publishable").length,
    publishableNowCount:          entries.filter(e => e.publishableNow).length,
    detectedButNotPublishable,
    unknownUsefulFields,
    templateInfo: fallbackTemplateInfo,
  };
}

export function buildDetailFieldRegistryPrompt(): string {
  return DETAIL_FIELD_STANDARDS.map((entry) => {
    const publishState = entry.publishableNow ? "publishable_now" : "not_publishable_now";
    return [
      `[${entry.sectionLabel}]`,
      `fieldKey=${entry.fieldKey}`,
      `fieldLabel=${entry.fieldLabel}`,
      `source=${entry.currentModelSource}`,
      `publishState=${publishState}`,
      `aiDetectable=${entry.aiDetectable ? "yes" : "no"}`,
      `sourceRequirement=${entry.sourceRequirement}`,
      `validationRequirement=${entry.validationRequirement}`,
      `deferredReason=${entry.deferredReason ?? "-"}`,
    ].join(" | ");
  }).join("\n");
}
