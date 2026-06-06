/**
 * QA Seed — Sprint 04-008.1
 *
 * Creates DB-backed dummy data for Admin Desa verification, membership,
 * document, and notification QA flows. All entities use clearly fake
 * identifiers and must never be promoted to production as-is.
 *
 * Run: npm run seed:qa
 *
 * Idempotent — uses upsert throughout. Safe to re-run.
 *
 * QA PIN for all seeded users: 246810
 */

import prismaPkg from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { PrismaClient } = prismaPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadLocalEnv();

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, "..", fileName);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const equalIndex = line.indexOf("=");
      if (equalIndex === -1) continue;
      const key = line.slice(0, equalIndex).trim();
      if (process.env[key]) continue;
      let value = line.slice(equalIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86_400_000);
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 86_400_000);
}

// ─── QA Desa ──────────────────────────────────────────────────────────────────

const QA_DESA = [
  {
    id: "qa-desa-a",
    slug: "qa-desa-sukamulya",
    nama: "Desa Sukamulya QA",
    kecamatan: "QA Kecamatan",
    kabupaten: "QA Kabupaten",
    provinsi: "QA Provinsi",
    websiteUrl: "https://qa-desa-a.pantaudesa.local",
    note: "1 VERIFIED + 2 LIMITED admins",
  },
  {
    id: "qa-desa-b",
    slug: "qa-desa-mekarindah",
    nama: "Desa Mekarindah QA",
    kecamatan: "QA Kecamatan",
    kabupaten: "QA Kabupaten",
    provinsi: "QA Provinsi",
    websiteUrl: "https://qa-desa-b.pantaudesa.local",
    note: "1 VERIFIED + 1 LIMITED admin",
  },
  {
    id: "qa-desa-c",
    slug: "qa-desa-barutama",
    nama: "Desa Barutama QA",
    kecamatan: "QA Kecamatan",
    kabupaten: "QA Kabupaten",
    provinsi: "QA Provinsi",
    websiteUrl: "https://qa-desa-c.pantaudesa.local",
    note: "Claims only — for verification flow QA",
  },
];

// ─── QA Users ─────────────────────────────────────────────────────────────────

