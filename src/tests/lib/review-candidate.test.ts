import { describe, expect, it, vi } from "vitest";

const mockResolveEffectiveTemplateFieldEngine = vi.fn();
const mockRestoreTemplateFieldEngineFromSnapshot = vi.fn();
const mockReconcileTemplateFieldEngineSnapshot = vi.fn();
const mockGetPublishedDataDesa = vi.fn();
const mockDesaFindUnique = vi.fn();
const mockSupabaseMaybeSingle = vi.fn();

vi.mock("@/lib/village-data/field-engine", () => ({
  resolveEffectiveTemplateFieldEngine: mockResolveEffectiveTemplateFieldEngine,
  restoreTemplateFieldEngineFromSnapshot: mockRestoreTemplateFieldEngineFromSnapshot,
  reconcileTemplateFieldEngineSnapshot: mockReconcileTemplateFieldEngineSnapshot,
}));

vi.mock("@/lib/village-data/template-resolver", () => ({
  getPublishedDataDesa: mockGetPublishedDataDesa,
}));

vi.mock("@/lib/db", () => ({
  db: {
    desa: {
      findUnique: mockDesaFindUnique,
    },
  },
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient: () => ({
    from() {
      return {
        select() {
          return {
            eq() {
              return this;
            },
            maybeSingle: mockSupabaseMaybeSingle,
          };
        },
      };
    },
  }),
}));

