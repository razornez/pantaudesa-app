import { describe, expect, it } from "vitest";
import { buildDefaultSourceName } from "@/components/internal-admin/intake/source-mode";

describe("buildDefaultSourceName", () => {
  it("builds readable default labels per source type", () => {
    expect(buildDefaultSourceName("OFFICIAL_WEBSITE", "Batukarut")).toBe("Web Desa Batukarut");
    expect(buildDefaultSourceName("GOVERNMENT_SOURCE", "Arjasari")).toBe(
      "Sumber Pemerintah Arjasari",
    );
    expect(buildDefaultSourceName("PROVINCE_PARTNER", "Baros")).toBe(
      "Sumber Mitra Provinsi Baros",
    );
    expect(buildDefaultSourceName("TRUSTED_GOVERNANCE_SOURCE", "Batujajar")).toBe(
      "Sumber Governance Batujajar",
    );
  });

  it("falls back gracefully when desa name is not chosen yet", () => {
    expect(buildDefaultSourceName("OFFICIAL_WEBSITE", null)).toBe("Web Desa");
  });
});
