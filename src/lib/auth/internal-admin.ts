import { cache } from "react";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getDatabaseUnavailableMessage,
  isDatabaseConnectivityError,
} from "@/lib/db-connectivity";
import { getInternalAdminRoleViaSupabase } from "@/lib/internal-admin/supabase-fallback";
import { perfLog, perfStart } from "@/lib/perf";

export type InternalAdminSession = {
  userId: string;
  email: string;
};

// Server-side check: is this userId an INTERNAL_ADMIN in the DB?
// Never trust client-side flags — always reads from DB.
//
// Wrapped in React `cache()` so layout + page during a single request can both
// call `getInternalAdminSession` without doubling the role lookup. Keyed on
// `userId`, so different users never share a result. This is request-scoped
// only and does NOT replace runtime authorization checks.
export const isInternalAdmin = cache(async function isInternalAdmin(
  userId: string,
): Promise<boolean> {
  if (!db) {
    try {
      return (await getInternalAdminRoleViaSupabase(userId)) === "INTERNAL_ADMIN";
    } catch {
      return false;
    }
  }

  try {
    const t = perfStart();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    perfLog("internal-admin.auth", "user.findUnique(role)", t);
    return user?.role === "INTERNAL_ADMIN";
  } catch (error) {
    if (!isDatabaseConnectivityError(error)) throw error;

    try {
      return (await getInternalAdminRoleViaSupabase(userId)) === "INTERNAL_ADMIN";
    } catch {
      return false;
    }
  }
});

// Get the current session and validate internal admin role server-side.
// Returns session data if valid, null if not authenticated or not internal admin.
export const getInternalAdminSession = cache(async function getInternalAdminSession(): Promise<InternalAdminSession | null> {
  const tAuth = perfStart();
  const session = await auth();
  perfLog("internal-admin.auth", "auth()", tAuth);
  if (!session?.user?.id || !session.user.email) return null;
  const admin = await isInternalAdmin(session.user.id);
  if (!admin) return null;
  return { userId: session.user.id, email: session.user.email };
});

// Standard 403 response for unauthorized internal admin access.
export function unauthorizedInternalAdmin(): NextResponse {
  return NextResponse.json(
    { error: "Internal admin access required" },
    { status: 403 },
  );
}

// Convenience: assert session is internal admin or return 401/403.
// Usage in route handlers:
//   const adminSession = await requireInternalAdminSession(req);
//   if (adminSession instanceof NextResponse) return adminSession;
export async function requireInternalAdminSession(): Promise<InternalAdminSession | NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isInternalAdmin(session.user.id);
    if (!admin) {
      return unauthorizedInternalAdmin();
    }
    return { userId: session.user.id, email: session.user.email };
  } catch (error) {
    console.error("[internal-admin.auth] require session failed", error);
    if (isDatabaseConnectivityError(error)) {
      return NextResponse.json(
        { error: getDatabaseUnavailableMessage() },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Sesi login bermasalah. Silakan masuk ulang." },
      { status: 401 },
    );
  }
}
