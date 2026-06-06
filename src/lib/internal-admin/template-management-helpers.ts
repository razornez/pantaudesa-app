import { DEFAULT_COMPONENT_CATALOG_BY_KEY } from "@/lib/village-data/component-catalog-manifest";
import type { RegisteredVillageComponentKey } from "@/lib/village-data/component-catalog-manifest";

export function isKnownTemplateComponentKey(
  input: string,
): input is RegisteredVillageComponentKey {
  return DEFAULT_COMPONENT_CATALOG_BY_KEY.has(input as RegisteredVillageComponentKey);
}

export function normalizeTemplateNameToKey(name: string): string {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

  return normalized || "TEMPLATE_BARU";
}

export function sanitizeTemplateComponentKeys(
  input: string[],
): RegisteredVillageComponentKey[] {
  const keys: RegisteredVillageComponentKey[] = [];
  for (const raw of input) {
    if (!isKnownTemplateComponentKey(raw)) continue;
    if (keys.includes(raw)) continue;
    keys.push(raw);
  }
  return keys;
}

export interface TemplateCompositionAnalysis {
  normalizedKeys: RegisteredVillageComponentKey[];
  duplicateKeys: RegisteredVillageComponentKey[];
  unknownKeys: string[];
}

export function analyzeTemplateCompositionInput(
  input: string[],
): TemplateCompositionAnalysis {
  const normalizedKeys: RegisteredVillageComponentKey[] = [];
  const duplicateKeys = new Set<RegisteredVillageComponentKey>();
  const unknownKeys: string[] = [];
  const seen = new Set<RegisteredVillageComponentKey>();

  for (const raw of input) {
    if (!isKnownTemplateComponentKey(raw)) {
      unknownKeys.push(raw);
      continue;
    }

    if (seen.has(raw)) {
      duplicateKeys.add(raw);
      continue;
    }

    seen.add(raw);
    normalizedKeys.push(raw);
  }

  return {
    normalizedKeys,
    duplicateKeys: [...duplicateKeys],
    unknownKeys,
  };
}