const QA_USERS = [
  {
    id: "qa-internal-admin",
    email: "internal.admin.qa@pantaudesa.local",
    name: "Internal Admin QA",
    username: "internal-admin-qa",
    nama: "Internal Admin QA",
    role: "INTERNAL_ADMIN",
    note: "Internal admin — accesses review queue via normal login form",
  },
  {
    id: "qa-warga-biasa",
    email: "warga.biasa.qa@pantaudesa.local",
    name: "Warga Biasa QA",
    username: "warga-biasa-qa",
    nama: "Warga Biasa QA",
    role: "WARGA",
    note: "Normal user — cannot access internal admin pages",
  },
  {
    id: "qa-user-pending",
    email: "pengaju.pending.qa@pantaudesa.local",
    name: "Pengaju Pending QA",
    username: "pengaju-pending-qa",
    nama: "Pengaju Pending QA",
    role: "WARGA",
    note: "PENDING claim — waiting for verification action",
  },
  {
    id: "qa-user-in-review-website",
    email: "pengaju.in-review.website.qa@pantaudesa.local",
    name: "Pengaju IN_REVIEW Website QA",
    username: "pengaju-in-review-website-qa",
    nama: "Pengaju IN_REVIEW Website QA",
    role: "WARGA",
    note: "IN_REVIEW claim via WEBSITE_TOKEN — waiting internal admin decision",
  },
  {
    id: "qa-user-in-review-email",
    email: "pengaju.in-review.email.qa@pantaudesa.local",
    name: "Pengaju IN_REVIEW Email QA",
    username: "pengaju-in-review-email-qa",
    nama: "Pengaju IN_REVIEW Email QA",
    role: "WARGA",
    note: "IN_REVIEW claim via OFFICIAL_EMAIL — waiting internal admin decision",
  },
  {
    id: "qa-user-rejected",
    email: "pengaju.rejected.qa@pantaudesa.local",
    name: "Pengaju Rejected QA",
    username: "pengaju-rejected-qa",
    nama: "Pengaju Rejected QA",
    role: "WARGA",
    note: "REJECTED claim — normal rejection with reason and instructions",
  },
  {
    id: "qa-user-cooldown",
    email: "pengaju.cooldown.qa@pantaudesa.local",
    name: "Pengaju Cooldown QA",
    username: "pengaju-cooldown-qa",
    nama: "Pengaju Cooldown QA",
    role: "WARGA",
    note: "REJECTED claim — fraud/suspicious, 3-day cooldown blocks reapply",
  },
  {
    id: "qa-admin-verified-a",
    email: "admin.verified.desa-a.qa@pantaudesa.local",
    name: "Admin Verified Desa A QA",
    username: "admin-verified-desa-a-qa",
    nama: "Admin Verified Desa A QA",
    role: "DESA",
    note: "VERIFIED admin of qa-desa-a",
  },
  {
    id: "qa-admin-limited-a1",
    email: "admin.limited-1.desa-a.qa@pantaudesa.local",
    name: "Admin Limited 1 Desa A QA",
    username: "admin-limited-1-desa-a-qa",
    nama: "Admin Limited 1 Desa A QA",
    role: "DESA",
    note: "LIMITED admin of qa-desa-a (uploaded WAITING doc)",
  },
  {
    id: "qa-admin-limited-a2",
    email: "admin.limited-2.desa-a.qa@pantaudesa.local",
    name: "Admin Limited 2 Desa A QA",
    username: "admin-limited-2-desa-a-qa",
    nama: "Admin Limited 2 Desa A QA",
    role: "DESA",
    note: "LIMITED admin of qa-desa-a",
  },
  {
    id: "qa-admin-verified-b",
    email: "admin.verified.desa-b.qa@pantaudesa.local",
    name: "Admin Verified Desa B QA",
    username: "admin-verified-desa-b-qa",
    nama: "Admin Verified Desa B QA",
    role: "DESA",
    note: "VERIFIED admin of qa-desa-b",
  },
  {
    id: "qa-admin-limited-b1",
    email: "admin.limited-1.desa-b.qa@pantaudesa.local",
    name: "Admin Limited 1 Desa B QA",
    username: "admin-limited-1-desa-b-qa",
    nama: "Admin Limited 1 Desa B QA",
    role: "DESA",
    note: "LIMITED admin of qa-desa-b",
  },
];

// ─── QA Claims ────────────────────────────────────────────────────────────────

