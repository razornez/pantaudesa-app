import { describe, expect, it } from "vitest";
import { sanitizeTemplateFieldValues } from "@/lib/village-data/field-submission";
import type { EffectiveTemplateFieldEngine } from "@/lib/village-data/field-engine";

const engine = {
  resolvedTemplate: {
    templateId: "tpl_1",
    templateKey: "TEMPLATE_UMUM_DESA",
    templateName: "Template Publik Saat Ini",
    visibleComponents: [],
    hiddenComponents: [],
  },
  fields: [
    {
      componentId: "cmp_profile",
      fieldStandardId: "field_website",
      fieldKey: "websiteUrl",
      label: "Website resmi",
      valueType: "url",
      validationRules: null,
      sourcePolicy: null,
      isRequired: false,
      isPublicVisible: true,
      isPublishableNow: true,
      componentKey: "profil_desa",
      componentLabel: "Profil Desa",
      sourcePolicyResolved: {
        allowedSourceTypes: ["OFFICIAL_WEBSITE"],
        requiresEvidence: true,
        canUseAdminDesaSubmission: true,
        canUseCitizenVoiceSignal: false,
        canUseInternalAdminManualInput: false,
        sourcePriority: ["OFFICIAL_WEBSITE"],
      },
    },
    {
      componentId: "cmp_demografi",
      fieldStandardId: "field_population",
      fieldKey: "jumlahPenduduk",
      label: "Jumlah penduduk",
      valueType: "number",
      validationRules: null,
      sourcePolicy: null,
      isRequired: false,
      isPublicVisible: true,
      isPublishableNow: true,
      componentKey: "demografi",
      componentLabel: "Demografi",
      sourcePolicyResolved: {
        allowedSourceTypes: ["ADMIN_DESA_SUBMISSION"],
        requiresEvidence: true,
        canUseAdminDesaSubmission: true,
        canUseCitizenVoiceSignal: false,
        canUseInternalAdminManualInput: false,
        sourcePriority: ["ADMIN_DESA_SUBMISSION"],
      },
    },
    {
      componentId: "cmp_gallery",
      fieldStandardId: "field_gallery",
      fieldKey: "galeriJson",
      label: "Galeri JSON",
      valueType: "json",
      validationRules: null,
      sourcePolicy: null,
      isRequired: false,
      isPublicVisible: true,
      isPublishableNow: false,
      componentKey: "media",
      componentLabel: "Media",
      sourcePolicyResolved: {
        allowedSourceTypes: ["DOCUMENT_UPLOAD"],
        requiresEvidence: false,
        canUseAdminDesaSubmission: true,
        canUseCitizenVoiceSignal: false,
        canUseInternalAdminManualInput: false,
        sourcePriority: ["DOCUMENT_UPLOAD"],
      },
    },
  ],
} satisfies EffectiveTemplateFieldEngine;

describe("sanitizeTemplateFieldValues", () => {
  it("coerces numeric and json values while ignoring empty inputs", () => {
    const result = sanitizeTemplateFieldValues({
      engine,
      rawValues: {
        websiteUrl: " https://desa.example.id ",
        jumlahPenduduk: "3786",
        galeriJson: '[{\"label\":\"Balai desa\"}]',
        ignoredField: "tidak ada di template",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.values).toEqual({
      websiteUrl: "https://desa.example.id",
      jumlahPenduduk: 3786,
      galeriJson: [{ label: "Balai desa" }],
    });
  });

  it("returns clear errors for invalid number and invalid json fields", () => {
    const result = sanitizeTemplateFieldValues({
      engine,
      rawValues: {
        jumlahPenduduk: "banyak",
        galeriJson: "{bukan-json}",
      },
    });

    expect(result.values).toEqual({});
    expect(result.errors).toEqual([
      "Jumlah penduduk: Nilai harus berupa angka.",
      "Galeri JSON: Field JSON belum valid.",
    ]);
  });
});
