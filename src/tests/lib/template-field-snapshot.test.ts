import { describe, expect, it, vi } from "vitest";
import {
  createTemplateFieldEngineSnapshot,
  restoreTemplateFieldEngineFromSnapshot,
  type EffectiveTemplateFieldEngine,
} from "@/lib/village-data/field-engine";

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient: () => null,
}));

const engine: EffectiveTemplateFieldEngine = {
  resolvedTemplate: {
    templateId: "tpl_current",
    templateKey: "TEMPLATE_UMUM_DESA",
    templateName: "Template Umum Desa",
    visibleComponents: [
      {
        componentId: "cmp_identitas",
        componentKey: "identitas",
        label: "Identitas",
        displayOrder: 1,
        fields: [],
      },
    ],
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
      componentLabel: "Identitas",
      sourcePolicyResolved: {
        allowedSourceTypes: ["OFFICIAL_WEBSITE", "ADMIN_DESA_SUBMISSION"],
        requiresEvidence: true,
        canUseAdminDesaSubmission: true,
        canUseCitizenVoiceSignal: false,
        canUseInternalAdminManualInput: false,
        sourcePriority: ["OFFICIAL_WEBSITE", "ADMIN_DESA_SUBMISSION"],
      },
    },
  ],
};

describe("template field engine snapshot", () => {
  it("round-trips a resolved engine for later review reuse", () => {
    const snapshot = createTemplateFieldEngineSnapshot(engine);
    const restored = restoreTemplateFieldEngineFromSnapshot(snapshot);

    expect(restored).not.toBeNull();
    expect(restored?.resolvedTemplate.templateId).toBe("tpl_current");
    expect(restored?.fields[0]?.componentId).toBe("cmp_identitas");
    expect(restored?.fields[0]?.sourcePolicyResolved.requiresEvidence).toBe(true);
  });

  it("rejects malformed snapshot payloads", () => {
    expect(restoreTemplateFieldEngineFromSnapshot(null)).toBeNull();
    expect(restoreTemplateFieldEngineFromSnapshot({ template: {} })).toBeNull();
  });
});
