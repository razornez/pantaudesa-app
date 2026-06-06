// Renewal contract for Admin Desa VERIFIED memberships.
// Per BMAD owner decisions:
// - Renewal period: 6 months from previous VERIFIED date.
// - Renewal token success goes to internal review, not auto-renew.
// - Missed renewal removes verified access; user must reapply.
// - No long grace period — same-day expiration is allowed.

export const RENEWAL_PERIOD_MONTHS = 6;
export const RENEWAL_REMINDER_DAYS = 30;       // first reminder window
export const RENEWAL_FINAL_REMINDER_DAYS = 7;  // urgent reminder window

export type RenewalState = "OK" | "DUE_SOON" | "URGENT" | "OVERDUE" | "NO_DUE_DATE";

/**
 * Returns the renewal due date by adding RENEWAL_PERIOD_MONTHS to the given date.
 * Uses calendar-month addition with overflow protection (e.g. Aug 31 + 6 months = Feb 28/29).
 */
export function addRenewalPeriod(from: Date): Date {
  const result = new Date(from.getTime());
  const targetMonth = result.getMonth() + RENEWAL_PERIOD_MONTHS;
  result.setMonth(targetMonth);
  // If the day overflowed (e.g. Aug 31 → Mar 3), pull back to last day of target month.
  if (result.getMonth() !== ((from.getMonth() + RENEWAL_PERIOD_MONTHS) % 12)) {
    result.setDate(0); // last day of previous (i.e. intended) month
  }
  return result;
}

/**
 * Days remaining until renewal is due. Negative if overdue. null if no due date.
 */
export function daysUntilRenewal(renewalDueAt: Date | null, now = new Date()): number | null {
  if (!renewalDueAt) return null;
  const diffMs = renewalDueAt.getTime() - now.getTime();
  return Math.ceil(diffMs / 86_400_000);
}

export function getRenewalState(renewalDueAt: Date | null, now = new Date()): RenewalState {
  if (!renewalDueAt) return "NO_DUE_DATE";
  const days = daysUntilRenewal(renewalDueAt, now);
  if (days === null) return "NO_DUE_DATE";
  if (days < 0) return "OVERDUE";
  if (days <= RENEWAL_FINAL_REMINDER_DAYS) return "URGENT";
  if (days <= RENEWAL_REMINDER_DAYS) return "DUE_SOON";
  return "OK";
}

export function isRenewalOverdue(renewalDueAt: Date | null, now = new Date()): boolean {
  return getRenewalState(renewalDueAt, now) === "OVERDUE";
}
