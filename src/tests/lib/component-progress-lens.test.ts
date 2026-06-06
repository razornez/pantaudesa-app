import { describe, expect, it } from "vitest";
import {
  buildComponentProgressLens,
  matchPublishedRowsToComponents,
} from "@/lib/internal-admin/component-progress-lens";

describe("component progress lens", () => {
  it("computes field progress and ignores hidden fields in aggregate", () => {
    const result = buildComponentProgressLens({
      components: [
        {
          componentId: "comp-identitas",
          componentKey: "identitas",
          label: "Identitas & Wilayah",
          displayOrder: 1,
          isVisible: true,
          fields: [
            { fieldKey: "websiteUrl", label: "Website resmi" },
            { fieldKey: "kategori", label: "Kategori desa" },
          ],
        },
        {
          componentId: "comp-anggaran",
          componentKey: "anggaran",
          label: "Anggaran & Realisasi",
          displayOrder: 2,
          isVisible: false,
          fields: [{ fieldKey: "totalAnggaran", label: "Total anggaran" }],
        },
      ],
      publishedFieldKeys: ["websiteUrl", "totalAnggaran"],
    });

    expect(result.aggregateFilledFieldCount).toBe(1);
    expect(result.aggregateTotalFieldCount).toBe(2);
    expect(result.components[0]?.completionStatus).toBe("partial");
    expect(result.components[1]?.completionStatus).toBe("complete");
  });

  it("derives source and document progress for sumber_dokumen", () => {
    const result = buildComponentProgressLens({
      components: [
        {
          componentId: "comp-source",
          componentKey: "sumber_dokumen",
          label: "Sumber & Dokumen",
          displayOrder: 1,
          isVisible: true,
          fields: [],
        },
      ],
      publishedFieldKeys: [],
      sourceCount: 2,
      documentCount: 0,
    });

    expect(result.components[0]).toMatchObject({
      filledFieldCount: 1,
      totalFieldCount: 2,
      completionStatus: "partial",
      filledFieldLabels: ["Sumber publik"],
      missingFieldLabels: ["Dokumen pendukung"],
    });
  });

  it("marks panduan warga as complete by system", () => {
    const result = buildComponentProgressLens({
      components: [
        {
          componentId: "comp-guide",
          componentKey: "panduan_warga",
          label: "Panduan Warga",
          displayOrder: 1,
          isVisible: true,
          fields: [],
        },
      ],
      publishedFieldKeys: [],
    });

    expect(result.components[0]).toMatchObject({
      filledFieldCount: 1,
      totalFieldCount: 1,
      completionStatus: "complete",
      derivedSignals: ["Konten sistem siap tampil"],
    });
  });

  it("marks suara warga complete only when voice exists", () => {
    const empty = buildComponentProgressLens({
      components: [
        {
          componentId: "comp-voice",
          componentKey: "suara_warga",
          label: "Suara Warga",
          displayOrder: 1,
          isVisible: true,
          fields: [],
        },
      ],
      publishedFieldKeys: [],
      voiceCount: 0,
    });
    const filled = buildComponentProgressLens({
      components: [
        {
          componentId: "comp-voice",
          componentKey: "suara_warga",
          label: "Suara Warga",
          displayOrder: 1,
          isVisible: true,
          fields: [],
        },
      ],
      publishedFieldKeys: [],
      voiceCount: 3,
    });

    expect(empty.components[0]?.completionStatus).toBe("empty");
    expect(filled.components[0]?.completionStatus).toBe("complete");
    expect(filled.components[0]?.derivedSignals).toEqual(["3 suara warga"]);
  });

  it("tracks field aggregates separately from derived non-field signals", () => {
    const result = buildComponentProgressLens({
      components: [
        {
          componentId: "comp-identitas",
          componentKey: "identitas",
          label: "Identitas & Wilayah",
          displayOrder: 1,
          isVisible: true,
          fields: [
            { fieldKey: "websiteUrl", label: "Website resmi" },
            { fieldKey: "kategori", label: "Kategori desa" },
          ],
        },
        {
          componentId: "comp-source",
          componentKey: "sumber_dokumen",
          label: "Sumber & Dokumen",
          displayOrder: 2,
          isVisible: true,
          fields: [],
        },
        {
          componentId: "comp-guide",
          componentKey: "panduan_warga",
          label: "Panduan Warga",
          displayOrder: 3,
          isVisible: true,
          fields: [],
        },
      ],
      publishedFieldKeys: ["websiteUrl"],
      sourceCount: 1,
      documentCount: 1,
    });

    expect(result.aggregateFilledFieldCount).toBe(1);
    expect(result.aggregateTotalFieldCount).toBe(2);
    expect(result.aggregateFilledSignalCount).toBe(3);
    expect(result.aggregateTotalSignalCount).toBe(3);
  });

  it("does not treat published rows with mismatched componentId as valid", () => {
    const match = matchPublishedRowsToComponents({
      components: [
        {
          componentId: "comp-identitas-current",
          componentKey: "identitas",
          label: "Identitas & Wilayah",
          displayOrder: 1,
          isVisible: true,
          fields: [
            { fieldKey: "websiteUrl", label: "Website resmi" },
            { fieldKey: "kategori", label: "Kategori desa" },
          ],
        },
      ],
      publishedRows: [
        { fieldKey: "websiteUrl", componentId: "comp-identitas-legacy" },
        { fieldKey: "kategori", componentId: "comp-identitas-current" },
      ],
    });

    expect([...match.validFieldKeys]).toEqual(["kategori"]);
    expect(match.mismatchRows).toHaveLength(1);
    expect(match.unknownRows).toHaveLength(0);
  });
});
