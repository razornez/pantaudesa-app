import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import {
  generateOtp,
  hashOtp,
  otpExpiresAt,
  freezeUntil,
  isOtpFrozen,
  OTP_RESEND_MAX,
  OTP_EXPIRY_MS,
} from "@/lib/admin-claim/otp";
import { sendDesaEmailOtp } from "@/lib/email/admin-claim-email";
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

    let body: { claimId: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { claimId } = body;
    if (!claimId) {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 });
    }

    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        officialEmail: true,
        otpFrozenUntil: true,
        otpResendCount: true,
        desa: { select: { nama: true } },
      },
    });

    if (!claim || claim.userId !== userId) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    if (claim.status !== "PENDING") {
      return NextResponse.json({ error: "OTP can only be sent for PENDING claims" }, { status: 422 });
    }
    if (!claim.officialEmail) {
      return NextResponse.json({ error: "officialEmail must be set on the claim first" }, { status: 422 });
    }

    const now = new Date();

    // Step 1 — currently frozen window?
    if (isOtpFrozen(claim.otpFrozenUntil)) {
      await writeAuditEvent({
        eventType: AUDIT_EVENT.OTP_RESEND_BLOCKED,
        desaId: claim.desaId,
        actorUserId: userId,
        claimId,
        method: "OFFICIAL_EMAIL",
        metadata: { frozenUntil: claim.otpFrozenUntil?.toISOString() },
      });
      return NextResponse.json({
        ok: false,
        code: "OTP_FROZEN",
        frozenUntil: claim.otpFrozenUntil!.toISOString(),
        message: `Pengiriman ulang kode OTP terlalu sering. Kamu bisa meminta kode baru setelah ${claim.otpFrozenUntil!.toISOString()}.`,
      }, { status: 429 });
    }

    // Step 2 — freeze window has elapsed → reset counter so the user gets a fresh allowance
    const baseResendCount = claim.otpFrozenUntil && claim.otpFrozenUntil <= now ? 0 : claim.otpResendCount;
    const newResendCount = baseResendCount + 1;

    // Policy: allow OTP_RESEND_MAX sends; the (MAX+1)-th attempt triggers freeze and is NOT sent.
    if (newResendCount > OTP_RESEND_MAX) {
      const newFrozenUntil = freezeUntil(now.getTime());
      await db.desaAdminClaim.update({
        where: { id: claimId },
        data: {
          otpResendCount: newResendCount,
          otpFrozenUntil: newFrozenUntil,
          otpLastSentAt: now,
        },
      });
      await writeAuditEvent({
        eventType: AUDIT_EVENT.OTP_RESEND_BLOCKED,
        desaId: claim.desaId,
        actorUserId: userId,
        claimId,
        method: "OFFICIAL_EMAIL",
        metadata: { resendCount: newResendCount, frozenUntil: newFrozenUntil.toISOString() },
      });
      return NextResponse.json({
        ok: false,
        code: "OTP_RESEND_LIMIT",
        frozenUntil: newFrozenUntil.toISOString(),
        message: `Pengiriman ulang kode OTP terlalu sering. Kamu bisa meminta kode baru setelah ${newFrozenUntil.toISOString()}.`,
      }, { status: 429 });
    }

    // Step 3 — generate and send OTP. Store only the SHA-256 hash; never log plaintext.
    const plainOtp = generateOtp();
    const otp_hash = hashOtp(plainOtp);
    const expiresAt = otpExpiresAt(now.getTime());

    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        otpHash: otp_hash,
        otpExpiresAt: expiresAt,
        otpLastSentAt: now,
        otpResendCount: newResendCount,
        otpFrozenUntil: null, // freeze cleared because user is within allowed budget
        method: "OFFICIAL_EMAIL",
      },
    });

    const emailResult = await sendDesaEmailOtp({
      toEmail: claim.officialEmail,
      desaName: claim.desa.nama,
      otpCode: plainOtp,
      expiresMinutes: Math.round(OTP_EXPIRY_MS / 60000),
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.OTP_SENT,
      desaId: claim.desaId,
      actorUserId: userId,
      claimId,
      method: "OFFICIAL_EMAIL",
      metadata: {
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.code,
        resendCount: newResendCount,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    if (!emailResult.ok && emailResult.code === "RESEND_ENV_MISSING") {
      return NextResponse.json({
        ok: false,
        code: "RESEND_ENV_MISSING",
        message: "Email service not configured.",
        ...(process.env.NODE_ENV === "development" ? { devOtp: plainOtp } : {}),
      }, { status: 503 });
    }

    if (!emailResult.ok) {
      return NextResponse.json({
        ok: false,
        code: "EMAIL_SEND_FAILED",
        message: "OTP saved but email delivery failed. Try again later.",
      }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      expiresAt: expiresAt.toISOString(),
      resendCount: newResendCount,
      remainingResends: OTP_RESEND_MAX - newResendCount,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/send-email-otp");
  }
}
