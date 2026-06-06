import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/index.js";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

const CONNECT_TIMEOUT_MS = Number(process.env.DB_DOCTOR_CONNECT_TIMEOUT_MS ?? 10_000);
const PRISMA_TIMEOUT_MS = Number(process.env.DB_DOCTOR_PRISMA_TIMEOUT_MS ?? 20_000);
const MIGRATE_TIMEOUT_MS = Number(process.env.DB_DOCTOR_MIGRATE_TIMEOUT_MS ?? 45_000);
const DEFAULT_LOCAL_POOLER_CONNECTION_LIMIT = "5";
const DEFAULT_LOCAL_POOLER_TIMEOUT_SECONDS = "20";

function safeUrlInfo(name, rawUrl) {
  if (!rawUrl) {
    return {
      name,
      configured: false,
      valid: false,
      host: null,
      port: null,
      database: null,
      pgbouncer: null,
    };
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      name,
      configured: true,
      valid: ["postgresql:", "postgres:"].includes(parsed.protocol),
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || null,
      pgbouncer: parsed.searchParams.get("pgbouncer"),
      connection_limit: parsed.searchParams.get("connection_limit"),
      pool_timeout: parsed.searchParams.get("pool_timeout"),
    };
  } catch {
    return {
      name,
      configured: true,
      valid: false,
      host: null,
      port: null,
      database: null,
      pgbouncer: null,
    };
  }
}

function isLocalRuntime() {
  return !process.env.VERCEL && !process.env.VERCEL_ENV;
}

function readPositiveInteger(value) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeLocalRuntimeDatabaseUrl(rawUrl) {
  if (!rawUrl || !isLocalRuntime()) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (!["postgresql:", "postgres:"].includes(parsed.protocol)) return rawUrl;
    const shouldTune =
      parsed.searchParams.get("pgbouncer") === "true" ||
      parsed.hostname.includes(".pooler.supabase.com");
    if (!shouldTune) return rawUrl;

    const desiredConnectionLimit =
      process.env.PANTAUDESA_LOCAL_DB_CONNECTION_LIMIT ??
      DEFAULT_LOCAL_POOLER_CONNECTION_LIMIT;
    const desiredPoolTimeout =
      process.env.PANTAUDESA_LOCAL_DB_POOL_TIMEOUT ?? DEFAULT_LOCAL_POOLER_TIMEOUT_SECONDS;

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

function pickRuntimeUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const directUrl = process.env.DIRECT_URL ?? "";
  const isLocalRuntime = !process.env.VERCEL && !process.env.VERCEL_ENV;
  const useLocalDirect =
    isLocalRuntime &&
    Boolean(directUrl) &&
    process.env.PANTAUDESA_LOCAL_DB_USE_DIRECT_URL === "true";

  if (useLocalDirect) {
    return { source: "DIRECT_URL", url: directUrl };
  }

  return {
    source: databaseUrl ? "DATABASE_URL" : "DIRECT_URL",
    url: databaseUrl ? normalizeLocalRuntimeDatabaseUrl(databaseUrl) : directUrl,
    rawUrl: databaseUrl || directUrl,
  };
}

function recommendedAction({
  runtimeOk,
  migrationOk,
  directUrlUsable,
  runtimeSource,
  runtimePoolTuned,
}) {
  if (!runtimeOk) {
    return "Fix DATABASE_URL/runtime connectivity before opening local back office pages.";
  }
  if (!migrationOk) {
    return "Inspect migration status before deploy; do not retry blindly or run migrate resolve without schema verification.";
  }
  if (runtimeSource === "DIRECT_URL") {
    return "Set PANTAUDESA_LOCAL_DB_USE_DIRECT_URL=false unless explicitly debugging direct connectivity.";
  }
  if (!directUrlUsable) {
    return "Runtime is healthy; DIRECT_URL is not usable from this environment, so run migrations from a stable network/CI or Supabase SQL tool.";
  }
  if (runtimePoolTuned) {
    return "Database is healthy. Local Next dev pooler URL was tuned above connection_limit=1 to avoid Prisma P2024 starvation.";
  }
  return "Database runtime, migration status, and direct URL are healthy.";
}

