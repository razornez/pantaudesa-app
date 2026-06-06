import { describe, it, expect } from "vitest";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

describe("audit event constants", () => {
  it("CLAIM_STARTED is defined", () => {
    expect(AUDIT_EVENT.CLAIM_STARTED).toBe("CLAIM_STARTED");
  });

  it("all required events exist for claim lifecycle", () => {
    expect(AUDIT_EVENT.CLAIM_STARTED).toBeDefined();
    expect(AUDIT_EVENT.CLAIM_REUSED).toBeDefined();
    expect(AUDIT_EVENT.CLAIM_METHOD_UPDATED).toBeDefined();
  });

  it("all required events exist for token generation", () => {
    expect(AUDIT_EVENT.EMAIL_TOKEN_GENERATED).toBeDefined();
    expect(AUDIT_EVENT.WEBSITE_TOKEN_GENERATED).toBeDefined();
  });

  it("all required events exist for verification", () => {
    expect(AUDIT_EVENT.EMAIL_TOKEN_VERIFIED).toBeDefined();
    expect(AUDIT_EVENT.EMAIL_TOKEN_EXPIRED).toBeDefined();
    expect(AUDIT_EVENT.EMAIL_TOKEN_INVALID).toBeDefined();
    expect(AUDIT_EVENT.WEBSITE_TOKEN_FOUND).toBeDefined();
    expect(AUDIT_EVENT.WEBSITE_TOKEN_NOT_FOUND).toBeDefined();
    expect(AUDIT_EVENT.WEBSITE_TOKEN_EXPIRED).toBeDefined();
    expect(AUDIT_EVENT.WEBSITE_CHECK_BLOCKED).toBeDefined();
  });

  it("all required events exist for email OTP flow", () => {
    expect(AUDIT_EVENT.OTP_SENT).toBeDefined();
    expect(AUDIT_EVENT.OTP_RESEND_BLOCKED).toBeDefined();
    expect(AUDIT_EVENT.OTP_INVALID).toBeDefined();
    expect(AUDIT_EVENT.OTP_VERIFY_FROZEN).toBeDefined();
    expect(AUDIT_EVENT.OTP_CONFIRMED).toBeDefined();
  });

  it("all required events exist for new claim status transitions", () => {
    expect(AUDIT_EVENT.STATUS_TO_IN_REVIEW).toBeDefined();
    expect(AUDIT_EVENT.STATUS_TO_APPROVED).toBeDefined();
    expect(AUDIT_EVENT.STATUS_TO_REJECTED).toBeDefined();
    expect(AUDIT_EVENT.STATUS_TO_PENDING).toBeDefined();
  });

  it("legacy status transition events preserved for audit log compat", () => {
    expect(AUDIT_EVENT.STATUS_TO_LIMITED).toBeDefined();
    expect(AUDIT_EVENT.STATUS_TO_VERIFIED).toBeDefined();
    expect(AUDIT_EVENT.STATUS_TO_SUSPENDED).toBeDefined();
  });

  it("all required events exist for invite", () => {
    expect(AUDIT_EVENT.INVITE_CREATED).toBeDefined();
    expect(AUDIT_EVENT.INVITE_ACCEPTED).toBeDefined();
    expect(AUDIT_EVENT.INVITE_EXPIRED).toBeDefined();
    expect(AUDIT_EVENT.INVITE_REVOKED).toBeDefined();
  });

  it("all required events exist for internal admin actions", () => {
    expect(AUDIT_EVENT.INTERNAL_CLAIM_APPROVED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_CLAIM_REJECTED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_CLAIM_FLAGGED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_COOLDOWN_APPLIED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_RENEWAL_REVIEWED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_ACCESS_REMOVED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_DOCUMENT_REVIEWED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_AI_MAPPING_RUN).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_AI_MAPPING_ACCEPTED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_DATA_PUBLISHED).toBeDefined();
    expect(AUDIT_EVENT.INTERNAL_DOCUMENT_FAILED).toBeDefined();
  });

  it("all required events exist for member management", () => {
    expect(AUDIT_EVENT.MEMBER_REVOKED).toBeDefined();
    expect(AUDIT_EVENT.MEMBER_VERIFIED).toBeDefined();
    expect(AUDIT_EVENT.DOCUMENT_APPROVED_BY_VERIFIED).toBeDefined();
    expect(AUDIT_EVENT.DOCUMENT_REJECTED_BY_VERIFIED).toBeDefined();
  });

  it("all required events exist for fake report", () => {
    expect(AUDIT_EVENT.FAKE_ADMIN_REPORT_SUBMITTED).toBeDefined();
    expect(AUDIT_EVENT.ADMIN_CLAIM_FLAGGED_BY_PUBLIC).toBeDefined();
  });

  it("all values are unique strings", () => {
    const values = Object.values(AUDIT_EVENT);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
