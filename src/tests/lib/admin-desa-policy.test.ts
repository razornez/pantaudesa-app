import { describe, expect, test } from "vitest";
import {
  canApproveAdminDesaDocuments,
  canRejectAdminDesaDocuments,
  canRevokeAdminDesaMember,
  canUploadAdminDesaDocuments,
  getUploadedDocumentInitialStatus,
  isAdminDesaInviteLimitReached,
  isVerifiedAdminMember,
} from "@/lib/admin-desa/policy";
import {
  parseAdminDesaInviteBody,
  parseAdminDesaRevokeBody,
} from "@/lib/admin-desa/validation";

describe("admin-desa policy", () => {
  test("verified admin permissions are derived centrally", () => {
    expect(isVerifiedAdminMember("VERIFIED", "VERIFIED_ADMIN")).toBe(true);
    expect(canApproveAdminDesaDocuments("VERIFIED", "VERIFIED_ADMIN")).toBe(true);
    expect(canApproveAdminDesaDocuments("LIMITED", "LIMITED_ADMIN")).toBe(false);
    expect(canRejectAdminDesaDocuments("VERIFIED", "VERIFIED_ADMIN")).toBe(true);
    expect(canRejectAdminDesaDocuments("LIMITED", "LIMITED_ADMIN")).toBe(false);
  });

  test("upload access and initial document status remain aligned", () => {
    expect(canUploadAdminDesaDocuments("LIMITED")).toBe(true);
    expect(canUploadAdminDesaDocuments("VERIFIED")).toBe(true);
    expect(canUploadAdminDesaDocuments("REVOKED")).toBe(false);
    expect(getUploadedDocumentInitialStatus("LIMITED")).toBe("WAITING_VERIFIED_APPROVAL");
    expect(getUploadedDocumentInitialStatus("VERIFIED")).toBe("PROCESSING");
  });

  test("revoke and invite-limit rules stay explicit", () => {
    expect(
      canRevokeAdminDesaMember({
        canManage: true,
        targetStatus: "LIMITED",
        isSelf: false,
      }),
    ).toBe(true);
    expect(
      canRevokeAdminDesaMember({
        canManage: true,
        targetStatus: "VERIFIED",
        isSelf: false,
      }),
    ).toBe(false);
    expect(isAdminDesaInviteLimitReached(5, 5)).toBe(true);
    expect(isAdminDesaInviteLimitReached(4, 5)).toBe(false);
  });
});

describe("admin-desa validation", () => {
  test("invite body is normalized and rejects self-invite", () => {
    const ok = parseAdminDesaInviteBody({
      desaId: " desa-1 ",
      email: " user@example.com ",
      inviterEmail: "owner@example.com",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value).toEqual({
        desaId: "desa-1",
        email: "user@example.com",
      });
    }

    const selfInvite = parseAdminDesaInviteBody({
      desaId: "desa-1",
      email: "owner@example.com",
      inviterEmail: "owner@example.com",
    });
    expect(selfInvite.ok).toBe(false);
  });

  test("revoke reason is optional but normalized", () => {
    expect(parseAdminDesaRevokeBody({ reason: " because " })).toEqual({
      reason: "because",
    });
    expect(parseAdminDesaRevokeBody({})).toEqual({ reason: null });
  });
});
