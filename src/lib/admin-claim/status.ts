// Centralized status types and allowed transitions for claim and membership.
// All transitions are server-enforced — client must never set status arbitrarily.

export type ClaimStatus = "PENDING" | "IN_REVIEW" | "REJECTED" | "APPROVED";

export type MemberStatus = "LIMITED" | "VERIFIED" | "REVOKED" | "EXPIRED";

// Claim transitions enforced at application layer.
// PENDING → IN_REVIEW: verification signal received (email/website token).
// IN_REVIEW → APPROVED/REJECTED: internal admin decision.
// REJECTED → PENDING: user reapplies after cooldown.
const CLAIM_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  PENDING:   ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["APPROVED", "REJECTED"],
  REJECTED:  ["PENDING"],
  APPROVED:  [],
};

// Member transitions enforced at application layer.
// LIMITED → VERIFIED: claim APPROVED by internal admin.
// VERIFIED/LIMITED → REVOKED: VERIFIED admin removes, or internal admin removes.
// VERIFIED → EXPIRED: renewal deadline passed.
// REVOKED/EXPIRED → LIMITED: re-invited after revoke.
const MEMBER_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  LIMITED:  ["VERIFIED", "REVOKED"],
  VERIFIED: ["REVOKED", "EXPIRED"],
  REVOKED:  ["LIMITED"],
  EXPIRED:  ["LIMITED"],
};

export function isClaimTransitionAllowed(from: ClaimStatus, to: ClaimStatus): boolean {
  return CLAIM_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertClaimTransitionAllowed(from: ClaimStatus, to: ClaimStatus): void {
  if (!isClaimTransitionAllowed(from, to)) {
    throw new Error(`Claim status transition ${from} → ${to} is not allowed`);
  }
}

export function isMemberTransitionAllowed(from: MemberStatus, to: MemberStatus): boolean {
  return MEMBER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertMemberTransitionAllowed(from: MemberStatus, to: MemberStatus): void {
  if (!isMemberTransitionAllowed(from, to)) {
    throw new Error(`Member status transition ${from} → ${to} is not allowed`);
  }
}

// Legacy aliases — kept for backward compat with existing routes during 04-008 migration.
// Remove after all routes are updated to use specific claim/member variants.
export const isTransitionAllowed = isClaimTransitionAllowed;
export const assertTransitionAllowed = assertClaimTransitionAllowed;
