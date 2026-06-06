import { describe, it, expect } from "vitest";
import {
  formatRupiah, formatRupiahFull,
  getStatusColor,
  getVerdictColors,
} from "@/lib/utils";

describe("formatRupiah", () => {
  it("formats millions (Jt)", () => {
    expect(formatRupiah(1_000_000)).toBe("Rp 1 Jt");
    expect(formatRupiah(500_000_000)).toBe("Rp 500 Jt");
    expect(formatRupiah(1_500_000)).toBe("Rp 2 Jt"); // toFixed(0) rounds
  });

  it("formats billions (M)", () => {
    expect(formatRupiah(1_000_000_000)).toBe("Rp 1.0 M");
    expect(formatRupiah(2_500_000_000)).toBe("Rp 2.5 M");
  });

  it("formats sub-million as locale string", () => {
    // Node locale may vary — just check it starts with Rp and contains digits
    const result = formatRupiah(500_000);
    expect(result).toMatch(/^Rp /);
    expect(result).toContain("500");
  });
});

describe("formatRupiahFull", () => {
  it("includes the raw value", () => {
    const result = formatRupiahFull(1_500_000);
    expect(result).toMatch(/^Rp /);
    expect(result).toContain("500");
  });
});

describe("getStatusColor", () => {
  it("returns emerald for baik", () => {
    expect(getStatusColor("baik")).toContain("emerald");
  });

  it("returns amber for sedang", () => {
    expect(getStatusColor("sedang")).toContain("amber");
  });

  it("returns rose for rendah", () => {
    expect(getStatusColor("rendah")).toContain("rose");
  });

  it("returns slate for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("slate");
  });
});


describe("getVerdictColors", () => {
  it("returns emerald palette for positive", () => {
    const c = getVerdictColors("positive");
    expect(c.bg).toContain("emerald");
    expect(c.text).toContain("emerald");
    expect(c.border).toContain("emerald");
  });

  it("returns amber palette for warning", () => {
    const c = getVerdictColors("warning");
    expect(c.bg).toContain("amber");
  });

  it("returns rose palette for danger", () => {
    const c = getVerdictColors("danger");
    expect(c.bg).toContain("rose");
  });

  it("returns slate palette for neutral/unknown", () => {
    const c = getVerdictColors("neutral");
    expect(c.bg).toContain("slate");
  });
});

