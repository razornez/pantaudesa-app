import { describe, expect, it, vi } from "vitest";
import { createActiveTemplateFieldBindingMap, type EffectiveTemplateFieldEngine } from "@/lib/village-data/field-engine";

vi.mock("@/lib/village-data/template-resolver", () => ({
  resolveDesaTemplate: vi.fn(),
}));

describe("createActiveTemplateFieldBindingMap", () => {
  it("maps field keys to the active template component and field-standard ids", () => {
    const engine: EffectiveTemplateFieldEngine = {
      resolvedTemplate: {
        templateId: "tpl_current",
        templateKey: "TEMPLATE_UMUM_DESA",
        templateName: "Template Umum Desa",
        visibleComponents: [],
        hiddenComponents: [],
      },
      fields: [
        {
          componentId: "cmp_identitas",
          fieldStandardId: "field_website",
          fieldKey: "websiteUrl",
          label: "Website resmi",
          valueType: "url",
          validationRules: null,
          sourcePolicy: null,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: true,
          componentKey: "identitas",
          componentLabel: "Identitas & Wilayah",
          sourcePolicyResolved: {
            allowedSourceTypes: ["OFFICIAL_WEBSITE"],
            requiresEvidence: true,
            canUseAdminDesaSubmission: true,
            canUseCitizenVoiceSignal: false,
            canUseInternalAdminManualInput: false,
            sourcePriority: ["OFFICIAL_WEBSITE"],
          },
        },
      ],
    };

    const bindingMap = createActiveTemplateFieldBindingMap(engine);
    const binding = bindingMap.get("websiteUrl");

    expect(binding).toEqual({
      templateId: "tpl_current",
      fieldKey: "websiteUrl",
      componentId: "cmp_identitas",
      fieldStandardId: "field_website",
      componentKey: "identitas",
      componentLabel: "Identitas & Wilayah",
      valueType: "url",
      isPublishableNow: true,
    });
  });
});
