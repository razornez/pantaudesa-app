import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import {
  verifyOtp,
  freezeUntil,
  isOtpFrozen,
  isOtpExpired,
  OTP_WRONG_MAX,
} from "@/lib/admin-claim/otp";
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

    let body: { claimId: string; code: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { claimId, code } = body;
    if (!claimId || !code) {
      return NextResponse.json({ error: "claimId and code are required" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "OTP code must be exactly 6 digits" }, { status: 400 });
    }

    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        otpHash: true,
        otpExpiresAt: true,
        otpFrozenUntil: true,
        otpFailedAttempts: true,
      },
    });

    if (!claim || claim.userId !== userId) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    if (claim.status !== "PENDING") {
      return NextResponse.json({ error: "OTP verification only applies to PENDING claims" }, { status: 422 });
    }

    const now = new Date();

    // Step 1 — currently frozen window?
    if (isOtpFrozen(claim.otpFrozenUntil)) {
      await writeAuditEvent({
        eventType: AUDIT_EVENT.OTP_VERIFY_FROZEN,
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
        message: `Percobaan OTP terlalu banyak. Verifikasi email dibekukan sampai ${claim.otpFrozenUntil!.toISOString()}.`,
      }, { status: 429 });
    }

    if (!claim.otpHash) {
      return NextResponse.json({ error: "No OTP has been sent for this claim" }, { status: 400 });
    }

    if (isOtpExpired(claim.otpExpiresAt)) {
      await writeAuditEvent({
        eventType: AUDIT_EVENT.OTP_VERIFY_FROZEN,
        desaId: claim.desaId,
        actorUserId: userId,
        claimId,
        method: "OFFICIAL_EMAIL",
        metadata: { reason: "expired" },
      });
      return NextResponse.json({ ok: false, code: "OTP_EXPIRED", message: "Kode OTP sudah kedaluwarsa. Kirim ulang kode baru." });
    }

    const correct = verifyOtp(code, claim.otpHash);

    if (!correct) {
      // Step 2 — if a previous freeze just elapsed, reset wrong-attempt counter for fairness
      const baseFailedAttempts =
        claim.otpFrozenUntil && claim.otpFrozenUntil <= now ? 0 : claim.otpFailedAttempts;
      const newFailedAttempts = baseFailedAttempts + 1;

      // Policy: allow OTP_WRONG_MAX wrong attempts; the (MAX+1)-th attempt triggers freeze.
      const willFreeze = newFailedAttempts > OTP_WRONG_MAX;
      const newFrozenUntil = willFreeze ? freezeUntil(now.getTime()) : null;

      await db.desaAdminClaim.update({
        where: { id: claimId },
        data: {
          otpFailedAttempts: newFailedAttempts,
          otpFrozenUntil: newFrozenUntil,
        },
      });

      await writeAuditEvent({
        eventType: AUDIT_EVENT.OTP_INVALID,
        desaId: claim.desaId,
        actorUserId: userId,
        claimId,
        method: "OFFICIAL_EMAIL",
        metadata: {
          failedAttempts: newFailedAttempts,
          frozen: willFreeze,
          frozenUntil: newFrozenUntil?.toISOString(),
        },
      });

      if (willFreeze) {
        return NextResponse.json({
          ok: false,
          code: "OTP_FROZEN",
          frozenUntil: newFrozenUntil!.toISOString(),
          message: `Percobaan OTP terlalu banyak. Verifikasi email dibekukan sementara sampai ${newFrozenUntil!.toISOString()}. Coba lagi nanti atau gunakan metode website token jika tersedia.`,
        }, { status: 429 });
      }

      return NextResponse.json({
        ok: false,
        code: "OTP_WRONG",
        remainingAttempts: Math.max(0, OTP_WRONG_MAX - newFailedAttempts),
        message: "Kode OTP salah. Periksa kembali kode yang dikirim ke email desa.",
      }, { status: 422 });
    }

    // OTP correct — PENDING → IN_REVIEW. Clear OTP state. No member created (LIMITED only via invite).
    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        status: "IN_REVIEW",
        otpHash: null,
        otpExpiresAt: null,
        otpFailedAttempts: 0,
        otpFrozenUntil: null,
        verifiedAt: now,
      },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.OTP_CONFIRMED,
      desaId: claim.desaId,
      actorUserId: userId,
      claimId,
      method: "OFFICIAL_EMAIL",
      previousStatus: "PENDING",
      nextStatus: "IN_REVIEW",
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      newStatus: "IN_REVIEW",
      message: "Kode OTP email berhasil dikonfirmasi. Klaim kamu masuk tahap review internal karena email desa saja belum cukup untuk langsung memverifikasi admin. Jika lolos review, status kamu akan menjadi VERIFIED.",
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/verify-email-otp");
  }
}
