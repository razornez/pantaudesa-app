import { describe, expect, it } from "vitest";
import {
  canReuseAdminClaimProfile,
  isFullAdminClaimProfile,
  mergeAdminClaimProfileSnapshots,
  normalizeAdminClaimProfileDetail,
} from "@/lib/admin-claim/profile-cache";
import type {
  AdminClaimProfileData,
  AdminClaimProfileSummaryData,
} from "@/lib/data/admin-claim-read";

const summaryProfile: AdminClaimProfileSummaryData = {
  detail: "summary",
  source: "database",
  currentUser: {
    id: "user_1",
    nama: "Admin Desa",
    username: "admin-desa",
    email: "admin@example.com",
    role: "DESA",
  },
  currentState: {
    key: "current-limited",
    title: "Admin Desa Limited",
    status: "limited",
    subtitle: "Akses terbatas",
    note: "Masih menunggu verifikasi.",
    desaName: "Desa Sukamaju",
    roleLabel: "Perwakilan desa",
    userName: "Admin Desa",
    dataStatus: "source-found",
    sourceLabel: "Website publik desa",
    isDemo: false,
  },
  currentClaim: null,
  currentMember: null,
};

const fullProfile: AdminClaimProfileData = {
  ...summaryProfile,
  detail: "full",
  selectedDesaId: "desa_1",
  eligibility: {
    canStartNewClaim: true,
    blockedReason: null,
    activeRelation: null,
    message: null,
  },
  desaOptions: [
    {
      id: "desa_1",
      nama: "Desa Sukamaju",
      kecamatan: "Ciawi",
      kabupaten: "Bogor",
      provinsi: "Jawa Barat",
      websiteUrl: "https://desa.example.id",
      dataStatus: "source-found",
      sourceLabel: "Website publik desa",
      officialEmailLabel: "Belum tercatat",
    },
  ],
};

describe("admin claim profile cache helpers", () => {
  it("normalizes detail query values safely", () => {
    expect(normalizeAdminClaimProfileDetail("summary")).toBe("summary");
    expect(normalizeAdminClaimProfileDetail("full")).toBe("full");
    expect(normalizeAdminClaimProfileDetail("other")).toBe("full");
    expect(normalizeAdminClaimProfileDetail(null)).toBe("full");
  });

  it("detects full profile snapshots", () => {
    expect(isFullAdminClaimProfile(summaryProfile)).toBe(false);
    expect(isFullAdminClaimProfile(fullProfile)).toBe(true);
  });

  it("reuses summary for summary readers but not for full readers", () => {
    expect(canReuseAdminClaimProfile(summaryProfile, "summary")).toBe(true);
    expect(canReuseAdminClaimProfile(summaryProfile, "full")).toBe(false);
    expect(canReuseAdminClaimProfile(fullProfile, "summary")).toBe(true);
    expect(canReuseAdminClaimProfile(fullProfile, "full")).toBe(true);
  });

  it("keeps full profile when a later summary hydration arrives", () => {
    expect(mergeAdminClaimProfileSnapshots(fullProfile, summaryProfile)).toEqual(fullProfile);
  });

  it("upgrades summary cache when full profile arrives", () => {
    expect(mergeAdminClaimProfileSnapshots(summaryProfile, fullProfile)).toEqual(fullProfile);
  });
});
