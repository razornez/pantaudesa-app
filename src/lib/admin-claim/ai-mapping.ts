import type { Prisma } from "@/generated/prisma";

// Manual mapping draft scope (BMAD 04-008.0):
// AI provider NOT yet configured. Internal admin fills mapping fields manually by reading the document.
// Allowed safe fields only:
//   - profil desa
//   - kontak resmi
//   - website/sosial resmi
//   - alamat/kecamatan/kabupaten metadata
// Out of scope: APBDes/budget extraction, sensitive demographic, personal/private docs, auto-publish.

export const AI_MAPPABLE_DESA_FIELDS = [
  "websiteUrl",
  "kategori",
  "tahunData",
  "jumlahPenduduk",
  "kecamatan",
  "kabupaten",
  "provinsi",
] as const;

export type AiMappableDesaField = typeof AI_MAPPABLE_DESA_FIELDS[number];
export type AiMappingFieldValue = string | number | null;
export type AiMappingFields = Partial<Record<AiMappableDesaField, AiMappingFieldValue>>;

export interface AiMappingDraft {
  generatedAt: string;
  generator: "manual" | "ai";   // "manual" until AI provider is configured
  fields: AiMappingFields;
  notes?: string;
}

export const AI_MAPPABLE_DESA_SELECT = {
  websiteUrl: true,
  kategori: true,
  tahunData: true,
  jumlahPenduduk: true,
  kecamatan: true,
  kabupaten: true,
  provinsi: true,
} satisfies Pick<Prisma.DesaSelect, AiMappableDesaField>;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isMappingFieldValue(input: unknown): input is AiMappingFieldValue {
  return input === null || typeof input === "string" || typeof input === "number";
}

function sanitizeFieldValue(
  key: AiMappableDesaField,
  input: AiMappingFieldValue,
): AiMappingFieldValue | undefined {
  if (input === null) {
    return key === "websiteUrl" || key === "kategori" || key === "tahunData" || key === "jumlahPenduduk"
      ? null
      : undefined;
  }

  if (key === "tahunData" || key === "jumlahPenduduk") {
    const value = typeof input === "number" ? input : Number(input);
    return Number.isFinite(value) ? value : undefined;
  }

  return String(input);
}

/**
 * Returns an empty manual-mapping draft. The internal admin reads the document
 * and fills the fields manually in the publish modal.
 *
 * When an AI provider is configured (e.g. Claude API), replace this function's
 * body with the provider call while keeping the AiMappingDraft return shape stable.
 */
export function generateManualMappingDraft(): AiMappingDraft {
  return {
    generatedAt: new Date().toISOString(),
    generator: "manual",
    fields: {},
    notes:
      "AI provider belum dikonfigurasi — lakukan mapping manual. " +
      "Baca dokumen dan isi field yang relevan di bawah. " +
      "Semua perubahan harus direview sebelum dipublish.",
  };
}

/**
 * Validates that the mapping result only contains keys we explicitly allow.
 * Returns the sanitized fields object.
 */
export function sanitizeMappingFields(input: unknown): AiMappingFields {
  if (!isRecord(input)) return {};
  const out: AiMappingFields = {};
  for (const key of AI_MAPPABLE_DESA_FIELDS) {
    const v = input[key];
    if (v === undefined || !isMappingFieldValue(v)) continue;
    const sanitizedValue = sanitizeFieldValue(key, v);
    if (sanitizedValue !== undefined) out[key] = sanitizedValue;
    // Reject other types silently to prevent injection.
  }
  return out;
}

export function createAiMappingDraft(input: {
  generatedAt?: string;
  generator?: "manual" | "ai";
  fields?: unknown;
  notes?: string | undefined;
}): AiMappingDraft {
  const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : undefined;

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    generator: input.generator === "ai" ? "ai" : "manual",
    fields: sanitizeMappingFields(input.fields),
    ...(notes ? { notes } : {}),
  };
}

export function toAiMappingDraftJson(draft: AiMappingDraft): Prisma.InputJsonObject {
  return {
    generatedAt: draft.generatedAt,
    generator: draft.generator,
    fields: draft.fields,
    ...(draft.notes ? { notes: draft.notes } : {}),
  };
}

export function readAiMappingDraft(input: unknown): AiMappingDraft | null {
  if (!isRecord(input)) return null;

  if (isRecord(input.mapping)) {
    const fields = sanitizeMappingFields(input.mapping.fields);
    const generatedAt =
      typeof input.mapping.generatedAt === "string"
        ? input.mapping.generatedAt
        : new Date().toISOString();
    const notes =
      typeof input.notes === "string"
        ? input.notes
        : typeof input.guardrailNote === "string"
        ? input.guardrailNote
        : undefined;

    if (Object.keys(fields).length > 0 || notes) {
      return {
        generatedAt,
        generator: "manual",
        fields,
        ...(notes ? { notes } : {}),
      };
    }
  }

  const fields = sanitizeMappingFields(input.fields);
  const generatedAt =
    typeof input.generatedAt === "string" ? input.generatedAt : new Date().toISOString();
  const generator = input.generator === "ai" ? "ai" : "manual";
  const notes = typeof input.notes === "string" ? input.notes : undefined;

  if (Object.keys(fields).length === 0 && !notes) {
    return null;
  }

  return {
    generatedAt,
    generator,
    fields,
    ...(notes ? { notes } : {}),
  };
}

export function getMappingFieldKeys(fields: AiMappingFields): AiMappableDesaField[] {
  return AI_MAPPABLE_DESA_FIELDS.filter((field) => Object.hasOwn(fields, field));
}

export function createDesaMappingUpdateData(fields: AiMappingFields): Pick<
  Prisma.DesaUpdateInput,
  AiMappableDesaField
> {
  const data: Pick<Prisma.DesaUpdateInput, AiMappableDesaField> = {};

  for (const key of getMappingFieldKeys(fields)) {
    const value = fields[key] ?? null;
    switch (key) {
      case "websiteUrl":
        data.websiteUrl = value === null ? null : String(value);
        break;
      case "kategori":
        data.kategori = value === null ? null : String(value);
        break;
      case "tahunData":
        data.tahunData = value === null ? null : Number(value);
        break;
      case "jumlahPenduduk":
        data.jumlahPenduduk = value === null ? null : Number(value);
        break;
      case "kecamatan":
        if (value !== null) data.kecamatan = String(value);
        break;
      case "kabupaten":
        if (value !== null) data.kabupaten = String(value);
        break;
      case "provinsi":
        if (value !== null) data.provinsi = String(value);
        break;
    }
  }

  return data;
}
