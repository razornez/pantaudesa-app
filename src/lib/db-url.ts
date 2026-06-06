const DEFAULT_LOCAL_POOLER_CONNECTION_LIMIT = "5";
const DEFAULT_LOCAL_POOLER_TIMEOUT_SECONDS = "20";

type RuntimeEnv = {
  VERCEL?: string;
  VERCEL_ENV?: string;
  PANTAUDESA_LOCAL_DB_CONNECTION_LIMIT?: string;
  PANTAUDESA_LOCAL_DB_POOL_TIMEOUT?: string;
};

function isLocalRuntime(env: RuntimeEnv): boolean {
  return !env.VERCEL && !env.VERCEL_ENV;
}

function shouldTuneLocalPoolerUrl(parsed: URL): boolean {
  return (
    parsed.searchParams.get("pgbouncer") === "true" ||
    parsed.hostname.includes(".pooler.supabase.com")
  );
}

function readPositiveInteger(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function normalizeLocalRuntimeDatabaseUrl(
  rawUrl: string,
  env: RuntimeEnv = process.env as RuntimeEnv,
): string {
  if (!rawUrl || !isLocalRuntime(env)) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (!["postgresql:", "postgres:"].includes(parsed.protocol)) return rawUrl;
    if (!shouldTuneLocalPoolerUrl(parsed)) return rawUrl;

    const desiredConnectionLimit =
      env.PANTAUDESA_LOCAL_DB_CONNECTION_LIMIT ?? DEFAULT_LOCAL_POOLER_CONNECTION_LIMIT;
    const desiredPoolTimeout =
      env.PANTAUDESA_LOCAL_DB_POOL_TIMEOUT ?? DEFAULT_LOCAL_POOLER_TIMEOUT_SECONDS;

    const currentConnectionLimit = readPositiveInteger(
      parsed.searchParams.get("connection_limit"),
    );
    const nextConnectionLimit = readPositiveInteger(desiredConnectionLimit);
    if (
      nextConnectionLimit &&
      (!currentConnectionLimit || currentConnectionLimit < nextConnectionLimit)
    ) {
      parsed.searchParams.set("connection_limit", String(nextConnectionLimit));
    }

    const currentPoolTimeout = readPositiveInteger(parsed.searchParams.get("pool_timeout"));
    const nextPoolTimeout = readPositiveInteger(desiredPoolTimeout);
    if (nextPoolTimeout && (!currentPoolTimeout || currentPoolTimeout < nextPoolTimeout)) {
      parsed.searchParams.set("pool_timeout", String(nextPoolTimeout));
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}
