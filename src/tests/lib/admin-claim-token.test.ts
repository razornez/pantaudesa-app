import { describe, it, expect } from "vitest";
import {
  generateRawToken,
  hashToken,
  verifyTokenHash,
  tokenExpiresAt,
  isTokenExpired,
  EMAIL_TOKEN_TTL_MS,
  WEBSITE_TOKEN_TTL_MS,
} from "@/lib/admin-claim/token";

describe("admin-claim token utils", () => {
  it("generateRawToken produces a non-empty string", () => {
    const token = generateRawToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("two generateRawToken calls produce different tokens", () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });

  it("hashToken produces hex string — raw token not stored", () => {
    const raw = generateRawToken();
    const hash = hashToken(raw);
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    expect(hash).not.toBe(raw);
  });

  it("verifyTokenHash returns true for matching raw/hash pair", () => {
    const raw = generateRawToken();
    const hash = hashToken(raw);
    expect(verifyTokenHash(raw, hash)).toBe(true);
  });

  it("verifyTokenHash returns false for wrong raw token", () => {
    const raw = generateRawToken();
    const hash = hashToken(raw);
    const wrongRaw = generateRawToken();
    expect(verifyTokenHash(wrongRaw, hash)).toBe(false);
  });

  it("verifyTokenHash returns false for tampered hash", () => {
    const raw = generateRawToken();
    const hash = hashToken(raw);
    const tampered = hash.slice(0, -2) + "00";
    expect(verifyTokenHash(raw, tampered)).toBe(false);
  });

  it("tokenExpiresAt sets future date for email TTL", () => {
    const before = Date.now();
    const exp = tokenExpiresAt(EMAIL_TOKEN_TTL_MS);
    const after = Date.now();
    expect(exp.getTime()).toBeGreaterThanOrEqual(before + EMAIL_TOKEN_TTL_MS);
    expect(exp.getTime()).toBeLessThanOrEqual(after + EMAIL_TOKEN_TTL_MS + 100);
  });

  it("tokenExpiresAt sets future date for website TTL", () => {
    const exp = tokenExpiresAt(WEBSITE_TOKEN_TTL_MS);
    expect(exp.getTime()).toBeGreaterThan(Date.now() + EMAIL_TOKEN_TTL_MS);
  });

  it("isTokenExpired returns false for future date", () => {
    const future = new Date(Date.now() + 60_000);
    expect(isTokenExpired(future)).toBe(false);
  });

  it("isTokenExpired returns true for past date", () => {
    const past = new Date(Date.now() - 1);
    expect(isTokenExpired(past)).toBe(true);
  });

  it("isTokenExpired returns true for null", () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
  });
});
