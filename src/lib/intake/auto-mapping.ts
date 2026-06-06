/**
 * Sprint 05 Batch 3 - Auto Mapping Adapter
 *
 * Heuristic, regex-based mapping from extracted plain text to the MVP
 * mappable Desa fields (see Sprint 05 Batch 2 catalog).
 *
 * Out of scope:
 *  - APBDes/budget extraction,
 *  - personal/sensitive demographic data,
 *  - any AI/LLM call,
 *  - any DB write.
 *
 * Output:
 *  - `fields`: only fields the regex confidently matched,
 *  - `evidence`: short human-readable justification snippets per field,
 *  - `unmatched`: list of mappable fields the heuristic could not infer.
 */

import {
  AI_MAPPABLE_DESA_FIELDS,
  type AiMappableDesaField,
  type AiMappingFields,
} from "@/lib/admin-claim/ai-mapping";

export interface AutoMappingEvidence {
  field: AiMappableDesaField;
  matchedText: string;       // small snippet, never the full doc
  rule: string;              // short human-readable rule label
}

export interface AutoMappingResult {
  fields: AiMappingFields;
  evidence: AutoMappingEvidence[];
  unmatched: AiMappableDesaField[];
  source: string;
  generatedAt: string;
}

// Limit how much text we run regex on per call.
const MAX_INPUT_LEN = 50_000;
// Trim evidence snippets so logs and JSON stay small.
const SNIPPET_LEN = 120;

function snippet(input: string, indexStart: number, indexEnd: number): string {
  const half = Math.floor(SNIPPET_LEN / 2);
  const from = Math.max(0, indexStart - half);
  const to = Math.min(input.length, indexEnd + half);
  return input.slice(from, to).replace(/\s+/g, " ").trim();
}

function findFirst(text: string, pattern: RegExp): { value: string; raw: RegExpExecArray } | null {
  const m = pattern.exec(text);
  if (!m) return null;
  return { value: (m[1] ?? m[0]).trim(), raw: m };
}

function pushEvidence(
  out: AutoMappingEvidence[],
  field: AiMappableDesaField,
  text: string,
  raw: RegExpExecArray,
  rule: string,
): void {
  const start = raw.index;
  const end = raw.index + raw[0].length;
  out.push({ field, matchedText: snippet(text, start, end), rule });
}

function tryNumber(value: string): number | null {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function tryYear(value: string): number | null {
  const m = /(\b(19|20)\d{2}\b)/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 1990 && y <= 2100 ? y : null;
}

export function autoMapFromText(rawInput: string): AutoMappingResult {
  const text = (rawInput ?? "").slice(0, MAX_INPUT_LEN);
  const fields: AiMappingFields = {};
  const evidence: AutoMappingEvidence[] = [];

  // websiteUrl: first http(s) URL preferring desa-related domains.
  {
    const r = findFirst(text, /\bhttps?:\/\/[^\s<>"']+/i);
    if (r) {
      fields.websiteUrl = r.value;
      pushEvidence(evidence, "websiteUrl", text, r.raw, "first http(s) URL");
    }
  }

  // jumlahPenduduk: pattern like "jumlah penduduk: 1234 jiwa" or "Penduduk 1.234".
  {
    const r = findFirst(
      text,
      /jumlah\s+penduduk(?:\s+desa)?\s*[:=\-]?\s*([\d.,]+)\s*(?:jiwa|orang)?/i,
    );
    if (r) {
      const n = tryNumber(r.value);
      if (n !== null && n > 0) {
        fields.jumlahPenduduk = n;
        pushEvidence(evidence, "jumlahPenduduk", text, r.raw, "label 'jumlah penduduk'");
      }
    } else {
      const r2 = findFirst(text, /\bpenduduk\s*[:=\-]?\s*([\d.,]+)\s*(?:jiwa|orang)\b/i);
      if (r2) {
        const n = tryNumber(r2.value);
        if (n !== null && n > 0) {
          fields.jumlahPenduduk = n;
          pushEvidence(evidence, "jumlahPenduduk", text, r2.raw, "label 'penduduk ... jiwa/orang'");
        }
      }
    }
  }

  // tahunData: pattern like "data tahun 2024" or "tahun data 2024".
  {
    const r = findFirst(text, /(?:data\s+tahun|tahun\s+data|per\s+tahun)\s*[:=\-]?\s*((19|20)\d{2})/i);
    if (r) {
      const y = tryYear(r.value);
      if (y !== null) {
        fields.tahunData = y;
        pushEvidence(evidence, "tahunData", text, r.raw, "label 'data tahun' / 'tahun data'");
      }
    }
  }

  // kategori: pattern like "kategori: Mandiri" / "status desa: Maju".
  {
    const r = findFirst(text, /(?:kategori|status)\s+desa\s*[:=\-]\s*([A-Za-z][A-Za-z\s\-]{2,40})/i);
    if (r) {
      fields.kategori = r.value.trim();
      pushEvidence(evidence, "kategori", text, r.raw, "label 'kategori desa' / 'status desa'");
    }
  }

  // kecamatan / kabupaten / provinsi: simple "Kecamatan: X", "Kabupaten: Y", "Provinsi: Z".
  {
    const r = findFirst(text, /\bkecamatan\s*[:=\-]\s*([A-Za-z][A-Za-z\s\-]{2,60})/i);
    if (r) {
      fields.kecamatan = r.value.trim().replace(/\s+/g, " ");
      pushEvidence(evidence, "kecamatan", text, r.raw, "label 'kecamatan'");
    }
  }
  {
    const r = findFirst(text, /\b(?:kabupaten|kota)\s*[:=\-]\s*([A-Za-z][A-Za-z\s\-]{2,60})/i);
    if (r) {
      fields.kabupaten = r.value.trim().replace(/\s+/g, " ");
      pushEvidence(evidence, "kabupaten", text, r.raw, "label 'kabupaten/kota'");
    }
  }
  {
    const r = findFirst(text, /\bprovinsi\s*[:=\-]\s*([A-Za-z][A-Za-z\s\-]{2,60})/i);
    if (r) {
      fields.provinsi = r.value.trim().replace(/\s+/g, " ");
      pushEvidence(evidence, "provinsi", text, r.raw, "label 'provinsi'");
    }
  }

  const matched = new Set(evidence.map((e) => e.field));
  const unmatched = AI_MAPPABLE_DESA_FIELDS.filter((f) => !matched.has(f));

  return {
    fields,
    evidence,
    unmatched: [...unmatched],
    source: "heuristic-regex",
    generatedAt: new Date().toISOString(),
  };
}
