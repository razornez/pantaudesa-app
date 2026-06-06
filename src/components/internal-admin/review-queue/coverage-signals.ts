import type { CoverageHiddenItem, CoverageOutsideItem, TemplateRibbonInfo } from "./types";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function readFieldCoverageSignals(raw: unknown): {
  componentHidden: CoverageHiddenItem[];
  outsideTemplate: CoverageOutsideItem[];
} {
  const empty = {
    componentHidden: [] as CoverageHiddenItem[],
    outsideTemplate: [] as CoverageOutsideItem[],
  };

  if (!isRecord(raw) || !isRecord(raw.fieldCoverage)) {
    return empty;
  }

  const entries = Array.isArray(raw.fieldCoverage.entries) ? raw.fieldCoverage.entries : [];

  return entries.reduce(
    (acc, entry) => {
      if (!isRecord(entry)) return acc;

      if (entry.uploadedCoverageStatus === "component_hidden") {
        acc.componentHidden.push({
          fieldLabel: typeof entry.fieldLabel === "string" ? entry.fieldLabel : "Field tidak dikenal",
          componentLabel: typeof entry.sectionLabel === "string" ? entry.sectionLabel : "Komponen tidak dikenal",
        });
      }

      if (entry.uploadedCoverageStatus === "outside_template") {
        acc.outsideTemplate.push({
          fieldLabel: typeof entry.fieldLabel === "string" ? entry.fieldLabel : "Field tidak dikenal",
          fieldKey: typeof entry.fieldKey === "string" ? entry.fieldKey : "unknown",
          uploadedValuePreview:
            typeof entry.uploadedValuePreview === "string" ? entry.uploadedValuePreview : "Tidak ada preview",
        });
      }

      return acc;
    },
    {
      componentHidden: [] as CoverageHiddenItem[],
      outsideTemplate: [] as CoverageOutsideItem[],
    }
  );
}

export function readTemplateRibbonInfo(raw: unknown): TemplateRibbonInfo | null {
  if (!isRecord(raw) || !isRecord(raw.fieldCoverage) || !isRecord(raw.fieldCoverage.templateInfo)) {
    return null;
  }

  const templateInfo = raw.fieldCoverage.templateInfo;
  return {
    templateName: typeof templateInfo.templateName === "string" ? templateInfo.templateName : "Template tidak dikenal",
    templateKey: typeof templateInfo.templateKey === "string" ? templateInfo.templateKey : "unknown",
    source: typeof templateInfo.source === "string" ? templateInfo.source : "fallback",
    visibleCount: typeof templateInfo.visibleComponentCount === "number" ? templateInfo.visibleComponentCount : 0,
    hiddenCount: typeof templateInfo.hiddenComponentCount === "number" ? templateInfo.hiddenComponentCount : 0,
  };
}
