import { describe, expect, it } from "vitest";
import { buildTemplateDocumentCategories, isValidTemplateDocumentCategory } from "@/lib/admin-desa/document-categories";
import type { TemplateFieldEngineViewModel } from "@/lib/village-data/template-field-contract";

function templateWithComponents(componentKeys: string[]): TemplateFieldEngineViewModel {
  return {
    templateId: "tpl",
    templateKey: "TEMPLATE_TEST",
    templateName: "Template Test",
    visibleFieldCount: 0,
    totalFieldCount: 0,
    publishableCount: 0,
    visibleComponents: componentKeys.map((componentKey, index) => ({
      componentId: `cmp_${componentKey}`,
      componentKey,
      label: componentKey === "agenda_desa" ? "Agenda Desa" : componentKey,
      displayOrder: index + 1,
      fields: [],
    })),
    hiddenComponents: [],
  };
}

describe("admin desa document categories", () => {
  it("derives upload categories from the active template components", () => {
    const categories = buildTemplateDocumentCategories(
      templateWithComponents(["identitas", "agenda_desa"]),
    );

    expect(categories).toEqual([
      { value: "identitas", label: "identitas" },
      { value: "agenda_desa", label: "Agenda Desa" },
      { value: "LAINNYA", label: "Lainnya" },
    ]);
  });

  it("validates against template component categories and keeps fallback only for empty template", () => {
    const template = templateWithComponents(["agenda_desa"]);

    expect(isValidTemplateDocumentCategory("agenda_desa", template)).toBe(true);
    expect(isValidTemplateDocumentCategory("PROFIL_DESA", template)).toBe(false);
    expect(isValidTemplateDocumentCategory("LAINNYA", template)).toBe(true);
    expect(isValidTemplateDocumentCategory("PROFIL_DESA", templateWithComponents([]))).toBe(true);
  });
});
