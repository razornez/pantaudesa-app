import { describe, expect, it } from "vitest";
import { normalizeLocalRuntimeDatabaseUrl } from "@/lib/db-url";

describe("normalizeLocalRuntimeDatabaseUrl", () => {
  it("raises local Supabase pooler connection limit above the unsafe single-connection default", () => {
    const normalized = normalizeLocalRuntimeDatabaseUrl(
      "postgresql://user:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
      {},
    );

    const parsed = new URL(normalized);
    expect(parsed.searchParams.get("connection_limit")).toBe("5");
    expect(parsed.searchParams.get("pool_timeout")).toBe("20");
  });

  it("preserves explicit larger local pool settings", () => {
    const normalized = normalizeLocalRuntimeDatabaseUrl(
      "postgresql://user:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=8&pool_timeout=30",
      {
        PANTAUDESA_LOCAL_DB_CONNECTION_LIMIT: "5",
        PANTAUDESA_LOCAL_DB_POOL_TIMEOUT: "20",
      },
    );

    const parsed = new URL(normalized);
    expect(parsed.searchParams.get("connection_limit")).toBe("8");
    expect(parsed.searchParams.get("pool_timeout")).toBe("30");
  });

  it("does not rewrite production/Vercel runtime URLs", () => {
    const rawUrl =
      "postgresql://user:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

    expect(normalizeLocalRuntimeDatabaseUrl(rawUrl, { VERCEL: "1" })).toBe(rawUrl);
  });
});