async function tcpCheck(urlInfo) {
  if (!urlInfo.configured || !urlInfo.valid || !urlInfo.host || !urlInfo.port) {
    return { ok: false, skipped: true, reason: "missing_or_invalid_url" };
  }

  return await new Promise((resolve) => {
    const socket = net.createConnection({
      host: urlInfo.host,
      port: Number(urlInfo.port),
    });
    const startedAt = Date.now();
    const finish = (result) => {
      socket.destroy();
      resolve({ ...result, ms: Date.now() - startedAt });
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.once("connect", () => finish({ ok: true }));
    socket.once("timeout", () => finish({ ok: false, reason: "tcp_timeout" }));
    socket.once("error", (error) =>
      finish({ ok: false, reason: error.code ?? error.message }),
    );
  });
}

async function withTimeout(label, ms, task) {
  let timeout;
  try {
    return await Promise.race([
      task(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function prismaCheck(url) {
  if (!url) return { ok: false, reason: "missing_url" };

  const startedAt = Date.now();
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });

  try {
    await withTimeout("prisma_select_1", PRISMA_TIMEOUT_MS, async () => {
      await prisma.$queryRaw`SELECT 1`;
    });
    return { ok: true, ms: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      ms: Date.now() - startedAt,
      reason:
        error instanceof Error
          ? error.message.replace(/\s+/g, " ").slice(0, 220)
          : String(error),
    };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function runMigrateStatus() {
  const startedAt = Date.now();
  const prismaBin = fileURLToPath(
    new URL("../node_modules/prisma/build/index.js", import.meta.url),
  );

  return await withTimeout("prisma_migrate_status", MIGRATE_TIMEOUT_MS, async () => {
    return await new Promise((resolve) => {
      const child = spawn(process.execPath, [prismaBin, "migrate", "status"], {
        cwd: process.cwd(),
        env: process.env,
        shell: false,
      });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        resolve({
          ok: false,
          ms: Date.now() - startedAt,
          reason: error.message,
        });
      });
      child.on("exit", (code) => {
        resolve({
          ok: code === 0,
          ms: Date.now() - startedAt,
          exitCode: code,
          summary: `${stdout}\n${stderr}`
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(-8),
        });
      });
    });
  }).catch((error) => ({
    ok: false,
    ms: Date.now() - startedAt,
    reason: error instanceof Error ? error.message : String(error),
  }));
}

const databaseUrlInfo = safeUrlInfo("DATABASE_URL", process.env.DATABASE_URL);
const directUrlInfo = safeUrlInfo("DIRECT_URL", process.env.DIRECT_URL);
const runtime = pickRuntimeUrl();
const runtimeInfo = safeUrlInfo(runtime.source, runtime.url);
const rawRuntimeInfo = safeUrlInfo(`${runtime.source}_RAW`, runtime.rawUrl);
const runtimePoolTuned = runtime.url !== runtime.rawUrl;

const [databaseTcp, directTcp, runtimePrisma, migration] = await Promise.all([
  tcpCheck(databaseUrlInfo),
  tcpCheck(directUrlInfo),
  prismaCheck(runtime.url),
  runMigrateStatus(),
]);

const runtimeOk = Boolean(runtimePrisma.ok);
const migrationOk = Boolean(migration.ok);
const directUrlUsable = Boolean(directTcp.ok);

const result = {
  runtime_ok: runtimeOk,
  migration_ok: migrationOk,
  direct_url_usable: directUrlUsable,
  recommended_action: recommendedAction({
    runtimeOk,
    migrationOk,
    directUrlUsable,
    runtimeSource: runtime.source,
    runtimePoolTuned,
  }),
  runtime: {
    source: runtime.source,
    local_pool_tuned: runtimePoolTuned,
    raw_url: rawRuntimeInfo,
    url: runtimeInfo,
    prisma: runtimePrisma,
  },
  urls: {
    database_url: {
      ...databaseUrlInfo,
      tcp: databaseTcp,
    },
    direct_url: {
      ...directUrlInfo,
      tcp: directTcp,
    },
  },
  migration,
};

console.log(JSON.stringify(result, null, 2));

if (!runtimeOk || !migrationOk) {
  process.exit(1);
}
