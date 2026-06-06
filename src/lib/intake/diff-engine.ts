/**
 * Sprint 05 Batch 3 Completion Handoff - Structured Value Diff / Conflict Engine
 *
 * Compares the incoming mapped fields against current published village data
 * and produces human-readable diff entries for the review workbench.
 *
 * FIX APPLIED (Batch 3 Completion Handoff):
 * - Replaced jsondiffpatch dependency with pure manual scalar comparison.
 * - jsondiffpatch root array interpretation can be unreliable for simple scalar fields.
 * - Manual comparison is deterministic: prev === next -> unchanged,
 *   prev empty + next filled -> added, prev filled + next empty -> removed, else -> updated.
 *
 * Library: none (pure manual comparison - no external deps for diff).
 *
 * Guardrails:
 *  - pure function, no DB access, no side effects,
 *  - diff output is preview only — never auto-applies anything.
 */

import type { AiMappableDesaField, AiMappingFields } from "@/lib/admin-claim/ai-mapping";

export type DiffDeltaType = "added" | "removed" | "updated" | "unchanged";

export interface DiffEntry {
  field: AiMappableDesaField;
  deltaType: DiffDeltaType;
  previous?: string | number | null;
  next?: string | number | null;
  changed?: string;   // human-readable change label
}

export interface DiffResult {
  entries: DiffEntry[];
  hasChanges: boolean;
  addedCount: number;
  updatedCount: number;
  removedCount: number;
  generatedAt: string;
}

// Map field label for display
const FIELD_LABELS: Record<AiMappableDesaField, string> = {
  websiteUrl: "Website resmi",
  kategori: "Kategori desa",
  tahunData: "Tahun data",
  jumlahPenduduk: "Jumlah penduduk",
  kecamatan: "Kecamatan",
  kabupaten: "Kabupaten/Kota",
  provinsi: "Provinsi",
};

function fmt(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "(kosong)";
  return String(v);
}

/**
 * Determines the delta type for a single scalar field comparison.
 *
 * Rules (per Batch 3 completion handoff):
 * - previous equals next -> unchanged
 * - previous empty and next filled -> added
 * - previous filled and next empty -> removed
 * - otherwise -> updated
 */
function computeScalarDelta(
  prev: string | number | null | undefined,
  next: string | number | null | undefined,
): DiffDeltaType {
  const prevIsEmpty = prev === null || prev === undefined || prev === "";
  const nextIsEmpty = next === null || next === undefined || next === "";

  if (prevIsEmpty && nextIsEmpty) return "unchanged";
  if (prevIsEmpty && !nextIsEmpty) return "added";
  if (!prevIsEmpty && nextIsEmpty) return "removed";
  if (prev === next) return "unchanged";
  return "updated";
}

export function diffFields(
  current: Partial<Record<AiMappableDesaField, string | number | null>>,
  incoming: AiMappingFields,
): DiffResult {
  const entries: DiffEntry[] = [];
  let addedCount = 0;
  let updatedCount = 0;
  let removedCount = 0;

  for (const field of Object.keys(incoming) as AiMappableDesaField[]) {
    const next = incoming[field] ?? null;
    const prev = current[field] ?? null;

    const deltaType = computeScalarDelta(prev, next);

    if (deltaType === "added") addedCount++;
    else if (deltaType === "updated") updatedCount++;
    else if (deltaType === "removed") removedCount++;

    const changedLabel = (() => {
      if (deltaType === "unchanged") return undefined;
      if (deltaType === "added") return `${FIELD_LABELS[field]}: menambahkan "${fmt(next)}"`;
      if (deltaType === "removed") return `${FIELD_LABELS[field]}: menghapus "${fmt(prev)}"`;
      return `${FIELD_LABELS[field]}: "${fmt(prev)}" → "${fmt(next)}"`;
    })();

    entries.push({
      field,
      deltaType,
      previous: prev,
      next,
      changed: changedLabel,
    });
  }

  return {
    entries,
    hasChanges: addedCount + updatedCount + removedCount > 0,
    addedCount,
    updatedCount,
    removedCount,
    generatedAt: new Date().toISOString(),
  };
}
