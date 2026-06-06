import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  otpExpiresAt,
  freezeUntil,
  isOtpFrozen,
  isOtpExpired,
  OTP_DIGITS,
  OTP_EXPIRY_MS,
  OTP_FREEZE_MS,
  OTP_WRONG_MAX,
  OTP_RESEND_MAX,
} from "@/lib/admin-claim/otp";

describe("OTP generation", () => {
  it("produces a 6-digit numeric code", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      expect(otp).toHaveLength(OTP_DIGITS);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    }
  });

  it("produces different codes across calls (entropy check)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateOtp()));
    expect(codes.size).toBeGreaterThan(40);
  });
});

describe("OTP hashing", () => {
  it("produces a 64-char hex SHA-256 hash", () => {
    const hash = hashOtp("123456");
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it("verifyOtp returns true only for matching code", () => {
    const otp = "987654";
    const hash = hashOtp(otp);
    expect(verifyOtp(otp, hash)).toBe(true);
    expect(verifyOtp("000000", hash)).toBe(false);
    expect(verifyOtp("987655", hash)).toBe(false);
  });
});

describe("OTP expiry helpers", () => {
  it("otpExpiresAt is OTP_EXPIRY_MS in the future", () => {
    const now = Date.now();
    const exp = otpExpiresAt(now);
    expect(exp.getTime()).toBe(now + OTP_EXPIRY_MS);
  });

  it("freezeUntil is OTP_FREEZE_MS in the future", () => {
    const now = Date.now();
    const fz = freezeUntil(now);
    expect(fz.getTime()).toBe(now + OTP_FREEZE_MS);
  });

  it("isOtpFrozen handles null and past/future timestamps", () => {
    expect(isOtpFrozen(null)).toBe(false);
    expect(isOtpFrozen(new Date(Date.now() - 1000))).toBe(false);
    expect(isOtpFrozen(new Date(Date.now() + 60_000))).toBe(true);
  });

  it("isOtpExpired treats null as expired", () => {
    expect(isOtpExpired(null)).toBe(true);
    expect(isOtpExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isOtpExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});

describe("OTP policy constants", () => {
  // Policy: allow N sends/wrong attempts, freeze on (N+1)-th.
  // These constants are part of the public contract — any change must come
  // with an explicit BMAD addendum.
  it("OTP_RESEND_MAX is 3", () => {
    expect(OTP_RESEND_MAX).toBe(3);
  });
  it("OTP_WRONG_MAX is 5", () => {
    expect(OTP_WRONG_MAX).toBe(5);
  });
  it("OTP_EXPIRY_MS is 15 minutes", () => {
    expect(OTP_EXPIRY_MS).toBe(15 * 60 * 1000);
  });
  it("OTP_FREEZE_MS is 20 minutes", () => {
    expect(OTP_FREEZE_MS).toBe(20 * 60 * 1000);
  });
});

describe("OTP send counter semantics (allow N, freeze on N+1)", () => {
  // Mirrors the integer arithmetic used by send-email-otp/route.ts.
  // Resend attempts 1..3 must succeed (newCount <= MAX). The 4th must be blocked.
  function shouldFreeze(newCount: number, max: number) {
    return newCount > max;
  }

  it("attempts 1..3 are allowed when MAX = 3", () => {
    expect(shouldFreeze(1, OTP_RESEND_MAX)).toBe(false);
    expect(shouldFreeze(2, OTP_RESEND_MAX)).toBe(false);
    expect(shouldFreeze(3, OTP_RESEND_MAX)).toBe(false);
  });

  it("attempt 4 triggers freeze when MAX = 3", () => {
    expect(shouldFreeze(4, OTP_RESEND_MAX)).toBe(true);
  });

  it("wrong attempts 1..5 are allowed when MAX = 5", () => {
    for (let n = 1; n <= OTP_WRONG_MAX; n++) {
      expect(shouldFreeze(n, OTP_WRONG_MAX)).toBe(false);
    }
  });

  it("wrong attempt 6 triggers freeze when MAX = 5", () => {
    expect(shouldFreeze(OTP_WRONG_MAX + 1, OTP_WRONG_MAX)).toBe(true);
  });
});
