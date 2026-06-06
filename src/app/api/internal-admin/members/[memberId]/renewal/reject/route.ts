import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { sendRenewalExpiredEmail } from "@/lib/email/admin-claim-email";
import { createNotification, NOTIF_TYPE } from "@/lib/notifications/create-notification";

// POST /api/internal-admin/members/:memberId/renewal/reject
// Internal admin rejects renewal → membership transitions to EXPIRED.
// Body: { reason?: string, suspicious?: boolean }
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

    let body: { reason?: string; suspicious?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // body is optional
    }

    const reason = body.reason?.trim() || null;
    const suspicious = Boolean(body.suspicious);

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

    await db.desaAdminMember.update({
      where: { id: memberId },
      data: {
        status: "EXPIRED",
        revokedAt: now,
        revokedReason: reason ?? "Renewal review rejected",
        updatedAt: now,
      },
    });

    const emailResult = await sendRenewalExpiredEmail({
      toEmail: member.user.email,
      desaName: member.desa.nama,
      reason: reason ?? null,
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.RENEWAL_REJECTED,
      desaId: member.desaId,
      actorUserId: adminSession.userId,
      actorRole: "INTERNAL_ADMIN",
      targetUserId: member.userId,
      entityType: "DesaAdminMember",
      entityId: memberId,
      previousStatus: "VERIFIED",
      nextStatus: "EXPIRED",
      reasonText: reason ?? undefined,
      metadata: {
        suspicious,
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.code,
        desaName: member.desa.nama,
        userEmail: member.user.email,
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    await createNotification({
      userId: member.userId,
      type: NOTIF_TYPE.RENEWAL_EXPIRED,
      title: "Masa aktif Admin Desa berakhir",
      body: `Akses Admin Desamu untuk ${member.desa.nama} telah berakhir.${reason ? ` Alasan: ${reason}` : ""} Hubungi PantauDesa jika ada pertanyaan.`,
      desaId: member.desaId,
      metadata: { memberId, reason },
    });

    return NextResponse.json({
      ok: true,
      memberId,
      newStatus: "EXPIRED",
      emailSent: emailResult.ok,
    });
  } catch (err) {
    return handleApiError(err, `POST /api/internal-admin/members/${memberId}/renewal/reject`);
  }
}