function buildQaClaims() {
  return [
    {
      id: "qa-claim-pending",
      userId: "qa-user-pending",
      desaId: "qa-desa-c",
      status: "PENDING",
      method: "OFFICIAL_EMAIL",
      officialEmail: "pemdes.barutama.qa@pantaudesa.local",
      websiteUrl: null,
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      rejectCategory: null,
      rejectReason: null,
      rejectInstructions: null,
      reapplyAllowedAt: null,
      fraudCooldownUntil: null,
    },
    {
      id: "qa-claim-in-review-website",
      userId: "qa-user-in-review-website",
      desaId: "qa-desa-c",
      status: "IN_REVIEW",
      method: "WEBSITE_TOKEN",
      officialEmail: null,
      websiteUrl: "https://qa-desa-c.pantaudesa.local",
      verifiedAt: daysAgo(1),
      rejectedAt: null,
      rejectionReason: null,
      rejectCategory: null,
      rejectReason: null,
      rejectInstructions: null,
      reapplyAllowedAt: null,
      fraudCooldownUntil: null,
    },
    {
      id: "qa-claim-in-review-email",
      userId: "qa-user-in-review-email",
      desaId: "qa-desa-c",
      status: "IN_REVIEW",
      method: "OFFICIAL_EMAIL",
      officialEmail: "kontak.barutama.qa@pantaudesa.local",
      websiteUrl: null,
      verifiedAt: daysAgo(2),
      rejectedAt: null,
      rejectionReason: null,
      rejectCategory: null,
      rejectReason: null,
      rejectInstructions: null,
      reapplyAllowedAt: null,
      fraudCooldownUntil: null,
    },
    {
      id: "qa-claim-rejected",
      userId: "qa-user-rejected",
      desaId: "qa-desa-c",
      status: "REJECTED",
      method: "OFFICIAL_EMAIL",
      officialEmail: "kontak.qa@pantaudesa.local",
      websiteUrl: null,
      verifiedAt: null,
      rejectedAt: daysAgo(3),
      rejectionReason: "Email tidak cocok dengan domain resmi desa — QA demo rejection.",
      rejectCategory: "EMAIL_NOT_CONVINCING",
      rejectReason: "Email domain tidak sesuai dengan domain resmi desa yang tercatat.",
      rejectInstructions: "Gunakan email dengan domain resmi desa (contoh: @desabarutama.id). Jika domain belum tersedia, gunakan jalur Support Review.",
      reapplyAllowedAt: daysAgo(0),
      fraudCooldownUntil: null,
    },
    {
      id: "qa-claim-cooldown",
      userId: "qa-user-cooldown",
      desaId: "qa-desa-c",
      status: "REJECTED",
      method: "WEBSITE_TOKEN",
      officialEmail: null,
      websiteUrl: "https://fake-desa-c.example.com",
      verifiedAt: null,
      rejectedAt: daysAgo(1),
      rejectionReason: "Aktivitas mencurigakan — QA fraud cooldown demo.",
      rejectCategory: "SUSPICIOUS_ACTIVITY",
      rejectReason: "Pola permintaan tidak wajar terdeteksi selama verifikasi.",
      rejectInstructions: "Akun ini dikenai masa tunggu 3 hari. Tidak bisa mengajukan ulang sebelum masa tunggu berakhir.",
      reapplyAllowedAt: daysFromNow(2),
      fraudCooldownUntil: daysFromNow(2),
    },
    // APPROVED claims for verified admins (claim lifecycle completed)
    {
      id: "qa-claim-approved-a",
      userId: "qa-admin-verified-a",
      desaId: "qa-desa-a",
      status: "APPROVED",
      method: "WEBSITE_TOKEN",
      officialEmail: null,
      websiteUrl: "https://qa-desa-a.pantaudesa.local",
      verifiedAt: daysAgo(10),
      rejectedAt: null,
      rejectionReason: null,
      rejectCategory: null,
      rejectReason: null,
      rejectInstructions: null,
      reapplyAllowedAt: null,
      fraudCooldownUntil: null,
    },
    {
      id: "qa-claim-approved-b",
      userId: "qa-admin-verified-b",
      desaId: "qa-desa-b",
      status: "APPROVED",
      method: "OFFICIAL_EMAIL",
      officialEmail: "verified-b.qa@pantaudesa.local",
      websiteUrl: null,
      verifiedAt: daysAgo(15),
      rejectedAt: null,
      rejectionReason: null,
      rejectCategory: null,
      rejectReason: null,
      rejectInstructions: null,
      reapplyAllowedAt: null,
      fraudCooldownUntil: null,
    },
  ];
}

// ─── QA Members ───────────────────────────────────────────────────────────────

const QA_MEMBERS = [
  {
    id: "qa-member-verified-a",
    userId: "qa-admin-verified-a",
    desaId: "qa-desa-a",
    role: "VERIFIED_ADMIN",
    status: "VERIFIED",
    invitedById: "qa-internal-admin",
    verifiedById: "qa-internal-admin",
  },
  {
    id: "qa-member-limited-a1",
    userId: "qa-admin-limited-a1",
    desaId: "qa-desa-a",
    role: "LIMITED_ADMIN",
    status: "LIMITED",
    invitedById: "qa-admin-verified-a",
    verifiedById: null,
  },
  {
    id: "qa-member-limited-a2",
    userId: "qa-admin-limited-a2",
    desaId: "qa-desa-a",
    role: "LIMITED_ADMIN",
    status: "LIMITED",
    invitedById: "qa-admin-verified-a",
    verifiedById: null,
  },
  {
    id: "qa-member-verified-b",
    userId: "qa-admin-verified-b",
    desaId: "qa-desa-b",
    role: "VERIFIED_ADMIN",
    status: "VERIFIED",
    invitedById: "qa-internal-admin",
    verifiedById: "qa-internal-admin",
  },
  {
    id: "qa-member-limited-b1",
    userId: "qa-admin-limited-b1",
    desaId: "qa-desa-b",
    role: "LIMITED_ADMIN",
    status: "LIMITED",
    invitedById: "qa-admin-verified-b",
    verifiedById: null,
  },
];

