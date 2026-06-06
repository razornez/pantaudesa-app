import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { verifyTokenHash, isTokenExpired } from "@/lib/admin-claim/token";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

// Magic-link email verification callback — no auth required.
// On success: claim → IN_REVIEW only. No AdminDesaMember is created here.
// LIMITED membership only comes from invite by a VERIFIED admin.
export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=service_unavailable", req.url));
    }

    const { searchParams } = req.nextUrl;
    const rawToken = searchParams.get("token");
    const claimId = searchParams.get("claimId");

    if (!rawToken || !claimId) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_link", req.url));
    }

    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        tokenHash: true,
        tokenExpiresAt: true,
        method: true,
      },
    });

    if (!claim || !claim.tokenHash) {
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_token", req.url));
    }

    if (isTokenExpired(claim.tokenExpiresAt)) {
      await writeAuditEvent({
        eventType: AUDIT_EVENT.EMAIL_TOKEN_EXPIRED,
        desaId: claim.desaId,
        actorUserId: claim.userId,
        claimId,
        method: "OFFICIAL_EMAIL",
      });
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=token_expired", req.url));
    }

    if (!verifyTokenHash(rawToken, claim.tokenHash)) {
      await writeAuditEvent({
        eventType: AUDIT_EVENT.EMAIL_TOKEN_INVALID,
        desaId: claim.desaId,
        actorUserId: claim.userId,
        claimId,
        method: "OFFICIAL_EMAIL",
      });
      return NextResponse.redirect(new URL("/profil/klaim-admin-desa?error=invalid_token", req.url));
    }

    // Transition: PENDING → IN_REVIEW. No member record created — LIMITED only comes from invite.
    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        status: "IN_REVIEW",
        tokenHash: null,
        tokenExpiresAt: null,
        verifiedAt: new Date(),
      },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.EMAIL_TOKEN_VERIFIED,
      desaId: claim.desaId,
      actorUserId: claim.userId,
      claimId,
      method: "OFFICIAL_EMAIL",
      previousStatus: claim.status,
      nextStatus: "IN_REVIEW",
    });

    return NextResponse.redirect(new URL("/profil/klaim-admin-desa?verified=email", req.url));
  } catch (err) {
    return handleApiError(err, "GET /api/admin-claim/verify-email");
  }
}
