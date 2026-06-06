/**
 * Website token check — safe single-page fetch with SSRF protection.
 * No crawler. No recursive fetch. Timeout + size limit enforced.
 */

import { createHash } from "crypto";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 256 * 1024; // 256 KB

// Blocked private/internal IP ranges and hostnames
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /\.local$/i,
  /\.internal$/i,
  /metadata\.google\.internal/i,
  /169\.254\./,
];

const ALLOWED_SCHEMES = ["https:", "http:"];

export interface WebsiteCheckResult {
  found: boolean;
  blocked: boolean;
  reason?: string;
  bodySnippet?: string;
}

function isSsrfBlocked(url: URL): boolean {
  const host = url.hostname;
  return BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(host));
}

export function makeWebsiteTokenPayload(rawToken: string): string {
  // Token is placed as a meta tag or TXT-like payload on the desa website
  return `pantaudesa-verification=${rawToken}`;
}

export function hashWebsiteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function checkWebsiteForToken(
  websiteUrl: string,
  rawToken: string,
): Promise<WebsiteCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(websiteUrl);
  } catch {
    return { found: false, blocked: true, reason: "invalid_url" };
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    return { found: false, blocked: true, reason: "unsafe_scheme" };
  }

  if (isSsrfBlocked(parsed)) {
    return { found: false, blocked: true, reason: "private_ip_or_host" };
  }

  const tokenPayload = makeWebsiteTokenPayload(rawToken);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "PantauDesa-Verify/1.0" },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return { found: false, blocked: false, reason: `http_${response.status}` };
    }

    // Check Content-Type — only read text pages
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("text/")) {
      return { found: false, blocked: false, reason: "non_text_response" };
    }

    // Read with size limit
    const reader = response.body?.getReader();
    if (!reader) return { found: false, blocked: false, reason: "no_body" };

    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      chunks.push(value);
      if (received > MAX_RESPONSE_BYTES) {
        reader.cancel();
        break;
      }
    }

    const body = new TextDecoder().decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.length + c.length);
        merged.set(acc);
        merged.set(c, acc.length);
        return merged;
      }, new Uint8Array(0)),
    );

    const found = body.includes(tokenPayload);
    return {
      found,
      blocked: false,
      bodySnippet: body.slice(0, 200),
    };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      return { found: false, blocked: false, reason: "timeout" };
    }
    return { found: false, blocked: false, reason: "fetch_error" };
  }
}