// ─── QA AdminDesaDocuments ────────────────────────────────────────────────────

const QA_DOCUMENTS = [
  {
    id: "qa-doc-waiting",
    desaId: "qa-desa-a",
    uploadedById: "qa-admin-limited-a1",
    title: "APBDes 2026 — QA Waiting Verified Approval",
    category: "apbdes",
    storageKey: "qa/desa-a/apbdes-2026-waiting.pdf",
    fileName: "apbdes-2026.pdf",
    fileType: "application/pdf",
    fileSize: 512000,
    status: "WAITING_VERIFIED_APPROVAL",
    approvedById: null,
    approvedAt: null,
    rejectedReason: null,
    publishedAt: null,
    failedReason: null,
    aiMappingStatus: null,
    aiMappingResult: null,
  },
  {
    id: "qa-doc-processing",
    desaId: "qa-desa-a",
    uploadedById: "qa-admin-verified-a",
    title: "RKP Desa 2026 — QA Processing",
    category: "rkpdes",
    storageKey: "qa/desa-a/rkpdes-2026-processing.pdf",
    fileName: "rkpdes-2026.pdf",
    fileType: "application/pdf",
    fileSize: 768000,
    status: "PROCESSING",
    approvedById: "qa-admin-verified-a",
    approvedAt: daysAgo(2),
    rejectedReason: null,
    publishedAt: null,
    failedReason: null,
    aiMappingStatus: "PENDING",
    aiMappingResult: null,
  },
  {
    id: "qa-doc-published",
    desaId: "qa-desa-a",
    uploadedById: "qa-admin-verified-a",
    title: "Laporan Realisasi APBDes 2025 — QA Published",
    category: "realisasi",
    storageKey: "qa/desa-a/realisasi-2025-published.pdf",
    fileName: "realisasi-2025.pdf",
    fileType: "application/pdf",
    fileSize: 1024000,
    status: "PUBLISHED",
    approvedById: "qa-internal-admin",
    approvedAt: daysAgo(10),
    rejectedReason: null,
    publishedAt: daysAgo(8),
    failedReason: null,
    aiMappingStatus: "DONE",
    aiMappingResult: { profileDesa: "Desa Sukamulya QA", tahunData: 2025 },
  },
  {
    id: "qa-doc-failed",
    desaId: "qa-desa-a",
    uploadedById: "qa-admin-limited-a2",
    title: "LPPD 2024 — QA Failed",
    category: "lppd",
    storageKey: "qa/desa-a/lppd-2024-failed.pdf",
    fileName: "lppd-2024.pdf",
    fileType: "application/pdf",
    fileSize: 256000,
    status: "FAILED",
    approvedById: null,
    approvedAt: null,
    rejectedReason: null,
    publishedAt: null,
    failedReason: "File tidak dapat dibaca — format tidak sesuai atau rusak. Upload ulang dengan file yang valid.",
    aiMappingStatus: "FAILED",
    aiMappingResult: null,
  },
  {
    id: "qa-doc-desa-b-processing",
    desaId: "qa-desa-b",
    uploadedById: "qa-admin-verified-b",
    title: "APBDes 2026 Desa B — QA Processing",
    category: "apbdes",
    storageKey: "qa/desa-b/apbdes-2026-processing.pdf",
    fileName: "apbdes-desa-b-2026.pdf",
    fileType: "application/pdf",
    fileSize: 614400,
    status: "PROCESSING",
    approvedById: "qa-admin-verified-b",
    approvedAt: daysAgo(1),
    rejectedReason: null,
    publishedAt: null,
    failedReason: null,
    aiMappingStatus: null,
    aiMappingResult: null,
  },
];

// ─── QA Notifications ─────────────────────────────────────────────────────────

