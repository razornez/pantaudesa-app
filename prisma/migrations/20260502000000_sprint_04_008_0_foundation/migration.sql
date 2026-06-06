-- Sprint 04-008.0 Foundation: Separate ClaimStatus/MemberStatus, new enums, expanded audit, document/notification models.
-- Data migration: DesaAdminClaim.status LIMITED→IN_REVIEW, VERIFIED→APPROVED; DesaAdminMember.status SUSPENDED→REVOKED.
-- DesaAdminRole: LIMITED→LIMITED_ADMIN (renamed for clarity).

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('LIMITED', 'VERIFIED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('WEBSITE_NOT_OFFICIAL', 'WEBSITE_MISMATCH', 'TOKEN_NOT_VALID', 'EMAIL_NOT_CONVINCING', 'DOCUMENT_NOT_SUFFICIENT', 'SOURCE_CONFLICT', 'SUSPICIOUS_ACTIVITY', 'RENEWAL_FAILED', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentUploadStatus" AS ENUM ('WAITING_VERIFIED_APPROVAL', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- AlterEnum: Role — add INTERNAL_ADMIN
ALTER TYPE "Role" ADD VALUE 'INTERNAL_ADMIN';

-- AlterEnum: DesaAdminRole — rename LIMITED to LIMITED_ADMIN
BEGIN;
CREATE TYPE "DesaAdminRole_new" AS ENUM ('LIMITED_ADMIN', 'VERIFIED_ADMIN');
ALTER TABLE "desa_admin_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "desa_admin_members" ALTER COLUMN "role" TYPE "DesaAdminRole_new"
  USING (
    CASE "role"::text
      WHEN 'LIMITED' THEN 'LIMITED_ADMIN'::"DesaAdminRole_new"
      ELSE "role"::text::"DesaAdminRole_new"
    END
  );
ALTER TYPE "DesaAdminRole" RENAME TO "DesaAdminRole_old";
ALTER TYPE "DesaAdminRole_new" RENAME TO "DesaAdminRole";
DROP TYPE "DesaAdminRole_old";
ALTER TABLE "desa_admin_members" ALTER COLUMN "role" SET DEFAULT 'LIMITED_ADMIN';
COMMIT;

-- AlterTable: desa_admin_claims — add new fields, then migrate status column
ALTER TABLE "desa_admin_claims"
  ADD COLUMN "otpFailedAttempts"          INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN "otpResendCount"             INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN "otpFrozenUntil"             TIMESTAMP(3),
  ADD COLUMN "otpLastSentAt"              TIMESTAMP(3),
  ADD COLUMN "otpExpiresAt"               TIMESTAMP(3),
  ADD COLUMN "review_rejected_category"   "ReasonCategory",
  ADD COLUMN "review_rejected_reason"     TEXT,
  ADD COLUMN "review_rejected_instructions" TEXT,
  ADD COLUMN "reapplyAllowedAt"           TIMESTAMP(3),
  ADD COLUMN "fraudCooldownUntil"         TIMESTAMP(3),
  ADD COLUMN "supportSubmittedAt"         TIMESTAMP(3),
  ADD COLUMN "renewalDueAt"               TIMESTAMP(3),
  ADD COLUMN "renewalReviewStatus"        TEXT;

-- Migrate desa_admin_claims.status from DesaAdminStatus to ClaimStatus
-- OLD: PENDING, LIMITED, VERIFIED, REJECTED, SUSPENDED
-- NEW: PENDING, IN_REVIEW, REJECTED, APPROVED
ALTER TABLE "desa_admin_claims" ADD COLUMN "status_new" "ClaimStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "desa_admin_claims" SET "status_new" = CASE "status"::text
  WHEN 'PENDING'   THEN 'PENDING'::"ClaimStatus"
  WHEN 'LIMITED'   THEN 'IN_REVIEW'::"ClaimStatus"
  WHEN 'VERIFIED'  THEN 'APPROVED'::"ClaimStatus"
  WHEN 'REJECTED'  THEN 'REJECTED'::"ClaimStatus"
  WHEN 'SUSPENDED' THEN 'REJECTED'::"ClaimStatus"
  ELSE 'PENDING'::"ClaimStatus"
END;
ALTER TABLE "desa_admin_claims" DROP COLUMN "status";
ALTER TABLE "desa_admin_claims" RENAME COLUMN "status_new" TO "status";

-- AlterTable: desa_admin_members — add new fields, then migrate status column
ALTER TABLE "desa_admin_members"
  ADD COLUMN "invitedAt"    TIMESTAMP(3),
  ADD COLUMN "acceptedAt"   TIMESTAMP(3),
  ADD COLUMN "revokedAt"    TIMESTAMP(3),
  ADD COLUMN "revokedReason" TEXT,
  ADD COLUMN "renewalDueAt" TIMESTAMP(3);

-- Migrate desa_admin_members.status from DesaAdminStatus to MemberStatus
-- OLD: LIMITED, VERIFIED, SUSPENDED (REJECTED/PENDING shouldn't exist but handled)
-- NEW: LIMITED, VERIFIED, REVOKED, EXPIRED
ALTER TABLE "desa_admin_members" ADD COLUMN "status_new" "MemberStatus" NOT NULL DEFAULT 'LIMITED';
UPDATE "desa_admin_members" SET "status_new" = CASE "status"::text
  WHEN 'LIMITED'   THEN 'LIMITED'::"MemberStatus"
  WHEN 'VERIFIED'  THEN 'VERIFIED'::"MemberStatus"
  WHEN 'SUSPENDED' THEN 'REVOKED'::"MemberStatus"
  WHEN 'REJECTED'  THEN 'REVOKED'::"MemberStatus"
  ELSE 'LIMITED'::"MemberStatus"
END;
ALTER TABLE "desa_admin_members" DROP COLUMN "status";
ALTER TABLE "desa_admin_members" RENAME COLUMN "status_new" TO "status";

-- DropEnum: DesaAdminStatus (no longer used by any table)
DROP TYPE "DesaAdminStatus";

-- AlterTable: admin_claim_audits — add new audit fields
-- updatedAt: add with default for existing rows, then behaviour managed by Prisma ORM
ALTER TABLE "admin_claim_audits"
  ADD COLUMN "actorRole"               TEXT,
  ADD COLUMN "actorDisplayNameSnapshot" TEXT,
  ADD COLUMN "entityType"              TEXT,
  ADD COLUMN "entityId"               TEXT,
  ADD COLUMN "location"               TEXT,
  ADD COLUMN "reasonCategory"         TEXT,
  ADD COLUMN "reasonText"             TEXT,
  ADD COLUMN "beforeSnapshotJson"     JSONB,
  ADD COLUMN "afterSnapshotJson"      JSONB,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Remove the DB-level default for updatedAt; Prisma @updatedAt handles it in application layer
ALTER TABLE "admin_claim_audits" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable: admin_desa_documents
CREATE TABLE "admin_desa_documents" (
    "id"              TEXT         NOT NULL,
    "desaId"          TEXT         NOT NULL,
    "uploadedById"    TEXT,
    "title"           TEXT         NOT NULL,
    "category"        TEXT         NOT NULL,
    "storageKey"      TEXT         NOT NULL,
    "fileName"        TEXT         NOT NULL,
    "fileType"        TEXT         NOT NULL,
    "fileSize"        INTEGER      NOT NULL,
    "status"          "DocumentUploadStatus" NOT NULL DEFAULT 'WAITING_VERIFIED_APPROVAL',
    "approvedById"    TEXT,
    "approvedAt"      TIMESTAMP(3),
    "rejectedReason"  TEXT,
    "publishedAt"     TIMESTAMP(3),
    "failedReason"    TEXT,
    "aiMappingStatus" TEXT,
    "aiMappingResult" JSONB,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_desa_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: admin_desa_notifications
CREATE TABLE "admin_desa_notifications" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "desaId"    TEXT,
    "type"      TEXT         NOT NULL,
    "channel"   TEXT         NOT NULL DEFAULT 'in_app',
    "title"     TEXT         NOT NULL,
    "body"      TEXT         NOT NULL,
    "metadata"  JSONB,
    "isRead"    BOOLEAN      NOT NULL DEFAULT false,
    "readAt"    TIMESTAMP(3),
    "sentAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_desa_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_desa_documents_desaId_idx"      ON "admin_desa_documents"("desaId");
CREATE INDEX "admin_desa_documents_status_idx"      ON "admin_desa_documents"("status");
CREATE INDEX "admin_desa_documents_uploadedById_idx" ON "admin_desa_documents"("uploadedById");

CREATE INDEX "admin_desa_notifications_userId_idx"   ON "admin_desa_notifications"("userId");
CREATE INDEX "admin_desa_notifications_desaId_idx"   ON "admin_desa_notifications"("desaId");
CREATE INDEX "admin_desa_notifications_isRead_idx"   ON "admin_desa_notifications"("isRead");
CREATE INDEX "admin_desa_notifications_createdAt_idx" ON "admin_desa_notifications"("createdAt");

-- Re-create claim status index after column swap
CREATE INDEX "desa_admin_claims_status_idx" ON "desa_admin_claims"("status");

-- Re-create member status index after column swap
CREATE INDEX "desa_admin_members_desaId_status_idx" ON "desa_admin_members"("desaId", "status");

-- AddForeignKey
ALTER TABLE "admin_desa_documents" ADD CONSTRAINT "admin_desa_documents_desaId_fkey"
  FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_desa_documents" ADD CONSTRAINT "admin_desa_documents_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_desa_notifications" ADD CONSTRAINT "admin_desa_notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
