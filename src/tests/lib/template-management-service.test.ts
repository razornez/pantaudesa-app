import { describe, expect, it, vi } from "vitest";
import {
  analyzeTemplateCompositionInput,
  normalizeTemplateNameToKey,
  sanitizeTemplateComponentKeys,
} from "@/lib/internal-admin/template-management-helpers";

const connectivityError = Object.assign(
  new Error("Can't reach database server at `aws-1-ap-south-1.pooler.supabase.com:5432`"),
  { code: "P1001" },
);
const mockQueryRawUnsafe = vi.hoisted(() => vi.fn());
const mockTemplateFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    $queryRawUnsafe: mockQueryRawUnsafe,
    villageDetailTemplate: {
      findMany: mockTemplateFindMany,
    },
  },
}));

vi.mock("@/lib/village-data/template-resolver", () => ({
  invalidateAllTemplateCaches: vi.fn(),
  invalidateTemplateCache: vi.fn(),
}));

describe("template management service helpers", () => {
  it("uses an explicit long transaction budget for template mutations", async () => {
    const {
      TEMPLATE_MUTATION_TRANSACTION_OPTIONS,
      isTemplateComponentRemovalBlocked,
    } = await import(
      "@/lib/internal-admin/template-management-service"
    );

    expect(TEMPLATE_MUTATION_TRANSACTION_OPTIONS).toEqual({
      maxWait: 20_000,
      timeout: 120_000,
    });
    expect(
      isTemplateComponentRemovalBlocked({
        dataDesaCount: 0,
        visibilityOverrideCount: 1,
      }),
    ).toBe(false);
    expect(
      isTemplateComponentRemovalBlocked({
        dataDesaCount: 1,
        visibilityOverrideCount: 0,
      }),
    ).toBe(true);
  });

  it("normalizes template names into stable uppercase keys", () => {
    expect(normalizeTemplateNameToKey("Template Umum Desa")).toBe(
      "TEMPLATE_UMUM_DESA",
    );
    expect(normalizeTemplateNameToKey("  Template   Wisata  2 ")).toBe(
      "TEMPLATE_WISATA_2",
    );
  });

  it("removes unknown and duplicate component keys", () => {
    expect(
      sanitizeTemplateComponentKeys([
        "identitas",
        "demografi",
        "identitas",
        "komponen_liar",
        "profil_desa",
      ]),
    ).toEqual(["identitas", "demografi", "profil_desa"]);
  });

  it("flags duplicate and unknown component keys for composition saves", () => {
    expect(
      analyzeTemplateCompositionInput([
        "identitas",
        "demografi",
        "identitas",
        "komponen_liar",
      ]),
    ).toEqual({
      normalizedKeys: ["identitas", "demografi"],
      duplicateKeys: ["identitas"],
      unknownKeys: ["komponen_liar"],
    });
  });
});

describe("getTemplateWorkspace", () => {
  it("falls back to a read-only manifest workspace when runtime DB is unreachable", async () => {
    mockQueryRawUnsafe.mockRejectedValue(connectivityError);
    mockTemplateFindMany.mockRejectedValue(connectivityError);

    const { getTemplateWorkspace } = await import(
      "@/lib/internal-admin/template-management-service"
    );

    const workspace = await getTemplateWorkspace();

    expect(workspace.readOnly).toBe(true);
    expect(workspace.readOnlyReason).toContain("Koneksi database Supabase");
    expect(workspace.catalogSource).toBe("manifest");
    expect(workspace.templates).toHaveLength(1);
    expect(workspace.selectedTemplate?.key).toBe("TEMPLATE_UMUM_DESA");
    expect(workspace.selectedTemplate?.components).toHaveLength(12);
    expect(workspace.availableComponents).toHaveLength(12);
  });
});