function buildQaNotifications() {
  return [
    // For VERIFIED admin of desa-a
    {
      id: "qa-notif-doc-waiting-approval",
      userId: "qa-admin-verified-a",
      desaId: "qa-desa-a",
      type: "DOCUMENT_UPLOADED_WAITING",
      channel: "in_app",
      title: "Dokumen menunggu persetujuan Anda",
      body: "Admin Desa Limited telah mengunggah APBDes 2026. Dokumen ini perlu persetujuan Anda sebelum diproses lebih lanjut.",
      metadata: { documentId: "qa-doc-waiting", uploadedBy: "qa-admin-limited-a1" },
      isRead: false,
    },
    {
      id: "qa-notif-doc-published",
      userId: "qa-admin-verified-a",
      desaId: "qa-desa-a",
      type: "DOCUMENT_PUBLISHED",
      channel: "in_app",
      title: "Dokumen berhasil dipublikasikan",
      body: "Laporan Realisasi APBDes 2025 telah dipublikasikan dan data desa diperbarui.",
      metadata: { documentId: "qa-doc-published" },
      isRead: true,
    },
    {
      id: "qa-notif-invite-accepted",
      userId: "qa-admin-verified-a",
      desaId: "qa-desa-a",
      type: "INVITE_ACCEPTED",
      channel: "in_app",
      title: "Undangan diterima",
      body: "Admin Limited 1 telah menerima undangan dan bergabung sebagai Admin Desa terbatas.",
      metadata: { inviteeId: "qa-admin-limited-a1" },
      isRead: true,
    },
    // For LIMITED admin of desa-a
    {
      id: "qa-notif-limited-doc-waiting",
      userId: "qa-admin-limited-a1",
      desaId: "qa-desa-a",
      type: "DOCUMENT_UPLOADED_WAITING",
      channel: "in_app",
      title: "Dokumen Anda menunggu persetujuan",
      body: "APBDes 2026 yang Anda unggah sedang menunggu persetujuan dari Admin Desa Terverifikasi.",
      metadata: { documentId: "qa-doc-waiting" },
      isRead: false,
    },
    {
      id: "qa-notif-limited-doc-failed",
      userId: "qa-admin-limited-a2",
      desaId: "qa-desa-a",
      type: "DOCUMENT_FAILED",
      channel: "in_app",
      title: "Dokumen gagal diproses",
      body: "LPPD 2024 gagal diproses: File tidak dapat dibaca — format tidak sesuai atau rusak. Upload ulang dengan file yang valid.",
      metadata: { documentId: "qa-doc-failed", failedReason: "File tidak dapat dibaca" },
      isRead: false,
    },
    {
      id: "qa-notif-renewal-reminder",
      userId: "qa-admin-verified-a",
      desaId: "qa-desa-a",
      type: "RENEWAL_REMINDER",
      channel: "in_app",
      title: "Pengingat perpanjangan verifikasi",
      body: "Verifikasi Admin Desa Anda akan habis dalam 30 hari. Segera lakukan perpanjangan.",
      metadata: { renewalDueAt: daysFromNow(30).toISOString() },
      isRead: false,
    },
    // NOTE: Internal admin notifications are NOT created via createNotifications for
    // in-app delivery. Internal admins check the review queue manually. Only the
    // following in-app notification types are valid per NOTIF_TYPE:
    // DOCUMENT_UPLOADED_WAITING, DOCUMENT_APPROVED, DOCUMENT_PUBLISHED,
    // DOCUMENT_FAILED, INVITE_ACCEPTED, RENEWAL_REMINDER, RENEWAL_EXPIRED,
    // CLAIM_APPROVED, CLAIM_REJECTED, VOICE_CREATED, VOICE_REPLY_CREATED,
    // VOICE_VOTED, VOICE_HELPFUL
  ];
}

// ─── QA Audit Rows ────────────────────────────────────────────────────────────

