export type AdminDesaMembershipStatus = "LIMITED" | "VERIFIED" | "REVOKED" | "EXPIRED";
export type AdminDesaMemberRole = "LIMITED_ADMIN" | "VERIFIED_ADMIN";
export type AdminDesaDocumentStatus =
  | "WAITING_VERIFIED_APPROVAL"
  | "PROCESSING"
  | "PUBLISHED"
  | "REJECTED"
  | "FAILED";

export function isVerifiedAdminMember(
  status: AdminDesaMembershipStatus,
  role: AdminDesaMemberRole,
): boolean {
  return status === "VERIFIED" && role === "VERIFIED_ADMIN";
}

export function canUploadAdminDesaDocuments(status: AdminDesaMembershipStatus): boolean {
  return status === "LIMITED" || status === "VERIFIED";
}

export function canApproveAdminDesaDocuments(
  status: AdminDesaMembershipStatus,
  role: AdminDesaMemberRole,
): boolean {
  return isVerifiedAdminMember(status, role);
}

export function canRejectAdminDesaDocuments(
  status: AdminDesaMembershipStatus,
  role: AdminDesaMemberRole,
): boolean {
  return isVerifiedAdminMember(status, role);
}

export function canRevokeAdminDesaMember(input: {
  canManage: boolean;
  targetStatus: AdminDesaMembershipStatus;
  isSelf: boolean;
}): boolean {
  return input.canManage && input.targetStatus === "LIMITED" && !input.isSelf;
}

export function isAdminDesaInviteLimitReached(totalActive: number, maxAdmins: number): boolean {
  return totalActive >= maxAdmins;
}

export function getUploadedDocumentInitialStatus(
  status: Extract<AdminDesaMembershipStatus, "LIMITED" | "VERIFIED">,
): Extract<AdminDesaDocumentStatus, "WAITING_VERIFIED_APPROVAL" | "PROCESSING"> {
  return status === "VERIFIED" ? "PROCESSING" : "WAITING_VERIFIED_APPROVAL";
}
