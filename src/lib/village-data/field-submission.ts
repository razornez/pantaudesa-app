import type { EffectiveTemplateFieldEngine } from "@/lib/village-data/field-engine";

type UnknownRecord = Record<string, unknown>;
type CoercedFieldValue =
  | { ok: true; value: string | number | boolean | Record<string, unknown> | unknown[] | null }
  | { ok: false; error: string };

export interface SanitizedTemplateFieldValues {
  values: Record<string, string | number | boolean | Record<string, unknown> | unknown[] | null>;
  errors: string[];
}

function isRecord(input: unknown): input is UnknownRecord {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function coerceJsonField(rawValue: unknown): CoercedFieldValue {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return { ok: true as const, value: null };
  }
  if (Array.isArray(rawValue) || isRecord(rawValue)) {
    return { ok: true as const, value: rawValue };
  }
  if (typeof rawValue !== "string") {
    return { ok: false as const, error: "Field JSON harus berupa object, array, atau JSON string." };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed) || isRecord(parsed)) {
      return { ok: true as const, value: parsed };
    }
    return { ok: false as const, error: "Field JSON harus berupa object atau array." };
  } catch {
    return { ok: false as const, error: "Field JSON belum valid." };
  }
}

function coerceTemplateValue(valueType: string, rawValue: unknown): CoercedFieldValue {
  if (rawValue === null || rawValue === undefined) return { ok: true as const, value: null };

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed) return { ok: true as const, value: null };

    if (valueType === "number") {
      const numericValue = Number(trimmed);
      return Number.isFinite(numericValue)
        ? { ok: true as const, value: numericValue }
        : { ok: false as const, error: "Nilai harus berupa angka." };
    }

    if (valueType === "json") return coerceJsonField(trimmed);
    return { ok: true as const, value: trimmed };
  }

  if (valueType === "number") {
    return typeof rawValue === "number" && Number.isFinite(rawValue)
      ? { ok: true as const, value: rawValue }
      : { ok: false as const, error: "Nilai harus berupa angka." };
  }

  if (valueType === "json") return coerceJsonField(rawValue);

  if (typeof rawValue === "boolean") {
    return { ok: true as const, value: rawValue };
  }

  return { ok: true as const, value: String(rawValue) };
}

export function sanitizeTemplateFieldValues(input: {
  engine: EffectiveTemplateFieldEngine;
  rawValues: unknown;
}): SanitizedTemplateFieldValues {
  const source = isRecord(input.rawValues) ? input.rawValues : {};
  const values: SanitizedTemplateFieldValues["values"] = {};
  const errors: string[] = [];

  for (const field of input.engine.fields) {
    if (!Object.hasOwn(source, field.fieldKey)) continue;
    const coerced: CoercedFieldValue = coerceTemplateValue(field.valueType, source[field.fieldKey]);
    if (!coerced.ok) {
      errors.push(`${field.label}: ${coerced.error}`);
      continue;
    }
    if (coerced.value !== null) {
      values[field.fieldKey] = coerced.value;
    }
  }

  return { values, errors };
}
