import { describe, it, expect } from "vitest";
import {
  getAvatarBg, getInitial, relativeTime,
} from "@/lib/citizen-voice";

describe("getInitial", () => {
  it("returns first char uppercased for normal names", () => {
    expect(getInitial("budi")).toBe("B");
    expect(getInitial("Siti Rahayu")).toBe("S");
  });

  it("returns ? for Anonim", () => {
    expect(getInitial("Anonim")).toBe("?");
  });

  it("handles trimmed names", () => {
    expect(getInitial("  ali")).toBe("A");
  });
});

describe("getAvatarBg", () => {
  it("returns a valid Tailwind bg class", () => {
    const bg = getAvatarBg("Budi");
    expect(bg).toMatch(/^bg-\w+-500$/);
  });

  it("is deterministic — same name gives same color", () => {
    expect(getAvatarBg("Test")).toBe(getAvatarBg("Test"));
  });

  it("different names can give different colors", () => {
    // Not guaranteed but very likely with varied names
    const colors = new Set(["Alice","Bob","Charlie","Diana","Eve"].map(getAvatarBg));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("relativeTime", () => {
  const ago = (ms: number) => new Date(Date.now() - ms);

  it("returns 'Baru saja' for < 1 minute", () => {
    expect(relativeTime(ago(30_000))).toBe("Baru saja");
  });

  it("returns minutes for < 1 hour", () => {
    expect(relativeTime(ago(5 * 60_000))).toBe("5 menit lalu");
  });

  it("returns hours for < 1 day", () => {
    expect(relativeTime(ago(3 * 3_600_000))).toBe("3 jam lalu");
  });

  it("returns 'Kemarin' for exactly 1 day", () => {
    expect(relativeTime(ago(1 * 86_400_000))).toBe("Kemarin");
  });

  it("returns days for < 1 week", () => {
    expect(relativeTime(ago(4 * 86_400_000))).toBe("4 hari lalu");
  });

  it("returns weeks for < 1 month", () => {
    expect(relativeTime(ago(14 * 86_400_000))).toBe("2 minggu lalu");
  });

  it("returns months for >= 30 days", () => {
    expect(relativeTime(ago(60 * 86_400_000))).toBe("2 bulan lalu");
  });
});
