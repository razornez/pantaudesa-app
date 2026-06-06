import type { DetailFieldCoverageEntry, DetailFieldCoverageSummary } from "./types";

type CoverageCounter = { covered: number; detected: number; total: number };
type CoverageField = { fieldKey: string; fieldLabel: string };

export interface CoverageLensModel {
  detected: number;
  detectedBySection: Map<string, { fields: CoverageField[] }>;
  hiddenByComponent: Map<string, { label: string; fields: CoverageField[] }>;
  hiddenCount: number;
  missing: number;
  outsideCount: number;
  outsideEntries: DetailFieldCoverageEntry[];
  publishable: number;
  sectionMap: Map<string, CoverageCounter>;
  templateInfo: DetailFieldCoverageSummary["templateInfo"];
  total: number;
}

export function buildCoverageLensModel(coverage: DetailFieldCoverageSummary): CoverageLensModel {
  const activeEntries = coverage.entries.filter(
    (entry) => entry.uploadedCoverageStatus !== "component_hidden" && entry.uploadedCoverageStatus !== "outside_template"
  );
  const publishable = activeEntries.filter((entry) => entry.uploadedCoverageStatus === "covered").length;
  const detected = activeEntries.filter((entry) => entry.uploadedCoverageStatus === "detected_not_publishable").length;
  const total = activeEntries.length;
  const missing = Math.max(0, total - publishable - detected);

  const hiddenCount = coverage.entries.filter((entry) => entry.uploadedCoverageStatus === "component_hidden").length;
  const outsideEntries = coverage.entries.filter((entry) => entry.uploadedCoverageStatus === "outside_template");
  const outsideCount = outsideEntries.length;

  const sectionMap = new Map<string, CoverageCounter>();
  for (const entry of activeEntries) {
    const key = entry.sectionLabel || entry.sectionKey;
    const bucket = sectionMap.get(key) ?? { covered: 0, detected: 0, total: 0 };
    bucket.total += 1;
    if (entry.uploadedCoverageStatus === "covered") bucket.covered += 1;
    else if (entry.uploadedCoverageStatus === "detected_not_publishable") bucket.detected += 1;
    sectionMap.set(key, bucket);
  }

  const hiddenByComponent = new Map<string, { label: string; fields: CoverageField[] }>();
  for (const entry of coverage.entries.filter((item) => item.uploadedCoverageStatus === "component_hidden")) {
    const bucket = hiddenByComponent.get(entry.sectionKey) ?? { label: entry.sectionLabel, fields: [] };
    bucket.fields.push({ fieldKey: entry.fieldKey, fieldLabel: entry.fieldLabel });
    hiddenByComponent.set(entry.sectionKey, bucket);
  }

  const detectedBySection = new Map<string, { fields: CoverageField[] }>();
  for (const entry of activeEntries.filter((item) => item.uploadedCoverageStatus === "detected_not_publishable")) {
    const key = entry.sectionLabel || entry.sectionKey;
    const bucket = detectedBySection.get(key) ?? { fields: [] };
    bucket.fields.push({ fieldKey: entry.fieldKey, fieldLabel: entry.fieldLabel });
    detectedBySection.set(key, bucket);
  }

  return {
    detected,
    detectedBySection,
    hiddenByComponent,
    hiddenCount,
    missing,
    outsideCount,
    outsideEntries,
    publishable,
    sectionMap,
    templateInfo: coverage.templateInfo,
    total,
  };
}
