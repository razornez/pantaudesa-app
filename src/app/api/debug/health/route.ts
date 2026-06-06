import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDatabaseUnavailableMessage,
  isDatabaseConnectivityError,
} from "@/lib/db-connectivity";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function summarizeUrl(value: string | undefined) {
  const raw = value?.trim() ?? "";
  const cleaned =
    (raw.startsWith("\"") && raw.endsWith("\"")) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw;

  try {
    const url = new URL(cleaned);
    return { host: url.hostname, port: url.port || "(default)" };
  } catch {
    return { host: "invalid", port: "-" };
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const results: Record<string, unknown> = {};
  const supabaseAdmin = getSupabaseAdminClient();

  results.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET ? "set" : "MISSING",
    AUTH_URL: process.env.AUTH_URL ?? "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "MISSING",
    DATABASE_URL: !!process.env.DATABASE_URL ? "set" : "MISSING",
    DIRECT_URL: !!process.env.DIRECT_URL ? "set" : "MISSING",
    RESEND_API_KEY: !!process.env.RESEND_API_KEY ? "set" : "MISSING",
    RESEND_FROM: process.env.RESEND_FROM ?? "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    databaseTarget: summarizeUrl(process.env.DATABASE_URL),
    directTarget: summarizeUrl(process.env.DIRECT_URL),
  };

  try {
    await db.$queryRaw`SELECT 1`;
    results.database = "ok";
  } catch (error) {
    results.database = isDatabaseConnectivityError(error)
      ? {
          status: "connectivity_error",
          message: getDatabaseUnavailableMessage(),
        }
      : {
          status: "error",
          message: (error as Error).message,
        };
  }

  try {
    const userCount = await db.user.count();
    results.prismaModels = `ok - ${userCount} users`;
  } catch (error) {
    results.prismaModels = isDatabaseConnectivityError(error)
      ? {
          status: "connectivity_error",
          message: (error as Error).message,
        }
      : {
          status: "error",
          message: (error as Error).message,
        };
  }

  try {
    if (!supabaseAdmin) {
      results.supabaseDataApi = "not configured";
    } else {
      const { data, error } = await supabaseAdmin.from("desa").select("id").limit(1);
      results.supabaseDataApi = error
        ? `error - ${error.message}`
        : `ok - ${(data ?? []).length} row probe`;
    }
  } catch (error) {
    results.supabaseDataApi = `error - ${(error as Error).message}`;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!process.env.RESEND_API_KEY?.startsWith("re_")) {
      results.resend = "invalid key format";
    } else {
      const domains = await resend.domains.list();
      results.resend = domains.error
        ? `api error - ${domains.error.message}`
        : `ok - ${(domains.data?.data ?? []).length} domain(s)`;
    }
  } catch (error) {
    results.resend = `error - ${(error as Error).message}`;
  }

  results.nextauth = {
    callbackUrl: `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL}/api/auth/callback/resend`,
    note: "This URL must be accessible from the internet",
  };

  const allOk = Object.values(results).every((value) => {
    if (typeof value === "string") return value.startsWith("ok") || value === "set";
    if (typeof value === "object" && value !== null && "status" in value) {
      return (value as { status?: unknown }).status === "ok";
    }
    return true;
  });

  return NextResponse.json(
    { ok: allOk, timestamp: new Date().toISOString(), results },
    { status: allOk ? 200 : 500 },
  );
}
