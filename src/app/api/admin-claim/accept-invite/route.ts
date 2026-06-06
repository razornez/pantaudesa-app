import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { verifyTokenHash, isTokenExpired } from "@/lib/admin-claim/token";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { ACTIVE_CLAIM_STATUSES, ACTIVE_MEMBER_STATUSES } from "@/lib/admin-claim/eligibility";
import { createNotification, NOTIF_TYPE } from "@/lib/notifications/create-notification";

function burnedTokenHash(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=service_unavailable", req.url));
    }

    const { searchParams } = req.nextUrl;
    const rawToken = searchParams.get("token");
    const inviteId = searchParams.get("inviteId");

    if (!rawToken || !inviteId) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_invite_link", req.url));
    }

    const invite = await db.desaAdminInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        desaId: true,
        email: true,
        tokenHash: true,
        status: true,
        expiresAt: true,
        invitedById: true,
        desa: { select: { nama: true } },
      },
    });

    if (!invite || !invite.tokenHash) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_invite", req.url));
    }
    if (invite.status !== "PENDING") {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invite_used", req.url));
    }
    if (isTokenExpired(invite.expiresAt)) {
      await db.desaAdminInvite.update({ where: { id: inviteId }, data: { status: "EXPIRED" } });
      await writeAuditEvent({
        eventType: AUDIT_EVENT.INVITE_EXPIRED,
        desaId: invite.desaId,
        metadata: { inviteId, email: invite.email },
      });
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invite_expired", req.url));
    }
    if (!verifyTokenHash(rawToken, invite.tokenHash)) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_invite_token", req.url));
    }

    const user = await db.user.findUnique({
      where: { email: invite.email },
      select: {
        id: true,
        desaAdminMembers: {
          where: { status: { in: [...ACTIVE_MEMBER_STATUSES] } },
          select: { desaId: true },
          take: 1,
        },
        desaAdminClaims: {
          where: { status: { in: [...ACTIVE_CLAIM_STATUSES] } },
          select: { desaId: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(`/daftar?invite=${inviteId}&email=${encodeURIComponent(invite.email)}`, req.url),
      );
    }

    const activeMemberElsewhere = user.desaAdminMembers[0];
    if (activeMemberElsewhere && activeMemberElsewhere.desaId !== invite.desaId) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_invite", req.url));
    }

    const activeClaimElsewhere = user.desaAdminClaims[0];
    if (activeClaimElsewhere && activeClaimElsewhere.desaId !== invite.desaId) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_invite", req.url));
    }

    const now = new Date();
    await db.desaAdminMember.upsert({
      where: { desaId_userId: { desaId: invite.desaId, userId: user.id } },
      create: {
        desaId: invite.desaId,
        userId: user.id,
        role: "LIMITED_ADMIN",
        status: "LIMITED",
        invitedById: invite.invitedById,
        invitedAt: now,
        acceptedAt: now,
      },
      update: { status: "LIMITED", acceptedAt: now, updatedAt: now },
    });

    await db.desaAdminInvite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED", acceptedAt: now, tokenHash: burnedTokenHash() },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.INVITE_ACCEPTED,
      desaId: invite.desaId,
      actorUserId: user.id,
      targetUserId: user.id,
      nextStatus: "LIMITED",
      metadata: { inviteId, email: invite.email },
    });

    // Notify the inviter that their invite was accepted.
    if (invite.invitedById) {
      await createNotification({
        userId: invite.invitedById,
        type: NOTIF_TYPE.INVITE_ACCEPTED,
        title: "Undangan Admin Desa diterima",
        body: `${invite.email} telah menerima undanganmu dan bergabung sebagai Admin LIMITED di ${invite.desa?.nama ?? "desa kamu"}.`,
        desaId: invite.desaId,
        metadata: { inviteId, email: invite.email },
      });
    }

    return NextResponse.redirect(new URL("/profil/klaim-admin-desa?invite=accepted", req.url));
  } catch (err) {
    return handleApiError(err, "GET /api/admin-claim/accept-invite");
  }
}
