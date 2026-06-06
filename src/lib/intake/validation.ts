/**
 * Sprint 05 Batch 3 - Intake Validation
 *
 * Field-level validation rules from Sprint 05 Batch 2 (S05-007 Data Quality Rules).
 * Each rule returns `{ ok, message }`. Never throws.
 *
 * Guardrails:
 *  - pure function, no side effects, no DB access.
 */

import type { AiMappableDesaField, AiMappingFields } from "@/lib/admin-claim/ai-mapping";

export interface ValidationIssue {
  field: AiMappableDesaField;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  checkedAt: string;
}

function isYear(n: number): boolean {
  return n >= 1990 && n <= 2100;
}

export function validateField(
  field: AiMappableDesaField,
  value: AiMappingFields[AiMappableDesaField],
): ValidationIssue | null {
  if (value === null || value === undefined) return null;

  switch (field) {
    case "jumlahPenduduk": {
      const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d]/g, ""));
      if (!Number.isFinite(n) || n <= 0) {
        return { field, message: "Jumlah penduduk harus angka positif.", severity: "error" };
      }
      if (n > 100_000_000) {
        return { field, message: "Jumlah penduduk terlalu besar — periksa kembali.", severity: "warning" };
      }
      return null;
    }
    case "tahunData": {
      const y = typeof value === "number" ? value : Number(String(value).replace(/[^\d]/g, ""));
      if (!Number.isFinite(y) || !isYear(y)) {
        return { field, message: "Tahun data harus tahun yang valid (1990–2100).", severity: "error" };
      }
      return null;
    }
    case "websiteUrl": {
      const s = String(value);
      try {
        const u = new URL(s);
        if (!["http:", "https:"].includes(u.protocol)) {
          return { field, message: "URL harus menggunakan http atau https.", severity: "error" };
        }
        // Soft warn on non-official-looking domains (advisory only).
        const lowTrust = /\.(blogspot|wordpress|weebly|wix|github\.io|tumblr)\.com$/i.test(u.hostname);
        if (lowTrust) {
          return { field, message: "Domain ini bukan domain resmi desa — periksa ulang.", severity: "warning" };
        }
      } catch {
        return { field, message: "Website resmi harus URL yang valid.", severity: "error" };
      }
      return null;
    }
    case "kategori": {
      const s = String(value).trim();
      if (s.length < 2) {
        return { field, message: "Kategori terlalu pendek.", severity: "error" };
      }
      return null;
    }
    case "kecamatan":
    case "kabupaten":
    case "provinsi": {
      const s = String(value).trim();
      if (s.length < 2) {
        return { field, message: `Nama ${field} terlalu pendek.`, severity: "error" };
      }
      return null;
    }
    default:
      return null;
  }
}

// Shorthand for the AiMappableDesaField type locally so we don't need extra imports
type AiMappableDesaFieldLocal = AiMappableDesaField;

export function validateFields(fields: AiMappingFields): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const field of Object.keys(fields) as AiMappableDesaFieldLocal[]) {
    const issue = validateField(field, fields[field]);
    if (issue) issues.push(issue);
  }
  return {
    ok: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
