import { describe, it, expect } from "vitest";
import {
  isClaimTransitionAllowed,
  assertClaimTransitionAllowed,
  isMemberTransitionAllowed,
  assertMemberTransitionAllowed,
  isTransitionAllowed,
  assertTransitionAllowed,
} from "@/lib/admin-claim/status";
import type { ClaimStatus, MemberStatus } from "@/lib/admin-claim/status";

describe("claim status transitions", () => {
  const allowed: Array<[ClaimStatus, ClaimStatus]> = [
    ["PENDING",   "IN_REVIEW"],
    ["PENDING",   "REJECTED"],
    ["IN_REVIEW", "APPROVED"],
    ["IN_REVIEW", "REJECTED"],
    ["REJECTED",  "PENDING"],
  ];

  const blocked: Array<[ClaimStatus, ClaimStatus]> = [
    ["PENDING",   "APPROVED"],
    ["APPROVED",  "PENDING"],
    ["APPROVED",  "REJECTED"],
    ["APPROVED",  "IN_REVIEW"],
    ["REJECTED",  "IN_REVIEW"],
    ["REJECTED",  "APPROVED"],
    ["IN_REVIEW", "PENDING"],
  ];

  allowed.forEach(([from, to]) => {
    it(`allows claim transition ${from} → ${to}`, () => {
      expect(isClaimTransitionAllowed(from, to)).toBe(true);
    });
  });

  blocked.forEach(([from, to]) => {
    it(`blocks claim transition ${from} → ${to}`, () => {
      expect(isClaimTransitionAllowed(from, to)).toBe(false);
    });
  });

  it("assertClaimTransitionAllowed does not throw for allowed transition", () => {
    expect(() => assertClaimTransitionAllowed("PENDING", "IN_REVIEW")).not.toThrow();
  });

  it("assertClaimTransitionAllowed throws for blocked transition", () => {
    expect(() => assertClaimTransitionAllowed("APPROVED", "PENDING")).toThrow();
  });

  it("client cannot set arbitrary claim status", () => {
    expect(isClaimTransitionAllowed("PENDING", "ADMIN" as ClaimStatus)).toBe(false);
    expect(isClaimTransitionAllowed("PENDING", "" as ClaimStatus)).toBe(false);
  });
});

describe("member status transitions", () => {
  const allowed: Array<[MemberStatus, MemberStatus]> = [
    ["LIMITED",  "VERIFIED"],
    ["LIMITED",  "REVOKED"],
    ["VERIFIED", "REVOKED"],
    ["VERIFIED", "EXPIRED"],
    ["REVOKED",  "LIMITED"],
    ["EXPIRED",  "LIMITED"],
  ];

  const blocked: Array<[MemberStatus, MemberStatus]> = [
    ["REVOKED",  "VERIFIED"],
    ["EXPIRED",  "VERIFIED"],
    ["VERIFIED", "LIMITED"],
    ["LIMITED",  "EXPIRED"],
  ];

  allowed.forEach(([from, to]) => {
    it(`allows member transition ${from} → ${to}`, () => {
      expect(isMemberTransitionAllowed(from, to)).toBe(true);
    });
  });

  blocked.forEach(([from, to]) => {
    it(`blocks member transition ${from} → ${to}`, () => {
      expect(isMemberTransitionAllowed(from, to)).toBe(false);
    });
  });

  it("assertMemberTransitionAllowed does not throw for allowed transition", () => {
    expect(() => assertMemberTransitionAllowed("LIMITED", "VERIFIED")).not.toThrow();
  });

  it("assertMemberTransitionAllowed throws for blocked transition", () => {
    expect(() => assertMemberTransitionAllowed("REVOKED", "VERIFIED")).toThrow();
  });
});

describe("legacy alias compatibility", () => {
  it("isTransitionAllowed alias works for claim transitions", () => {
    expect(isTransitionAllowed("PENDING", "IN_REVIEW")).toBe(true);
    expect(isTransitionAllowed("APPROVED", "PENDING")).toBe(false);
  });

  it("assertTransitionAllowed alias works for claim transitions", () => {
    expect(() => assertTransitionAllowed("PENDING", "REJECTED")).not.toThrow();
    expect(() => assertTransitionAllowed("APPROVED", "REJECTED")).toThrow();
  });
});
