import { describe, expect, it } from "vitest";
import {
  buildStatusHref,
  formatReviewStatusLabel,
  getDraftSummary,
  getNextStepCopy,
} from "@/components/internal-admin/review-queue/utils";
import {
  readFieldCoverageSignals,
  readTemplateRibbonInfo,
} from "@/components/internal-admin/review-queue/coverage-signals";
import type { DocRow } from "@/components/internal-admin/review-queue/types";

function buildDoc(overrides?: Partial<DocRow>): DocRow {
  return {
    id: "doc-1",
    title: "Laporan Desa",
    category: "intake_workbench",
    fileName: "laporan.pdf",
    fileType: "application/pdf",
    fileSize: 1024,
    status: "PROCESSING",
    approvedAt: null,
    publishedAt: null,
    failedReason: null,
    rejectedReason: null,
    aiMappingStatus: "DRAFT_READY_REVIEW",
    aiMappingResult: {
      fields: {
        websiteUrl: "https://desa.id",
        kategori: "Maju",
      },
      notes: "draft",
      changedFields: ["websiteUrl"],
      baseSnapshot: { websiteUrl: null },
    },
    createdAt: "2026-05-12T10:00:00.000Z",
    updatedAt: "2026-05-12T10:00:00.000Z",
    desa: {
      id: "desa-1",
      nama: "Desa Maju",
      kecamatan: "Cibungbulang",
      kabupaten: "Bogor",
    },
    uploadedBy: {
      id: "user-1",
      nama: "Admin Desa",
      username: "admin",
      email: "admin@desa.id",
    },
    ...overrides,
  };
}

describe("review queue utils", () => {
  it("formats status href with query parameter", () => {
    expect(buildStatusHref("/internal-admin/documents", "PROCESSING")).toBe(
      "/internal-admin/documents?status=PROCESSING",
    );
    expect(buildStatusHref("/internal-admin/documents", "")).toBe(
      "/internal-admin/documents",
    );
  });

  it("formats known review status labels", () => {
    expect(formatReviewStatusLabel("DRAFT_READY_REVIEW")).toBe("Draft review tersedia");
    expect(formatReviewStatusLabel("DONE")).toBe("Review selesai");
    expect(formatReviewStatusLabel(null)).toBeNull();
  });

  it("summarizes draft fields and next step", () => {
    const doc = buildDoc();
    const draftSummary = getDraftSummary(doc);
    const nextStep = getNextStepCopy(doc);

    expect(draftSummary?.filledCount).toBe(2);
    expect(nextStep.tone).toBe("info");
    expect(nextStep.title).toBe("Lanjut cek draft review");
  });

  it("reads field coverage signal groups", () => {
    const result = readFieldCoverageSignals({
      fieldCoverage: {
        entries: [
          {
            uploadedCoverageStatus: "component_hidden",
            fieldLabel: "Website",
            sectionLabel: "Profil",
          },
          {
            uploadedCoverageStatus: "outside_template",
            fieldLabel: "Potensi Desa",
            fieldKey: "potensiDesa",
            uploadedValuePreview: "Pariwisata",
          },
        ],
      },
    });

    expect(result.componentHidden).toHaveLength(1);
    expect(result.outsideTemplate).toHaveLength(1);
    expect(result.componentHidden[0]?.componentLabel).toBe("Profil");
  });

  it("reads template ribbon info", () => {
    const info = readTemplateRibbonInfo({
      fieldCoverage: {
        templateInfo: {
          templateName: "Template Profil Desa",
          templateKey: "profil-desa",
          source: "db",
          visibleComponentCount: 5,
          hiddenComponentCount: 2,
        },
      },
    });

    expect(info).toEqual({
      templateName: "Template Profil Desa",
      templateKey: "profil-desa",
      source: "db",
      visibleCount: 5,
      hiddenCount: 2,
    });
  });
});
