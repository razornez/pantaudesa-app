import { createHash, randomInt } from "crypto";

export const OTP_DIGITS = 6;
export const OTP_EXPIRY_MS = 15 * 60 * 1000;       // 15 minutes
export const OTP_WRONG_MAX = 5;                      // freeze after 5 wrong attempts
export const OTP_FREEZE_MS = 20 * 60 * 1000;        // 20-minute freeze window
export const OTP_RESEND_MAX = 3;                     // freeze after 3 resends

export function generateOtp(): string {
  const code = randomInt(0, 10 ** OTP_DIGITS);
  return code.toString().padStart(OTP_DIGITS, "0");
}

export function hashOtp(plainCode: string): string {
  return createHash("sha256").update(plainCode).digest("hex");
}

export function verifyOtp(plainCode: string, storedHash: string): boolean {
  return hashOtp(plainCode) === storedHash;
}

export function otpExpiresAt(fromMs = Date.now()): Date {
  return new Date(fromMs + OTP_EXPIRY_MS);
}

export function freezeUntil(fromMs = Date.now()): Date {
  return new Date(fromMs + OTP_FREEZE_MS);
}

export function isOtpFrozen(frozenUntil: Date | null): boolean {
  if (!frozenUntil) return false;
  return frozenUntil > new Date();
}

export function isOtpExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt < new Date();
}