function buildQaAuditRows() {
  return [
    {
      id: "qa-audit-claim-pending",
      desaId: "qa-desa-c",
      actorUserId: "qa-user-pending",
      targetUserId: "qa-user-pending",
      entityType: "DesaAdminClaim",
      entityId: "qa-claim-pending",
      claimId: "qa-claim-pending",
      eventType: "CLAIM_STARTED",
      method: "OFFICIAL_EMAIL",
      previousStatus: null,
      nextStatus: "PENDING",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-claim-in-review-website",
      desaId: "qa-desa-c",
      actorUserId: "qa-user-in-review-website",
      targetUserId: "qa-user-in-review-website",
      entityType: "DesaAdminClaim",
      entityId: "qa-claim-in-review-website",
      claimId: "qa-claim-in-review-website",
      eventType: "WEBSITE_TOKEN_FOUND",
      method: "WEBSITE_TOKEN",
      previousStatus: "PENDING",
      nextStatus: "IN_REVIEW",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-claim-in-review-email",
      desaId: "qa-desa-c",
      actorUserId: "qa-user-in-review-email",
      targetUserId: "qa-user-in-review-email",
      entityType: "DesaAdminClaim",
      entityId: "qa-claim-in-review-email",
      claimId: "qa-claim-in-review-email",
      eventType: "EMAIL_TOKEN_VERIFIED",
      method: "OFFICIAL_EMAIL",
      previousStatus: "PENDING",
      nextStatus: "IN_REVIEW",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-claim-rejected",
      desaId: "qa-desa-c",
      actorUserId: "qa-internal-admin",
      targetUserId: "qa-user-rejected",
      entityType: "DesaAdminClaim",
      entityId: "qa-claim-rejected",
      claimId: "qa-claim-rejected",
      eventType: "INTERNAL_CLAIM_REJECTED",
      method: "OFFICIAL_EMAIL",
      previousStatus: "IN_REVIEW",
      nextStatus: "REJECTED",
      reasonCategory: "EMAIL_NOT_CONVINCING",
      reasonText: "Email domain tidak sesuai dengan domain resmi desa.",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-claim-cooldown",
      desaId: "qa-desa-c",
      actorUserId: "qa-internal-admin",
      targetUserId: "qa-user-cooldown",
      entityType: "DesaAdminClaim",
      entityId: "qa-claim-cooldown",
      claimId: "qa-claim-cooldown",
      eventType: "INTERNAL_COOLDOWN_APPLIED",
      method: "WEBSITE_TOKEN",
      previousStatus: "IN_REVIEW",
      nextStatus: "REJECTED",
      reasonCategory: "SUSPICIOUS_ACTIVITY",
      reasonText: "Aktivitas mencurigakan selama verifikasi.",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-claim-approved-a",
      desaId: "qa-desa-a",
      actorUserId: "qa-internal-admin",
      targetUserId: "qa-admin-verified-a",
      entityType: "DesaAdminClaim",
      entityId: "qa-claim-approved-a",
      claimId: "qa-claim-approved-a",
      eventType: "INTERNAL_CLAIM_APPROVED",
      method: "WEBSITE_TOKEN",
      previousStatus: "IN_REVIEW",
      nextStatus: "APPROVED",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-member-verified-a",
      desaId: "qa-desa-a",
      actorUserId: "qa-internal-admin",
      targetUserId: "qa-admin-verified-a",
      entityType: "DesaAdminMember",
      entityId: "qa-member-verified-a",
      claimId: "qa-claim-approved-a",
      eventType: "MEMBER_VERIFIED",
      method: null,
      previousStatus: "LIMITED",
      nextStatus: "VERIFIED",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-invite-limited-a1",
      desaId: "qa-desa-a",
      actorUserId: "qa-admin-verified-a",
      targetUserId: "qa-admin-limited-a1",
      entityType: "DesaAdminMember",
      entityId: "qa-member-limited-a1",
      claimId: null,
      eventType: "INVITE_CREATED",
      method: "INVITE",
      previousStatus: null,
      nextStatus: "LIMITED",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
    {
      id: "qa-audit-doc-published",
      desaId: "qa-desa-a",
      actorUserId: "qa-internal-admin",
      targetUserId: null,
      entityType: "AdminDesaDocument",
      entityId: "qa-doc-published",
      claimId: null,
      eventType: "INTERNAL_DATA_PUBLISHED",
      method: null,
      previousStatus: "PROCESSING",
      nextStatus: "PUBLISHED",
      ipAddress: "127.0.0.1",
      userAgent: "QA Seed",
    },
  ];
}

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedQaDesa() {
  console.log("Seeding QA desa...");
  for (const desa of QA_DESA) {
    await prisma.desa.upsert({
      where: { id: desa.id },
      update: {
        nama: desa.nama,
        slug: desa.slug,
        kecamatan: desa.kecamatan,
        kabupaten: desa.kabupaten,
        provinsi: desa.provinsi,
        websiteUrl: desa.websiteUrl,
        dataStatus: "demo",
      },
      create: {
        id: desa.id,
        nama: desa.nama,
        slug: desa.slug,
        kecamatan: desa.kecamatan,
        kabupaten: desa.kabupaten,
        provinsi: desa.provinsi,
        websiteUrl: desa.websiteUrl,
        dataStatus: "demo",
      },
    });
  }
  console.log(`  → ${QA_DESA.length} desa seeded`);
}

async function seedQaUsers(pinHash) {
  console.log("Seeding QA users...");
  for (const user of QA_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        nama: user.nama,
        username: user.username,
        role: user.role,
        emailVerified: new Date(),
        pinHash,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        nama: user.nama,
        username: user.username,
        role: user.role,
        emailVerified: new Date(),
        pinHash,
      },
    });
  }
  console.log(`  → ${QA_USERS.length} users seeded`);
}

