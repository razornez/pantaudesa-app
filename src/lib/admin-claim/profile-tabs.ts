// Admin Desa profile tab definitions and role-based visibility rules.
// Centralized here so layout, nav, and individual pages share the same contract.

export type AdminDesaTabKey = "profil" | "list-admin" | "dokumen" | "suara" | "notifikasi";

export interface AdminDesaTab {
  key: AdminDesaTabKey;
  href: string;
  label: string;
  description: string;
  /** Tabs that LIMITED admins can SEE. They may still have read-only access inside. */
  visibleToLimited: boolean;
}

export const ADMIN_DESA_TABS: AdminDesaTab[] = [
  {
    key: "profil",
    href: "/profil/admin-desa/profil",
    label: "Profil",
    description: "Status, desa yang dikelola, dan info verifikasi.",
    visibleToLimited: true,
  },
  {
    key: "list-admin",
    href: "/profil/admin-desa/list-admin",
    label: "List Admin",
    description: "Lihat dan kelola admin lain di desa.",
    visibleToLimited: true, // LIMITED can see roster, not invite/revoke
  },
  {
    key: "dokumen",
    href: "/profil/admin-desa/dokumen",
    label: "Dokumen",
    description: "Unggah dan lihat dokumen desa.",
    visibleToLimited: true,
  },
  {
    key: "suara",
    href: "/profil/admin-desa/suara",
    label: "Suara",
    description: "Komentar dan suara warga untuk desa kamu.",
    visibleToLimited: true,
  },
  {
    key: "notifikasi",
    href: "/profil/admin-desa/notifikasi",
    label: "Notifikasi",
    description: "Aktivitas dan pengingat terkait Admin Desa.",
    visibleToLimited: true,
  },
];

export type MemberStatus = "LIMITED" | "VERIFIED" | "REVOKED" | "EXPIRED";
export type DesaAdminRole = "LIMITED_ADMIN" | "VERIFIED_ADMIN";

/**
 * Returns the tabs visible to a member with the given status.
 * VERIFIED → all tabs.
 * LIMITED → only tabs with visibleToLimited=true.
 * REVOKED/EXPIRED → no tabs (user falls back to regular profile).
 */
export function getVisibleTabs(status: MemberStatus | null): AdminDesaTab[] {
  if (status === "VERIFIED") return ADMIN_DESA_TABS;
  if (status === "LIMITED") return ADMIN_DESA_TABS.filter((t) => t.visibleToLimited);
  return [];
}

/**
 * Capability matrix derived from BMAD 04-008b owner decisions.
 * Backend should always re-check, but this helps the UI hide actions cleanly.
 */
export function memberCanInvite(status: MemberStatus | null, role: DesaAdminRole | null): boolean {
  return status === "VERIFIED" && role === "VERIFIED_ADMIN";
}

export function memberCanRevoke(status: MemberStatus | null, role: DesaAdminRole | null): boolean {
  return status === "VERIFIED" && role === "VERIFIED_ADMIN";
}

export function memberCanPublish(status: MemberStatus | null, role: DesaAdminRole | null): boolean {
  return status === "VERIFIED" && role === "VERIFIED_ADMIN";
}

export function memberCanUploadDocument(status: MemberStatus | null): boolean {
  return status === "VERIFIED" || status === "LIMITED";
}

export function memberCanApproveDocumentForProcessing(status: MemberStatus | null, role: DesaAdminRole | null): boolean {
  return status === "VERIFIED" && role === "VERIFIED_ADMIN";
}
