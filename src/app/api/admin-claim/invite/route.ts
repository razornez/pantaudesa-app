import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { generateRawToken, hashToken, tokenExpiresAt } from "@/lib/admin-claim/token";
import { sendAdminInviteEmail } from "@/lib/email/admin-claim-email";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { isVerifiedAdminMember } from "@/lib/admin-desa/policy";
import { parseAdminDesaInviteBody } from "@/lib/admin-desa/validation";

const MAX_ADMINS_PER_DESA = 5;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const inviterId = session.user.id;
    const inviterEmail = session.user.email.toLowerCase();

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let body: { desaId: string; email: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsedBody = parseAdminDesaInviteBody({
      desaId: body.desaId,
      email: body.email,
      inviterEmail,
    });
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
    }
    const { desaId, email } = parsedBody.value;

    const inviterMember = await db.desaAdminMember.findFirst({
      where: { desaId, userId: inviterId },
      select: { id: true, role: true, status: true },
    });
    if (!inviterMember || !isVerifiedAdminMember(inviterMember.status, inviterMember.role)) {
      return NextResponse.json({ error: "Only verified desa admins can invite" }, { status: 403 });
    }

    const currentCount = await db.desaAdminMember.count({
      where: { desaId, status: { in: ["LIMITED", "VERIFIED"] } },
    });
    if (currentCount >= MAX_ADMINS_PER_DESA) {
      return NextResponse.json({
        error: `Max ${MAX_ADMINS_PER_DESA} admins per desa reached`,
      }, { status: 422 });
    }

    const desa = await db.desa.findUnique({ where: { id: desaId }, select: { nama: true } });
    if (!desa) {
      return NextResponse.json({ error: "Desa not found" }, { status: 404 });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        desaAdminMembers: {
          where: { status: { in: ["LIMITED", "VERIFIED"] } },
          select: { desaId: true, desa: { select: { nama: true } } },
          take: 1,
        },
      },
    });

    if (existingUser) {
      const existingMemberSameDesa = await db.desaAdminMember.findFirst({
        where: { desaId, userId: existingUser.id, status: { in: ["LIMITED", "VERIFIED"] } },
        select: { id: true },
      });
      if (existingMemberSameDesa) {
        return NextResponse.json({ error: "Email ini sudah tercatat sebagai admin desa tersebut." }, { status: 409 });
      }

      const activeElsewhere = existingUser.desaAdminMembers[0];
      if (activeElsewhere && activeElsewhere.desaId !== desaId) {
        return NextResponse.json({
          error: `Email ini sudah mengelola ${activeElsewhere.desa.nama}. Satu akun hanya boleh mengelola satu desa.`,
        }, { status: 409 });
      }
    }

    const duplicatePendingInvite = await db.desaAdminInvite.findFirst({
      where: { desaId, email, status: "PENDING" },
      select: { id: true, expiresAt: true },
    });
    if (duplicatePendingInvite && duplicatePendingInvite.expiresAt > new Date()) {
      return NextResponse.json({ error: "Undangan aktif untuk email ini masih berlaku." }, { status: 409 });
    }

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = tokenExpiresAt(INVITE_TTL_MS);

    const invite = await db.desaAdminInvite.create({
      data: {
        desaId,
        email,
        tokenHash,
        invitedById: inviterId,
        status: "PENDING",
        expiresAt,
      },
      select: { id: true },
    });

    const emailResult = await sendAdminInviteEmail({
      toEmail: email,
      desaName: desa.nama,
      rawToken,
      inviteId: invite.id,
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.INVITE_CREATED,
      desaId,
      actorUserId: inviterId,
      metadata: {
        inviteId: invite.id,
        toEmail: email,
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.code,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      inviteId: invite.id,
      expiresAt: expiresAt.toISOString(),
      emailSent: emailResult.ok,
      ...(process.env.NODE_ENV === "development" && !emailResult.ok
        ? { devToken: rawToken }
        : {}),
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/invite");
  }
}
