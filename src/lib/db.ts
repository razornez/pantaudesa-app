import { PrismaClient } from "@/generated/prisma";
import { normalizeLocalRuntimeDatabaseUrl } from "@/lib/db-url";
import { attachPrismaPerfLogging } from "@/lib/perf";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
  prismaDatasourceUrl?: string;
};

function localDirectUrlOptInEnabled(): boolean {
  if (!process.env.DIRECT_URL) return false;
  return process.env.PANTAUDESA_LOCAL_DB_USE_DIRECT_URL === "true";
}

function getPrismaDatasourceUrl(): string {
  const databaseUrl = normalizeLocalRuntimeDatabaseUrl(process.env.DATABASE_URL ?? "");
  const directUrl = process.env.DIRECT_URL ?? "";
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  const isThisAuditBranch =
    process.env.VERCEL_GIT_COMMIT_REF === "fix/mobile-suara-profile-admin-access-polish";
  const isLocalRuntime = !process.env.VERCEL && !process.env.VERCEL_ENV;

  if (isVercelPreview && isThisAuditBranch && directUrl) {
    return directUrl;
  }

  if (isLocalRuntime && localDirectUrlOptInEnabled()) {
    return directUrl;
  }

  return databaseUrl || directUrl;
}

function previewDirectUrlRuntimeEnabled(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "fix/mobile-suara-profile-admin-access-polish" &&
    Boolean(process.env.DIRECT_URL)
  );
}

function localDirectUrlRuntimeEnabled(): boolean {
  return !process.env.VERCEL && !process.env.VERCEL_ENV && localDirectUrlOptInEnabled();
}

function createClient(url: string): PrismaClient | null {
  const valid =
    url.startsWith("postgresql://") ||
    url.startsWith("postgres://") ||
    url.startsWith("prisma://") ||
    url.startsWith("prisma+postgres://");

  if (!valid) return null;

  try {
    if (previewDirectUrlRuntimeEnabled()) {
      console.info("[perf][back-office] route=db step=previewDirectUrlRuntime enabled=true");
    }
    if (localDirectUrlRuntimeEnabled()) {
      console.info("[perf][back-office] route=db step=localDirectUrlRuntime enabled=true");
    }

    return new PrismaClient({
      datasources: {
        db: { url },
      },
    });
  } catch {
    return null;
  }
}

function getOrCreatePrismaClient(): PrismaClient | null {
  const url = getPrismaDatasourceUrl();
  const existing = globalForPrisma.prisma;

  if (existing && globalForPrisma.prismaDatasourceUrl === url) {
    return existing;
  }

  if (existing && globalForPrisma.prismaDatasourceUrl !== url) {
    void existing.$disconnect().catch(() => {});
  }

  const client = createClient(url);
  globalForPrisma.prisma = client;
  globalForPrisma.prismaDatasourceUrl = url;
  return client;
}

export const db: PrismaClient = getOrCreatePrismaClient() as PrismaClient;

if (process.env.NODE_ENV !== "production" && db) globalForPrisma.prisma = db;

// Sprint 04-008H: Attach dev-only Prisma query event logging.
// Logs per-query duration without raw SQL values. Gate checked inside attachPrismaPerfLogging.
if (db) attachPrismaPerfLogging(db);
