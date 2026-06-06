import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { sendRenewalExpiredEmail } from "@/lib/email/admin-claim-email";

// POST /api/internal-admin/renewals/sweep-expired
// Idempotent: marks all VERIFIED members whose renewalDueAt is in the past as EXPIRED,
// sends notification email per affected user, writes audit events.
// Internal-admin guarded so it can also be invoked manually (or by a future cron job).
export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireInternalAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const now = new Date();

    const overdue = await db.desaAdminMember.findMany({
      where: {
        status: "VERIFIED",
        renewalDueAt: { lt: now, not: null },
      },
      select: {
        id: true,
        userId: true,
        desaId: true,
        renewalDueAt: true,
        desa: { select: { nama: true } },
        user: { select: { email: true } },
      },
      take: 200, // safety cap per sweep
    });

    let expiredCount = 0;
    const failures: Array<{ memberId: string; reason: string }> = [];

    for (const member of overdue) {
      try {
        await db.desaAdminMember.update({
          where: { id: member.id },
          data: {
            status: "EXPIRED",
            revokedAt: now,
            revokedReason: "Renewal not completed before due date",
            updatedAt: now,
          },
        });

        const emailResult = await sendRenewalExpiredEmail({
          toEmail: member.user.email,
          desaName: member.desa.nama,
          reason: "Perpanjangan verifikasi tidak diselesaikan sebelum tanggal jatuh tempo",
        });

        await writeAuditEvent({
          eventType: AUDIT_EVENT.RENEWAL_EXPIRED,
          desaId: member.desaId,
          actorUserId: adminSession.userId,
          actorRole: "INTERNAL_ADMIN",
          targetUserId: member.userId,
          entityType: "DesaAdminMember",
          entityId: member.id,
          previousStatus: "VERIFIED",
          nextStatus: "EXPIRED",
          metadata: {
            renewalDueAt: member.renewalDueAt?.toISOString() ?? null,
            sweepRunAt: now.toISOString(),
            emailSent: emailResult.ok,
            emailError: emailResult.ok ? undefined : emailResult.code,
            desaName: member.desa.nama,
            userEmail: member.user.email,
          },
          ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
          userAgent: req.headers.get("user-agent") ?? undefined,
        });

        expiredCount++;
      } catch (e) {
        failures.push({
          memberId: member.id,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      candidates: overdue.length,
      expired: expiredCount,
      failures,
      sweepRunAt: now.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, "POST /api/internal-admin/renewals/sweep-expired");
  }
}