describe("buildReviewCandidateForDocument", () => {
  it("reuses persisted template snapshot for structured submissions", async () => {
    mockReconcileTemplateFieldEngineSnapshot.mockImplementation(
      (snapshotEngine, currentEngine) => currentEngine ?? snapshotEngine,
    );
    const engine = {
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
          componentLabel: "Identitas",
          sourcePolicyResolved: {
            allowedSourceTypes: ["ADMIN_DESA_SUBMISSION"],
            requiresEvidence: true,
            canUseAdminDesaSubmission: true,
            canUseCitizenVoiceSignal: false,
            canUseInternalAdminManualInput: false,
            sourcePriority: ["ADMIN_DESA_SUBMISSION"],
          },
        },
      ],
    };

    mockRestoreTemplateFieldEngineFromSnapshot.mockReturnValue(engine);
    mockResolveEffectiveTemplateFieldEngine.mockResolvedValue(engine);
    mockGetPublishedDataDesa.mockResolvedValue({});
    mockDesaFindUnique.mockResolvedValue({
      websiteUrl: null,
      tahunData: 2024,
      kategori: "Lama",
    });

    const { buildReviewCandidateForDocument } = await import("@/lib/internal-admin/review-candidate");
    const result = await buildReviewCandidateForDocument({
      desaId: "qa-desa-a",
      inputMode: "STRUCTURED_SUBMISSION",
      sourceTypeCode: "ADMIN_DESA_SUBMISSION",
      sourceUrl: "https://desa.example.id",
      sourceRegistryId: null,
      sourceEvidenceJson: { templateSnapshot: { any: "value" } },
      normalizedSourceText: "Website: https://desa.example.id",
      structuredValuesJson: { websiteUrl: "https://desa.example.id" },
      aiMappingResult: null,
    });

    expect(mockResolveEffectiveTemplateFieldEngine).toHaveBeenCalledWith("qa-desa-a");
    expect(result.template.templateId).toBe("tpl_current");
    expect(result.fields[0]?.componentId).toBe("cmp_identitas");
    expect(result.fields[0]?.validationStatus).toBe("valid");
  });

  it("reconciles persisted snapshot with the latest publishability policy", async () => {
    mockReconcileTemplateFieldEngineSnapshot.mockImplementation(
      (snapshotEngine, currentEngine) => ({
        ...snapshotEngine,
        fields: currentEngine.fields,
      }),
    );
    mockRestoreTemplateFieldEngineFromSnapshot.mockReturnValue({
      resolvedTemplate: {
        templateId: "tpl_snapshot",
        templateKey: "TEMPLATE_UMUM_DESA",
        templateName: "Template Snapshot",
        visibleComponents: [],
        hiddenComponents: [],
      },
      fields: [
        {
          componentId: "cmp_perangkat",
          fieldStandardId: "field_kepala_desa",
          fieldKey: "kepalaDesa",
          label: "Nama kepala desa",
          valueType: "string",
          validationRules: null,
          sourcePolicy: null,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: false,
          componentKey: "perangkat",
          componentLabel: "Pemerintahan Desa",
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
    });
    mockResolveEffectiveTemplateFieldEngine.mockResolvedValue({
      resolvedTemplate: {
        templateId: "tpl_current",
        templateKey: "TEMPLATE_UMUM_DESA",
        templateName: "Template Umum Desa",
        visibleComponents: [],
        hiddenComponents: [],
      },
      fields: [
        {
          componentId: "cmp_perangkat",
          fieldStandardId: "field_kepala_desa",
          fieldKey: "kepalaDesa",
          label: "Nama kepala desa",
          valueType: "string",
          validationRules: null,
          sourcePolicy: null,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: true,
          componentKey: "perangkat",
          componentLabel: "Pemerintahan Desa",
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
    });
    mockGetPublishedDataDesa.mockResolvedValue({});
    mockDesaFindUnique.mockResolvedValue({});

    const { buildReviewCandidateForDocument } = await import("@/lib/internal-admin/review-candidate");
    const result = await buildReviewCandidateForDocument({
      desaId: "qa-desa-a",
      inputMode: "INTERNAL_SOURCE_ENTRY",
      sourceTypeCode: "OFFICIAL_WEBSITE",
      sourceUrl: "https://desa.example.id",
      sourceRegistryId: "src_registry",
      sourceEvidenceJson: { templateSnapshot: { any: "snapshot" } },
      normalizedSourceText: "Kepala Desa: Bapak Ujang",
      structuredValuesJson: { kepalaDesa: "Bapak Ujang" },
      aiMappingResult: null,
    });

    expect(result.template.templateId).toBe("tpl_snapshot");
    expect(result.fields[0]?.isPublishableNow).toBe(true);
    expect(result.fields[0]?.validationStatus).toBe("valid");
    expect(result.fields[0]?.defaultSelection).toBe("manual");
  });

  it("falls back to Supabase for legacy desa values when Prisma read times out", async () => {
    mockReconcileTemplateFieldEngineSnapshot.mockImplementation(
      (snapshotEngine, currentEngine) => currentEngine ?? snapshotEngine,
    );
    mockRestoreTemplateFieldEngineFromSnapshot.mockReturnValue(null);
    mockResolveEffectiveTemplateFieldEngine.mockResolvedValue({
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
          fieldStandardId: "field_kategori",
          fieldKey: "kategori",
          label: "Kategori desa",
          valueType: "string",
          validationRules: null,
          sourcePolicy: null,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: true,
          componentKey: "identitas",
          componentLabel: "Identitas",
          sourcePolicyResolved: {
            allowedSourceTypes: ["ADMIN_DESA_SUBMISSION"],
            requiresEvidence: false,
            canUseAdminDesaSubmission: true,
            canUseCitizenVoiceSignal: false,
            canUseInternalAdminManualInput: false,
            sourcePriority: ["ADMIN_DESA_SUBMISSION"],
          },
        },
      ],
    });
    mockGetPublishedDataDesa.mockResolvedValue({});
    mockDesaFindUnique.mockRejectedValue({
      code: "P2024",
      message: "Timed out fetching a new connection from the connection pool.",
    });
    mockSupabaseMaybeSingle.mockResolvedValue({
      data: {
        kategori: "Maju",
      },
      error: null,
    });

    const { buildReviewCandidateForDocument } = await import("@/lib/internal-admin/review-candidate");
    const result = await buildReviewCandidateForDocument({
      desaId: "qa-desa-a",
      inputMode: "STRUCTURED_SUBMISSION",
      sourceTypeCode: "ADMIN_DESA_SUBMISSION",
      sourceUrl: null,
      sourceRegistryId: null,
      sourceEvidenceJson: {},
      normalizedSourceText: null,
      structuredValuesJson: { kategori: "Mandiri" },
      aiMappingResult: null,
    });

    expect(mockSupabaseMaybeSingle).toHaveBeenCalled();
    expect(result.fields[0]?.currentValue).toBe("Maju");
    expect(result.fields[0]?.proposedValue).toBe("Mandiri");
  });

  it("marks source-backed conflicts as held until reviewer chooses manual or fetch", async () => {
    mockReconcileTemplateFieldEngineSnapshot.mockImplementation(
      (snapshotEngine, currentEngine) => currentEngine ?? snapshotEngine,
    );
    mockRestoreTemplateFieldEngineFromSnapshot.mockReturnValue(null);
    mockResolveEffectiveTemplateFieldEngine.mockResolvedValue({
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
          fieldStandardId: "field_kategori",
          fieldKey: "kategori",
          label: "Kategori desa",
          valueType: "string",
          validationRules: null,
          sourcePolicy: null,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: true,
          componentKey: "identitas",
          componentLabel: "Identitas",
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
    });
    mockGetPublishedDataDesa.mockResolvedValue({});
    mockDesaFindUnique.mockResolvedValue({
      kategori: "Maju",
    });

    const { buildReviewCandidateForDocument } = await import("@/lib/internal-admin/review-candidate");
    const result = await buildReviewCandidateForDocument({
      desaId: "qa-desa-a",
      inputMode: "INTERNAL_SOURCE_ENTRY",
      sourceTypeCode: "OFFICIAL_WEBSITE",
      sourceUrl: "https://desa.example.id",
      sourceRegistryId: "src_registry",
      sourceEvidenceJson: {
        sourceFetch: {
          status: "success",
          attemptedAt: "2026-05-20T00:00:00.000Z",
          suggestedValues: { kategori: "Mandiri" },
          extractedMeta: { fetchedAt: "2026-05-20T00:00:00.000Z" },
          error: null,
        },
      },
      normalizedSourceText: "Kategori desa: Mandiri",
      structuredValuesJson: { kategori: "Maju Berkelanjutan" },
      aiMappingResult: null,
    });

    expect(result.sourceFetch.status).toBe("success");
    expect(result.fields[0]?.manualCandidate?.preview).toBe("Maju Berkelanjutan");
    expect(result.fields[0]?.fetchedCandidate?.preview).toBe("Mandiri");
    expect(result.fields[0]?.hasConflict).toBe(true);
    expect(result.fields[0]?.defaultSelection).toBeNull();
    expect(result.fields[0]?.validationStatus).toBe("held");
  });
});
