import { describe, expect, it } from "vitest";
import { diffFields } from "@/lib/intake/diff-engine";

describe("intake diff engine", () => {
  it("marks unchanged scalar values correctly", () => {
    const result = diffFields(
      { kategori: "Mandiri" },
      { kategori: "Mandiri" },
    );

    expect(result.entries[0]?.deltaType).toBe("unchanged");
    expect(result.hasChanges).toBe(false);
  });

  it("marks added values when previous value is empty", () => {
    const result = diffFields(
      { websiteUrl: null },
      { websiteUrl: "https://desa.id" },
    );

    expect(result.entries[0]?.deltaType).toBe("added");
    expect(result.addedCount).toBe(1);
  });

  it("marks removed values when next value is empty", () => {
    const result = diffFields(
      { jumlahPenduduk: 2450 },
      { jumlahPenduduk: null },
    );

    expect(result.entries[0]?.deltaType).toBe("removed");
    expect(result.removedCount).toBe(1);
  });

  it("marks updated values when both sides are filled but different", () => {
    const result = diffFields(
      { provinsi: "Jawa Barat" },
      { provinsi: "Jawa Tengah" },
    );

    expect(result.entries[0]?.deltaType).toBe("updated");
    expect(result.updatedCount).toBe(1);
    expect(result.hasChanges).toBe(true);
  });
});
