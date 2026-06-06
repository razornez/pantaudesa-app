import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("template field engine view model", () => {
  it("derives visible field counts from the same runtime manifest path", async () => {
    const policy = {
      allowedSourceTypes: [],
      requiresEvidence: false,
      canUseAdminDesaSubmission: true,
      canUseCitizenVoiceSignal: false,
      canUseInternalAdminManualInput: false,
      sourcePriority: [],
    };

    vi.doMock("@/lib/village-data/field-engine", () => ({
      resolveEffectiveTemplateFieldEngine: vi.fn().mockResolvedValue({
        resolvedTemplate: {
          templateId: "tpl_runtime",
          templateKey: "TEMPLATE_UMUM_DESA",
          templateName: "Template Umum Desa",
          visibleComponents: [
            {
              componentId: "cmp_identitas",
              componentKey: "identitas",
              label: "Identitas",
              displayOrder: 1,
              fields: [
                {
                  componentId: "cmp_identitas",
                  fieldStandardId: "fld_website",
                  fieldKey: "websiteUrl",
                  label: "Website resmi",
                  valueType: "url",
                  isPublishableNow: true,
                  componentKey: "identitas",
                  componentLabel: "Identitas",
                },
                {
                  componentId: "cmp_identitas",
                  fieldStandardId: "fld_kategori",
                  fieldKey: "kategori",
                  label: "Kategori desa",
                  valueType: "string",
                  isPublishableNow: true,
                  componentKey: "identitas",
                  componentLabel: "Identitas",
                },
              ],
            },
          ],
          hiddenComponents: [
            {
              componentId: "cmp_hidden",
              componentKey: "demografi",
              label: "Demografi",
              displayOrder: 2,
              fields: [
                {
                  componentId: "cmp_hidden",
                  fieldStandardId: "fld_penduduk",
                  fieldKey: "jumlahPenduduk",
                  label: "Jumlah penduduk",
                  valueType: "number",
                  isPublishableNow: true,
                  componentKey: "demografi",
                  componentLabel: "Demografi",
                },
              ],
            },
          ],
        },
        fields: [
          {
            componentId: "cmp_identitas",
            fieldStandardId: "fld_website",
            fieldKey: "websiteUrl",
            label: "Website resmi",
            valueType: "url",
            isPublishableNow: true,
            isRequired: false,
            isPublicVisible: true,
            componentKey: "identitas",
            componentLabel: "Identitas",
            sourcePolicyResolved: policy,
          },
          {
            componentId: "cmp_identitas",
            fieldStandardId: "fld_kategori",
            fieldKey: "kategori",
            label: "Kategori desa",
            valueType: "string",
            isPublishableNow: true,
            isRequired: false,
            isPublicVisible: true,
            componentKey: "identitas",
            componentLabel: "Identitas",
            sourcePolicyResolved: policy,
          },
          {
            componentId: "cmp_hidden",
            fieldStandardId: "fld_penduduk",
            fieldKey: "jumlahPenduduk",
            label: "Jumlah penduduk",
            valueType: "number",
            isPublishableNow: true,
            isRequired: false,
            isPublicVisible: true,
            componentKey: "demografi",
            componentLabel: "Demografi",
            sourcePolicyResolved: policy,
          },
        ],
      }),
    }));

    const { buildTemplateFieldEngineViewModel } = await import(
      "@/lib/village-data/template-engine-view"
    );
    const result = await buildTemplateFieldEngineViewModel("desa-runtime");

    expect(result.visibleFieldCount).toBe(2);
    expect(result.totalFieldCount).toBe(3);
    expect(result.publishableCount).toBe(3);
    expect(result.visibleComponents).toHaveLength(1);
  });
});
