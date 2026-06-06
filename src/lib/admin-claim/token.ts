import { randomBytes, createHash } from "crypto";

const TOKEN_BYTES = 32;
const HASH_ALGO = "sha256";

/** Generate a cryptographically random raw token (URL-safe base64). */
export function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Hash a raw token for storage — raw token must never be stored. */
export function hashToken(raw: string): string {
  return createHash(HASH_ALGO).update(raw).digest("hex");
}

/** Compare a raw token against its stored hash in constant time. */
export function verifyTokenHash(raw: string, storedHash: string): boolean {
  const candidate = hashToken(raw);
  // constant-time compare via XOR
  if (candidate.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/** Email token TTL: 24 hours */
export const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
/** Website token TTL: 7 days */
export const WEBSITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function tokenExpiresAt(ttlMs: number): Date {
  return new Date(Date.now() + ttlMs);
}

export function isTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return Date.now() > expiresAt.getTime();
}
