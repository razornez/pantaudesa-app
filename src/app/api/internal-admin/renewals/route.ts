import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import {
  RENEWAL_REMINDER_DAYS,
  daysUntilRenewal,
  getRenewalState,
} from "@/lib/admin-claim/renewal";

// GET /api/internal-admin/renewals?state=DUE_SOON|OVERDUE|ALL
// Lists VERIFIED members whose renewal is due-soon or overdue.
export async function GET(req: NextRequest) {
  try {
    const adminSession = await requireInternalAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { searchParams } = req.nextUrl;
    const state = searchParams.get("state") ?? "ALL";

    const now = new Date();
    const horizon = new Date(now.getTime() + RENEWAL_REMINDER_DAYS * 86_400_000);

    const where = state === "OVERDUE"
      ? { status: "VERIFIED" as const, renewalDueAt: { lt: now } }
      : state === "DUE_SOON"
      ? { status: "VERIFIED" as const, renewalDueAt: { gte: now, lte: horizon } }
      : { status: "VERIFIED" as const, renewalDueAt: { not: null, lte: horizon } };

    const members = await db.desaAdminMember.findMany({
      where,
      orderBy: { renewalDueAt: "asc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        renewalDueAt: true,
        verifiedById: true,
        joinedAt: true,
        desa: { select: { id: true, nama: true, kecamatan: true, kabupaten: true } },
        user: { select: { id: true, nama: true, username: true, email: true } },
      },
    });

    const enriched = members.map((m) => ({
      ...m,
      renewalDueAt: m.renewalDueAt?.toISOString() ?? null,
      joinedAt: m.joinedAt.toISOString(),
      renewalState: getRenewalState(m.renewalDueAt, now),
      daysUntilRenewal: daysUntilRenewal(m.renewalDueAt, now),
    }));

    return NextResponse.json({ members: enriched, total: enriched.length, generatedAt: now.toISOString() });
  } catch (err) {
    return handleApiError(err, "GET /api/internal-admin/renewals");
  }
}
