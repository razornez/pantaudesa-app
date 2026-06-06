import { describe, expect, it } from "vitest";
import {
  loadInternalDashboardRankings,
  parseDashboardRankingFilters,
} from "@/lib/internal-admin/dashboard-service";

describe("internal dashboard service", () => {
  it("defaults ranking preset to null until user selects a criterion", () => {
    const filters = parseDashboardRankingFilters({
      q: "Batukarut",
      provinsi: "Jawa Barat",
      preset: "",
    });

    expect(filters).toEqual({
      q: "Batukarut",
      provinsi: "Jawa Barat",
      kabupaten: "",
      kecamatan: "",
      preset: null,
    });
  });

  it("returns empty ranking response when preset is not selected", async () => {
    const response = await loadInternalDashboardRankings({
      q: "",
      provinsi: "",
      kabupaten: "",
      kecamatan: "",
      preset: null,
    });

    expect(response.kind).toBe("data");
    if (response.kind !== "data") return;
    expect(response.response.items).toEqual([]);
    expect(response.response.filters.preset).toBeNull();
  });
});
