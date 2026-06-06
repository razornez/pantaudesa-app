import { describe, it, expect } from "vitest";
import {
  makeWebsiteTokenPayload,
  checkWebsiteForToken,
  hashWebsiteToken,
} from "@/lib/admin-claim/website-token";

describe("website token payload", () => {
  it("makeWebsiteTokenPayload contains the raw token", () => {
    const raw = "abc123test";
    const payload = makeWebsiteTokenPayload(raw);
    expect(payload).toContain(raw);
    expect(payload).toContain("pantaudesa-verification");
  });

  it("hashWebsiteToken produces deterministic hex", () => {
    const raw = "test-token";
    const h1 = hashWebsiteToken(raw);
    const h2 = hashWebsiteToken(raw);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("checkWebsiteForToken SSRF protection", () => {
  it("blocks localhost URL", async () => {
    const result = await checkWebsiteForToken("http://localhost/", "token");
    expect(result.blocked).toBe(true);
    expect(result.reason).toMatch(/private_ip|private_ip_or_host/);
  });

  it("blocks 127.0.0.1", async () => {
    const result = await checkWebsiteForToken("http://127.0.0.1/", "token");
    expect(result.blocked).toBe(true);
  });

  it("blocks 192.168.x.x private IP", async () => {
    const result = await checkWebsiteForToken("http://192.168.1.1/", "token");
    expect(result.blocked).toBe(true);
  });

  it("blocks 10.x.x.x private IP", async () => {
    const result = await checkWebsiteForToken("http://10.0.0.1/page", "token");
    expect(result.blocked).toBe(true);
  });

  it("blocks ftp:// scheme", async () => {
    const result = await checkWebsiteForToken("ftp://example.com/page", "token");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("unsafe_scheme");
  });

  it("blocks invalid URL", async () => {
    const result = await checkWebsiteForToken("not-a-url", "token");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("invalid_url");
  });

  it("does not block valid https public URL (network error expected in test env)", async () => {
    // In test env we cannot reach real internet — expect timeout/fetch_error, not blocked
    const result = await checkWebsiteForToken("https://example.com/", "notatoken");
    expect(result.blocked).toBe(false);
    // found may be false (token not on example.com) but not blocked
  }, 12_000);
});
