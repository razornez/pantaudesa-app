import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { db } from "@/lib/db";

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_SECONDS = 60;

export function generateCode(): string {
  return String(randomInt(100000, 1000000)); // 6 digits
}

export async function createOtp(email: string, purpose: "REGISTER" | "RESET_PIN" | "UNFREEZE"): Promise<{
  code: string;
  canResendAt: Date;
}> {
  // Check if a recent OTP was already sent (throttle)
  const recent = await db.otpCode.findFirst({
    where: {
      email,
      purpose,
      usedAt:    null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - OTP_RESEND_SECONDS * 1000) },
    },
  });

  if (recent) {
    const canResendAt = new Date(recent.createdAt.getTime() + OTP_RESEND_SECONDS * 1000);
    // Return a dummy code — actual code was already sent
    return { code: "", canResendAt };
  }

  const code     = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await db.otpCode.create({
    data: {
      email,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return { code, canResendAt: new Date(Date.now() + OTP_RESEND_SECONDS * 1000) };
}

export async function verifyOtp(
  email: string,
  code: string,
  purpose: "REGISTER" | "RESET_PIN" | "UNFREEZE"
): Promise<{ ok: boolean; error?: string }> {
  const record = await db.otpCode.findFirst({
    where: {
      email,
      purpose,
      usedAt:    null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "Kode tidak ditemukan atau sudah kedaluwarsa." };

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match)  return { ok: false, error: "Kode salah. Periksa kembali email kamu." };

  await db.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return { ok: true };
}
