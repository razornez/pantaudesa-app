import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { addRenewalPeriod } from "@/lib/admin-claim/renewal";
import { createNotification, NOTIF_TYPE } from "@/lib/notifications/create-notification";

// POST /api/internal-admin/members/:memberId/renewal/approve
// Internal admin manually approves renewal for a VERIFIED admin → resets renewalDueAt + 6 months.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  try {
    const adminSession = await requireInternalAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const member = await db.desaAdminMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        renewalDueAt: true,
        desa: { select: { nama: true } },
        user: { select: { email: true } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.status !== "VERIFIED") {
      return NextResponse.json({
        error: `Renewal only applies to VERIFIED members. Current status: ${member.status}`,
      }, { status: 422 });
    }

    const now = new Date();
    const newRenewalDueAt = addRenewalPeriod(now);

    await db.desaAdminMember.update({
      where: { id: memberId },
      data: {
        renewalDueAt: newRenewalDueAt,
        updatedAt: now,
      },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.RENEWAL_APPROVED,
      desaId: member.desaId,
      actorUserId: adminSession.userId,
      actorRole: "INTERNAL_ADMIN",
      targetUserId: member.userId,
      entityType: "DesaAdminMember",
      entityId: memberId,
      previousStatus: "VERIFIED",
      nextStatus: "VERIFIED",
      metadata: {
        previousRenewalDueAt: member.renewalDueAt?.toISOString() ?? null,
        newRenewalDueAt: newRenewalDueAt.toISOString(),
        desaName: member.desa.nama,
        userEmail: member.user.email,
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    await createNotification({
      userId: member.userId,
      type: NOTIF_TYPE.RENEWAL_REMINDER,
      title: "Pembaruan masa aktif disetujui",
      body: `Masa aktifmu sebagai Admin Desa ${member.desa.nama} telah diperpanjang. Masa aktif baru: ${newRenewalDueAt.toLocaleDateString("id-ID")}.`,
      desaId: member.desaId,
      metadata: { memberId, newRenewalDueAt: newRenewalDueAt.toISOString() },
    });

    return NextResponse.json({
      ok: true,
      memberId,
      newRenewalDueAt: newRenewalDueAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, `POST /api/internal-admin/members/${memberId}/renewal/approve`);
  }
}
