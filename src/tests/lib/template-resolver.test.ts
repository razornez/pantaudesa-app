import { afterEach, describe, expect, it, vi } from "vitest";

function buildTemplate(id: string, key: string, fieldKey = "websiteUrl") {
  return {
    id,
    key,
    name: `Template ${key}`,
    components: [
      {
        id: `${id}-component`,
        componentKey: "identitas",
        label: "Identitas",
        isDefaultVisible: true,
        displayOrder: 1,
        fieldStandards: [
          {
            id: `${id}-field`,
            fieldKey,
            label: "Website resmi",
            valueType: "url",
            validationRules: null,
            sourcePolicyJson: null,
            isRequired: false,
            isPublicVisible: true,
            isPublishableNow: true,
          },
        ],
      },
    ],
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("resolveDesaTemplate", () => {
  it("uses DB default template when desa has no explicit assignment", async () => {
    vi.doMock("@/lib/supabase-admin", () => ({
      getSupabaseAdminClient: () => null,
    }));
    const defaultTemplate = buildTemplate("tpl_default", "TEMPLATE_UMUM_DESA");
    vi.doMock("@/lib/db", () => ({
      db: {
        desaDetailTemplateAssignment: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        villageDetailTemplate: {
          findUnique: vi.fn().mockResolvedValue(defaultTemplate),
        },
        desaDetailComponentVisibility: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));

    const { resolveDesaTemplate } = await import("@/lib/village-data/template-resolver");
    const result = await resolveDesaTemplate("qa-desa-a");

    expect(result.templateId).toBe("tpl_default");
    expect(result.templateKey).toBe("TEMPLATE_UMUM_DESA");
    expect(result.visibleComponents[0]?.componentId).toBe("tpl_default-component");
    expect(result.visibleComponents[0]?.fields[0]?.fieldStandardId).toBe("tpl_default-field");
  });

  it("prioritizes explicit active assignment over DB default template", async () => {
    vi.doMock("@/lib/supabase-admin", () => ({
      getSupabaseAdminClient: () => null,
    }));
    const assignedTemplate = buildTemplate("tpl_assigned", "DESA_WISATA_TEMPLATE", "potensiUnggulan");
    const defaultTemplate = buildTemplate("tpl_default", "TEMPLATE_UMUM_DESA");
    vi.doMock("@/lib/db", () => ({
      db: {
        desaDetailTemplateAssignment: {
          findUnique: vi.fn().mockResolvedValue({
            isActive: true,
            templateId: "tpl_assigned",
            template: assignedTemplate,
          }),
        },
        villageDetailTemplate: {
          findUnique: vi.fn().mockResolvedValue(defaultTemplate),
        },
        desaDetailComponentVisibility: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));

    const { resolveDesaTemplate } = await import("@/lib/village-data/template-resolver");
    const result = await resolveDesaTemplate("demo-desa-arjasari");

    expect(result.templateId).toBe("tpl_assigned");
    expect(result.templateKey).toBe("DESA_WISATA_TEMPLATE");
    expect(result.visibleComponents[0]?.fields[0]?.fieldKey).toBe("potensiUnggulan");
  });

  it("does not reuse stale template assignment across separate resolves", async () => {
    vi.doMock("@/lib/supabase-admin", () => ({
      getSupabaseAdminClient: () => null,
    }));
    const firstTemplate = buildTemplate("tpl_first", "TEMPLATE_UMUM_DESA", "websiteUrl");
    const secondTemplate = buildTemplate("tpl_second", "TEMPLATE_AGENDA", "agendaDesa");
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        isActive: true,
        templateId: "tpl_first",
        template: firstTemplate,
      })
      .mockResolvedValueOnce({
        isActive: true,
        templateId: "tpl_second",
        template: secondTemplate,
      });

    vi.doMock("@/lib/db", () => ({
      db: {
        desaDetailTemplateAssignment: { findUnique },
        villageDetailTemplate: {
          findUnique: vi.fn().mockResolvedValue(firstTemplate),
        },
        desaDetailComponentVisibility: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));

    const { resolveDesaTemplate } = await import("@/lib/village-data/template-resolver");
    const first = await resolveDesaTemplate("qa-desa-a");
    const second = await resolveDesaTemplate("qa-desa-a");

    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(first.templateId).toBe("tpl_first");
    expect(second.templateId).toBe("tpl_second");
    expect(second.visibleComponents[0]?.fields[0]?.fieldKey).toBe("agendaDesa");
  });

  it("falls back to hardcoded constants only when DB default is unavailable", async () => {
    vi.doMock("@/lib/supabase-admin", () => ({
      getSupabaseAdminClient: () => null,
    }));
    vi.doMock("@/lib/db", () => ({
      db: {
        desaDetailTemplateAssignment: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        villageDetailTemplate: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        desaDetailComponentVisibility: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));

    const { resolveDesaTemplate } = await import("@/lib/village-data/template-resolver");
    const result = await resolveDesaTemplate("desa-fallback");

    expect(result.templateId).toBe("fallback");
    expect(result.visibleComponents[0]?.componentId.startsWith("fallback-")).toBe(true);
  });

  it("falls back to Supabase for published DataDesa when Prisma connectivity degrades", async () => {
    const returnsMock = vi.fn().mockResolvedValue({
      data: [
        {
          fieldKey: "websiteUrl",
          valueJson: null,
          valueText: "https://desa.example.id",
        },
      ],
      error: null,
    });
    const inMock = vi.fn().mockReturnValue({
      returns: returnsMock,
    });

    vi.doMock("@/lib/supabase-admin", () => ({
      getSupabaseAdminClient: () => ({
        from() {
          return {
            select() {
              const chain = {
                eq() {
                  return chain;
                },
                in: inMock,
              };
              return chain;
            },
          };
        },
      }),
    }));

    vi.doMock("@/lib/db", () => ({
      db: {
        dataDesa: {
          findMany: vi.fn().mockRejectedValue({
            code: "P2024",
            message: "Timed out fetching a new connection from the connection pool.",
          }),
        },
      },
    }));

    const { getPublishedDataDesa } = await import("@/lib/village-data/template-resolver");
    const result = await getPublishedDataDesa("qa-desa-a", {
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
    });

    expect(inMock).toHaveBeenCalledWith("componentId", ["cmp_identitas"]);
    expect(returnsMock).toHaveBeenCalled();
    expect(result.websiteUrl).toBe("https://desa.example.id");
  });
});