async function seedQaClaims() {
  console.log("Seeding QA claims...");
  const claims = buildQaClaims();
  for (const claim of claims) {
    await prisma.desaAdminClaim.upsert({
      where: { id: claim.id },
      update: {
        desaId: claim.desaId,
        userId: claim.userId,
        status: claim.status,
        method: claim.method,
        officialEmail: claim.officialEmail,
        websiteUrl: claim.websiteUrl,
        tokenHash: null,
        tokenExpiresAt: null,
        verifiedAt: claim.verifiedAt,
        rejectedAt: claim.rejectedAt,
        rejectionReason: claim.rejectionReason,
        rejectCategory: claim.rejectCategory,
        rejectReason: claim.rejectReason,
        rejectInstructions: claim.rejectInstructions,
        reapplyAllowedAt: claim.reapplyAllowedAt,
        fraudCooldownUntil: claim.fraudCooldownUntil,
      },
      create: {
        id: claim.id,
        desaId: claim.desaId,
        userId: claim.userId,
        status: claim.status,
        method: claim.method,
        officialEmail: claim.officialEmail,
        websiteUrl: claim.websiteUrl,
        tokenHash: null,
        tokenExpiresAt: null,
        verifiedAt: claim.verifiedAt,
        rejectedAt: claim.rejectedAt,
        rejectionReason: claim.rejectionReason,
        rejectCategory: claim.rejectCategory,
        rejectReason: claim.rejectReason,
        rejectInstructions: claim.rejectInstructions,
        reapplyAllowedAt: claim.reapplyAllowedAt,
        fraudCooldownUntil: claim.fraudCooldownUntil,
      },
    });
  }
  console.log(`  → ${claims.length} claims seeded`);
}

async function seedQaMembers() {
  console.log("Seeding QA members...");
  for (const member of QA_MEMBERS) {
    await prisma.desaAdminMember.upsert({
      where: { desaId_userId: { desaId: member.desaId, userId: member.userId } },
      update: {
        role: member.role,
        status: member.status,
        invitedById: member.invitedById,
        verifiedById: member.verifiedById,
      },
      create: {
        id: member.id,
        desaId: member.desaId,
        userId: member.userId,
        role: member.role,
        status: member.status,
        invitedById: member.invitedById,
        verifiedById: member.verifiedById,
      },
    });
  }
  console.log(`  → ${QA_MEMBERS.length} members seeded`);
}

