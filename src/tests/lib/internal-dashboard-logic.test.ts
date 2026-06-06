import { describe, expect, it } from "vitest";
import {
  buildComponentCatalog,
  buildInternalDashboardSummary,
  buildVillageRankings,
} from "@/lib/internal-admin/dashboard-logic";

describe("internal dashboard logic", () => {
  it("builds honest coverage and quality summary", () => {
    const summary = buildInternalDashboardSummary({
      desaRows: [
        {
          id: "desa-1",
          nama: "Arjasari",
          slug: "arjasari",
          provinsi: "Jawa Barat",
          kabupaten: "Bandung",
          kecamatan: "Arjasari",
          dataStatus: "verified",
          dataPublishedAt: new Date("2026-05-10T10:00:00.000Z"),
        },
        {
          id: "desa-2",
          nama: "Baros",
          slug: "baros",
          provinsi: "Jawa Barat",
          kabupaten: "Bandung",
          kecamatan: "Arjasari",
          dataStatus: "demo",
          dataPublishedAt: null,
        },
        {
          id: "desa-3",
          nama: "Batukarut",
          slug: "batukarut",
          provinsi: "Jawa Barat",
          kabupaten: "Bandung",
          kecamatan: "Arjasari",
          dataStatus: "demo",
          dataPublishedAt: null,
        },
      ],
      publishedFieldRows: [
        {
          desaId: "desa-1",
          sourceId: "source-1",
          componentKey: "identitas",
          componentLabel: "Identitas & Wilayah",
        },
        {
          desaId: "desa-1",
          sourceId: "source-2",
          componentKey: "anggaran",
          componentLabel: "Anggaran & Realisasi",
        },
        {
          desaId: "desa-2",
          sourceId: null,
          componentKey: "identitas",
          componentLabel: "Identitas & Wilayah",
        },
      ],
      memberRows: [
        { desaId: "desa-1", status: "VERIFIED" },
        { desaId: "desa-2", status: "LIMITED" },
      ],
      documentRows: [
        { desaId: "desa-1", status: "PUBLISHED" },
        { desaId: "desa-2", status: "WAITING_VERIFIED_APPROVAL" },
        { desaId: "desa-2", status: "FAILED" },
      ],
      voiceRows: [
        { desaId: "desa-2", status: "OPEN" },
        { desaId: "desa-2", status: "RESOLVED" },
      ],
      componentCatalog: buildComponentCatalog([
        { componentKey: "identitas", label: "Identitas & Wilayah", fieldCount: 2 },
        { componentKey: "anggaran", label: "Anggaran & Realisasi", fieldCount: 3 },
      ]),
    });

    expect(summary.coverage.trackedDesaCount).toBe(3);
    expect(summary.coverage.sourceBackedDesaCount).toBe(1);
    expect(summary.coverage.fallbackDesaCount).toBe(1);
    expect(summary.coverage.noUsablePublicDataCount).toBe(1);
    expect(summary.quality.sourceBackedFieldCount).toBe(2);
    expect(summary.quality.fallbackFieldCount).toBe(1);
    expect(summary.admins.verifiedMemberCount).toBe(1);
    expect(summary.documents.failedCount).toBe(1);
    expect(summary.traffic.kind).toBe("unconfigured");
  });

  it("builds rankings that prioritize villages without verified admin", () => {
    const rankings = buildVillageRankings({
      desaRows: [
        {
          id: "desa-1",
          nama: "Arjasari",
          slug: "arjasari",
          provinsi: "Jawa Barat",
          kabupaten: "Bandung",
          kecamatan: "Arjasari",
          dataStatus: "verified",
          dataPublishedAt: new Date("2026-05-10T10:00:00.000Z"),
        },
        {
          id: "desa-2",
          nama: "Baros",
          slug: "baros",
          provinsi: "Jawa Barat",
          kabupaten: "Bandung",
          kecamatan: "Arjasari",
          dataStatus: "demo",
          dataPublishedAt: null,
        },
      ],
      publishedFieldRows: [
        {
          desaId: "desa-1",
          sourceId: "source-1",
          componentKey: "identitas",
          componentLabel: "Identitas & Wilayah",
        },
      ],
      memberRows: [{ desaId: "desa-1", status: "VERIFIED" }],
      documentRows: [{ desaId: "desa-2", status: "WAITING_VERIFIED_APPROVAL" }],
      voiceRows: [{ desaId: "desa-2", status: "OPEN" }],
      assignments: [
        {
          desaId: "desa-1",
          components: [
            {
              id: "comp-1",
              componentKey: "identitas",
              label: "Identitas & Wilayah",
              isDefaultVisible: true,
              fieldCount: 2,
            },
          ],
        },
        {
          desaId: "desa-2",
          components: [
            {
              id: "comp-2",
              componentKey: "identitas",
              label: "Identitas & Wilayah",
              isDefaultVisible: true,
              fieldCount: 2,
            },
          ],
        },
      ],
      overrides: [],
      filters: {
        q: "",
        provinsi: "",
        kabupaten: "",
        kecamatan: "",
        preset: "no_verified_admin",
      },
      limit: 12,
    });

    expect(rankings).toHaveLength(1);
    expect(rankings[0]?.desaName).toBe("Baros");
    expect(rankings[0]?.verifiedAdminCount).toBe(0);
    expect(rankings[0]?.tone).toBe("critical");
  });
});
