import type {
  AdminClaimProfileData,
  AdminClaimProfileSummaryData,
} from "@/lib/data/admin-claim-read";

export type AdminClaimProfileDetail = "summary" | "full";

export type AdminClaimProfileSnapshot =
  | AdminClaimProfileSummaryData
  | AdminClaimProfileData;

export function normalizeAdminClaimProfileDetail(
  value: string | null | undefined,
): AdminClaimProfileDetail {
  return value === "summary" ? "summary" : "full";
}

export function isFullAdminClaimProfile(
  value: AdminClaimProfileSnapshot | null | undefined,
): value is AdminClaimProfileData {
  return value?.detail === "full";
}

export function canReuseAdminClaimProfile(
  value: AdminClaimProfileSnapshot | null | undefined,
  requiredDetail: AdminClaimProfileDetail,
): boolean {
  if (!value) return false;
  if (requiredDetail === "summary") return true;
  return isFullAdminClaimProfile(value);
}

export function mergeAdminClaimProfileSnapshots(
  current: AdminClaimProfileSnapshot | null,
  incoming: AdminClaimProfileSnapshot,
): AdminClaimProfileSnapshot {
  if (!current) return incoming;
  if (isFullAdminClaimProfile(incoming)) return incoming;
  if (isFullAdminClaimProfile(current)) return current;
  return incoming;
}
