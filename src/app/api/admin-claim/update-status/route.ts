import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

// Client-facing route: claim owner can only reapply (REJECTED → PENDING).
// Approve/reject by internal admin goes through /api/internal-admin/claims/[id]/approve|reject.
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
        reapplyAllowedAt: true,
        fraudCooldownUntil: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    if (claim.userId !== userId) {
      return NextResponse.json({ error: "Forbidden — not your claim" }, { status: 403 });
    }
    if (claim.status !== "REJECTED") {
      return NextResponse.json({
        error: `Only REJECTED claims can be reapplied. Current status: ${claim.status}`,
      }, { status: 422 });
    }

    const now = new Date();
    if (claim.fraudCooldownUntil && claim.fraudCooldownUntil > now) {
      return NextResponse.json({
        error: "Klaim belum bisa diajukan ulang karena masa tunggu fraud/suspicious belum berakhir.",
        code: "FRAUD_COOLDOWN_ACTIVE",
        reapplyAllowedAt: claim.fraudCooldownUntil.toISOString(),
      }, { status: 429 });
    }
    if (claim.reapplyAllowedAt && claim.reapplyAllowedAt > now) {
      return NextResponse.json({
        error: "Kamu belum bisa mengajukan ulang sebelum tanggal yang ditentukan.",
        code: "REAPPLY_COOLDOWN_ACTIVE",
        reapplyAllowedAt: claim.reapplyAllowedAt.toISOString(),
      }, { status: 429 });
    }

    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        status: "PENDING",
        rejectedAt: null,
        rejectionReason: null,
        rejectCategory: null,
        rejectReason: null,
        rejectInstructions: null,
        reapplyAllowedAt: null,
        fraudCooldownUntil: null,
        otpFailedAttempts: 0,
        otpResendCount: 0,
        otpFrozenUntil: null,
        tokenHash: null,
        tokenExpiresAt: null,
      },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.STATUS_TO_PENDING,
      desaId: claim.desaId,
      actorUserId: userId,
      claimId,
      previousStatus: "REJECTED",
      nextStatus: "PENDING",
    });

    return NextResponse.json({ ok: true, claimId, previousStatus: "REJECTED", newStatus: "PENDING" });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/update-status");
  }
}
