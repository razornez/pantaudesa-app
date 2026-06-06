-- Sprint 04-008.2: Add otpHash to DesaAdminClaim for email OTP verification.
-- The OTP value itself is never stored — only a SHA-256 hash.

ALTER TABLE "desa_admin_claims" ADD COLUMN "otpHash" TEXT;
