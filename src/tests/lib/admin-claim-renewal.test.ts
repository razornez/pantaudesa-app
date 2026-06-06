import { describe, it, expect } from "vitest";
import {
  RENEWAL_PERIOD_MONTHS,
  RENEWAL_REMINDER_DAYS,
  RENEWAL_FINAL_REMINDER_DAYS,
  addRenewalPeriod,
  daysUntilRenewal,
  getRenewalState,
  isRenewalOverdue,
} from "@/lib/admin-claim/renewal";

describe("renewal contract constants", () => {
  it("RENEWAL_PERIOD_MONTHS is 6 (BMAD 04-008a)", () => {
    expect(RENEWAL_PERIOD_MONTHS).toBe(6);
  });
  it("RENEWAL_REMINDER_DAYS is 30", () => {
    expect(RENEWAL_REMINDER_DAYS).toBe(30);
  });
  it("RENEWAL_FINAL_REMINDER_DAYS is 7", () => {
    expect(RENEWAL_FINAL_REMINDER_DAYS).toBe(7);
  });
});

describe("addRenewalPeriod", () => {
  it("adds 6 months to a regular date", () => {
    const start = new Date("2026-01-15T00:00:00.000Z");
    const due = addRenewalPeriod(start);
    expect(due.getUTCFullYear()).toBe(2026);
    // 6 months after Jan = Jul (month index 6)
    expect(due.getUTCMonth()).toBe(6);
    expect(due.getUTCDate()).toBe(15);
  });

  it("rolls year over correctly", () => {
    const start = new Date("2026-09-10T00:00:00.000Z");
    const due = addRenewalPeriod(start);
    // 6 months after Sep = Mar of next year (month index 2)
    expect(due.getUTCFullYear()).toBe(2027);
    expect(due.getUTCMonth()).toBe(2);
    expect(due.getUTCDate()).toBe(10);
  });

  it("clamps end-of-month overflow (Aug 31 + 6 months → Feb 28/29)", () => {
    const start = new Date(Date.UTC(2025, 7, 31)); // Aug 31, 2025
    const due = addRenewalPeriod(start);
    // 6 months after Aug = Feb (next year). 2026 is not a leap year.
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(1); // Feb
    expect([28, 29]).toContain(due.getUTCDate());
  });
});

describe("daysUntilRenewal", () => {
  it("returns null for null input", () => {
    expect(daysUntilRenewal(null)).toBeNull();
  });

  it("returns positive days for future due date", () => {
    const now = new Date("2026-05-01T00:00:00.000Z");
    const due = new Date("2026-05-31T00:00:00.000Z");
    expect(daysUntilRenewal(due, now)).toBe(30);
  });

  it("returns negative days for past due date", () => {
    const now = new Date("2026-05-15T00:00:00.000Z");
    const due = new Date("2026-05-10T00:00:00.000Z");
    expect(daysUntilRenewal(due, now)).toBe(-5);
  });
});

describe("getRenewalState", () => {
  const now = new Date("2026-05-01T00:00:00.000Z");

  it("NO_DUE_DATE for null", () => {
    expect(getRenewalState(null, now)).toBe("NO_DUE_DATE");
  });

  it("OK for far-future due date", () => {
    const due = new Date("2026-12-01T00:00:00.000Z");
    expect(getRenewalState(due, now)).toBe("OK");
  });

  it("DUE_SOON when within 30 days", () => {
    const due = new Date("2026-05-25T00:00:00.000Z"); // 24 days
    expect(getRenewalState(due, now)).toBe("DUE_SOON");
  });

  it("URGENT when within 7 days", () => {
    const due = new Date("2026-05-05T00:00:00.000Z"); // 4 days
    expect(getRenewalState(due, now)).toBe("URGENT");
  });

  it("OVERDUE when due date is in the past", () => {
    const due = new Date("2026-04-29T00:00:00.000Z");
    expect(getRenewalState(due, now)).toBe("OVERDUE");
    expect(isRenewalOverdue(due, now)).toBe(true);
  });
});
