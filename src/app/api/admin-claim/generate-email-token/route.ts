import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { generateRawToken, hashToken, tokenExpiresAt, EMAIL_TOKEN_TTL_MS } from "@/lib/admin-claim/token";
import { sendAdminClaimMagicLink } from "@/lib/email/admin-claim-email";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let body: { claimId: string; officialEmail: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { claimId, officialEmail } = body;
    if (!claimId || !officialEmail) {
      return NextResponse.json({ error: "claimId and officialEmail are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Verify claim belongs to this user
    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: { id: true, userId: true, desaId: true, status: true, desa: { select: { nama: true } } },
    });
    if (!claim || claim.userId !== userId) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Generate token — store only hash
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = tokenExpiresAt(EMAIL_TOKEN_TTL_MS);

    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        officialEmail,
        tokenHash,
        tokenExpiresAt: expiresAt,
        method: "OFFICIAL_EMAIL",
      },
    });

    // Send email — report env missing honestly, don't fake success
    const emailResult = await sendAdminClaimMagicLink({
      toEmail: officialEmail,
      desaName: claim.desa.nama,
      rawToken,
      claimId,
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.EMAIL_TOKEN_GENERATED,
      desaId: claim.desaId,
      actorUserId: userId,
      claimId,
      method: "OFFICIAL_EMAIL",
      evidenceType: "email",
      metadata: {
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.code,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    if (!emailResult.ok && emailResult.code === "RESEND_ENV_MISSING") {
      return NextResponse.json({
        ok: false,
        code: "RESEND_ENV_MISSING",
        message: "Email service not configured. Token was saved but email could not be sent.",
        // In dev only, expose raw token so flow can be tested without email
        ...(process.env.NODE_ENV === "development" ? { devToken: rawToken } : {}),
      }, { status: 503 });
    }

    if (!emailResult.ok) {
      return NextResponse.json({
        ok: false,
        code: "RESEND_SEND_FAILED",
        message: "Token saved but email delivery failed. Try again later.",
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/generate-email-token");
  }
}
