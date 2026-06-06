-- CreateEnum
CREATE TYPE "DesaAdminStatus" AS ENUM ('PENDING', 'LIMITED', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AdminClaimMethod" AS ENUM ('OFFICIAL_EMAIL', 'WEBSITE_TOKEN', 'SUPPORT_REVIEW', 'INVITE');

-- CreateEnum
CREATE TYPE "DesaAdminRole" AS ENUM ('LIMITED', 'VERIFIED_ADMIN');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "perangkat_desa" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "periode" TEXT,
    "fotoUrl" TEXT,
    "kontakLabel" TEXT,
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'demo',
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perangkat_desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa_admin_claims" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DesaAdminStatus" NOT NULL DEFAULT 'PENDING',
    "method" "AdminClaimMethod",
    "officialEmail" TEXT,
    "websiteUrl" TEXT,
    "tokenHash" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_admin_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa_admin_members" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DesaAdminRole" NOT NULL DEFAULT 'LIMITED',
    "status" "DesaAdminStatus" NOT NULL DEFAULT 'LIMITED',
    "invitedById" TEXT,
    "verifiedById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_admin_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa_admin_invites" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desa_admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_claim_audits" (
    "id" TEXT NOT NULL,
    "desaId" TEXT,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "claimId" TEXT,
    "eventType" TEXT NOT NULL,
    "method" TEXT,
    "previousStatus" TEXT,
    "nextStatus" TEXT,
    "evidenceType" TEXT,
    "evidenceUrl" TEXT,
    "evidenceHash" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_claim_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fake_admin_reports" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reporterUserId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "evidenceUrl" TEXT,
    "reporterEmail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fake_admin_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_attachments" (
    "id" TEXT NOT NULL,
    "dokumenId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_review_results" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "summary" TEXT,
    "suggestedStatus" TEXT,
    "confidence" TEXT,
    "riskFlags" JSONB,
    "extractedFields" JSONB,
    "rawResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_review_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "perangkat_desa_desaId_idx" ON "perangkat_desa"("desaId");

-- CreateIndex
CREATE INDEX "perangkat_desa_dataStatus_idx" ON "perangkat_desa"("dataStatus");

-- CreateIndex
CREATE INDEX "perangkat_desa_sourceId_idx" ON "perangkat_desa"("sourceId");

-- CreateIndex
CREATE INDEX "desa_admin_claims_desaId_idx" ON "desa_admin_claims"("desaId");

-- CreateIndex
CREATE INDEX "desa_admin_claims_userId_idx" ON "desa_admin_claims"("userId");

-- CreateIndex
CREATE INDEX "desa_admin_claims_status_idx" ON "desa_admin_claims"("status");

-- CreateIndex
CREATE INDEX "desa_admin_members_desaId_status_idx" ON "desa_admin_members"("desaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "desa_admin_members_desaId_userId_key" ON "desa_admin_members"("desaId", "userId");

-- CreateIndex
CREATE INDEX "desa_admin_invites_desaId_idx" ON "desa_admin_invites"("desaId");

-- CreateIndex
CREATE INDEX "desa_admin_invites_email_idx" ON "desa_admin_invites"("email");

-- CreateIndex
CREATE INDEX "desa_admin_invites_status_idx" ON "desa_admin_invites"("status");

-- CreateIndex
CREATE INDEX "admin_claim_audits_desaId_idx" ON "admin_claim_audits"("desaId");

-- CreateIndex
CREATE INDEX "admin_claim_audits_actorUserId_idx" ON "admin_claim_audits"("actorUserId");

-- CreateIndex
CREATE INDEX "admin_claim_audits_eventType_idx" ON "admin_claim_audits"("eventType");

-- CreateIndex
CREATE INDEX "admin_claim_audits_createdAt_idx" ON "admin_claim_audits"("createdAt");

-- CreateIndex
CREATE INDEX "fake_admin_reports_desaId_idx" ON "fake_admin_reports"("desaId");

-- CreateIndex
CREATE INDEX "fake_admin_reports_reportedUserId_idx" ON "fake_admin_reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "fake_admin_reports_status_idx" ON "fake_admin_reports"("status");

-- CreateIndex
CREATE INDEX "dokumen_attachments_dokumenId_idx" ON "dokumen_attachments"("dokumenId");

-- CreateIndex
CREATE INDEX "dokumen_attachments_uploadedById_idx" ON "dokumen_attachments"("uploadedById");

-- CreateIndex
CREATE INDEX "ai_review_results_targetType_targetId_idx" ON "ai_review_results"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "perangkat_desa" ADD CONSTRAINT "perangkat_desa_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perangkat_desa" ADD CONSTRAINT "perangkat_desa_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_admin_claims" ADD CONSTRAINT "desa_admin_claims_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_admin_claims" ADD CONSTRAINT "desa_admin_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_admin_members" ADD CONSTRAINT "desa_admin_members_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_admin_members" ADD CONSTRAINT "desa_admin_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_admin_invites" ADD CONSTRAINT "desa_admin_invites_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_attachments" ADD CONSTRAINT "dokumen_attachments_dokumenId_fkey" FOREIGN KEY ("dokumenId") REFERENCES "dokumen_publik"("id") ON DELETE CASCADE ON UPDATE CASCADE;