async function seedQaDocuments() {
  console.log("Seeding QA admin documents...");
  for (const doc of QA_DOCUMENTS) {
    await prisma.adminDesaDocument.upsert({
      where: { id: doc.id },
      update: {
        desaId: doc.desaId,
        uploadedById: doc.uploadedById,
        title: doc.title,
        category: doc.category,
        storageKey: doc.storageKey,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
        approvedById: doc.approvedById,
        approvedAt: doc.approvedAt,
        rejectedReason: doc.rejectedReason,
        publishedAt: doc.publishedAt,
        failedReason: doc.failedReason,
        aiMappingStatus: doc.aiMappingStatus,
        aiMappingResult: doc.aiMappingResult,
      },
      create: {
        id: doc.id,
        desaId: doc.desaId,
        uploadedById: doc.uploadedById,
        title: doc.title,
        category: doc.category,
        storageKey: doc.storageKey,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
        approvedById: doc.approvedById,
        approvedAt: doc.approvedAt,
        rejectedReason: doc.rejectedReason,
        publishedAt: doc.publishedAt,
        failedReason: doc.failedReason,
        aiMappingStatus: doc.aiMappingStatus,
        aiMappingResult: doc.aiMappingResult,
      },
    });
  }
  console.log(`  → ${QA_DOCUMENTS.length} documents seeded`);
}

async function seedQaNotifications() {
  console.log("Seeding QA notifications...");
  const notifications = buildQaNotifications();
  for (const notif of notifications) {
    await prisma.adminDesaNotification.upsert({
      where: { id: notif.id },
      update: {
        userId: notif.userId,
        desaId: notif.desaId,
        type: notif.type,
        channel: notif.channel,
        title: notif.title,
        body: notif.body,
        metadata: notif.metadata,
        isRead: notif.isRead,
      },
      create: {
        id: notif.id,
        userId: notif.userId,
        desaId: notif.desaId,
        type: notif.type,
        channel: notif.channel,
        title: notif.title,
        body: notif.body,
        metadata: notif.metadata,
        isRead: notif.isRead,
      },
    });
  }
  console.log(`  → ${notifications.length} notifications seeded`);
}

async function seedQaAudit() {
  console.log("Seeding QA audit rows...");
  const auditRows = buildQaAuditRows();
  for (const audit of auditRows) {
    await prisma.adminClaimAudit.upsert({
      where: { id: audit.id },
      update: {
        desaId: audit.desaId,
        actorUserId: audit.actorUserId,
        targetUserId: audit.targetUserId ?? null,
        entityType: audit.entityType ?? null,
        entityId: audit.entityId ?? null,
        claimId: audit.claimId ?? null,
        eventType: audit.eventType,
        method: audit.method ?? null,
        previousStatus: audit.previousStatus ?? null,
        nextStatus: audit.nextStatus ?? null,
        reasonCategory: audit.reasonCategory ?? null,
        reasonText: audit.reasonText ?? null,
        ipAddress: audit.ipAddress ?? null,
        userAgent: audit.userAgent ?? null,
      },
      create: {
        id: audit.id,
        desaId: audit.desaId,
        actorUserId: audit.actorUserId,
        targetUserId: audit.targetUserId ?? null,
        entityType: audit.entityType ?? null,
        entityId: audit.entityId ?? null,
        claimId: audit.claimId ?? null,
        eventType: audit.eventType,
        method: audit.method ?? null,
        previousStatus: audit.previousStatus ?? null,
        nextStatus: audit.nextStatus ?? null,
        reasonCategory: audit.reasonCategory ?? null,
        reasonText: audit.reasonText ?? null,
        ipAddress: audit.ipAddress ?? null,
        userAgent: audit.userAgent ?? null,
      },
    });
  }
  console.log(`  → ${auditRows.length} audit rows seeded`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== QA Seed — Sprint 04-008.1 ===");
  console.log("All QA emails use domain @pantaudesa.local — not real.");
  console.log("QA PIN for all users: 246810\n");

  const pinHash = await bcrypt.hash("246810", 10);

  await seedQaDesa();
  await seedQaUsers(pinHash);
  await seedQaClaims();
  await seedQaMembers();
  await seedQaDocuments();
  await seedQaNotifications();
  await seedQaAudit();

  console.log("\n=== QA Seed Complete ===");
  console.log("Internal admin: internal.admin.qa@pantaudesa.local (PIN 246810)");
  console.log("Desa A (VERIFIED+2LIMITED): qa-desa-a");
  console.log("Desa B (VERIFIED+1LIMITED): qa-desa-b");
  console.log("Desa C (claims only):       qa-desa-c");
}

main()
  .catch((err) => {
    console.error("QA seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
