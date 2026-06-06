import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { addRenewalPeriod } from "@/lib/admin-claim/renewal";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ claimId: string }> },
) {
  const { claimId } = await params;
  try {
    const adminSession = await requireInternalAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // All checks + writes are wrapped in a transaction so that a concurrent
    // double-submit cannot create two VERIFIED admins or two memberships.
    const dbClient = db;
    const result = await dbClient.$transaction(async (tx) => {
      const claim = await tx.desaAdminClaim.findUnique({
        where: { id: claimId },
        select: {
          id: true,
          userId: true,
          desaId: true,
          status: true,
          desa: { select: { nama: true } },
          user: { select: { email: true, nama: true } },
        },
      });

      if (!claim) {
        return { kind: "error" as const, status: 404, body: { error: "Claim not found" } };
      }
      if (claim.status !== "IN_REVIEW") {
        return {
          kind: "error" as const,
          status: 422,
          body: { error: `Only IN_REVIEW claims can be approved. Current status: ${claim.status}` },
        };
      }

      // Guard 1 — desa already has a VERIFIED admin (one VERIFIED per desa)
      const existingVerified = await tx.desaAdminMember.findFirst({
        where: { desaId: claim.desaId, status: "VERIFIED" },
        select: { id: true, user: { select: { email: true } } },
      });
      if (existingVerified) {
        return {
          kind: "error" as const,
          status: 409,
          body: {
            error: `Desa ini sudah memiliki Admin Desa VERIFIED (${existingVerified.user.email}). Revoke akses tersebut sebelum menyetujui klaim baru.`,
            code: "DESA_ALREADY_HAS_VERIFIED",
          },
        };
      }

      // Guard 2 — target user already has active LIMITED/VERIFIED membership in another desa
      const memberElsewhere = await tx.desaAdminMember.findFirst({
        where: {
          userId: claim.userId,
          status: { in: ["LIMITED", "VERIFIED"] },
          NOT: { desaId: claim.desaId },
        },
        select: { id: true, status: true, desa: { select: { nama: true } } },
      });
      if (memberElsewhere) {
        return {
          kind: "error" as const,
          status: 409,
          body: {
            error: `User ini sudah terdaftar sebagai Admin Desa di ${memberElsewhere.desa.nama}. Revoke/remove akses tersebut dulu sebelum bisa diverifikasi di desa lain.`,
            code: "USER_ACTIVE_IN_OTHER_DESA",
            otherDesa: memberElsewhere.desa.nama,
            otherStatus: memberElsewhere.status,
          },
        };
      }

      const now = new Date();
      const renewalDueAt = addRenewalPeriod(now);

      await tx.desaAdminClaim.update({
        where: { id: claimId },
        data: {
          status: "APPROVED",
          verifiedAt: now,
          renewalDueAt,
          renewalReviewStatus: null,
          rejectCategory: null,
          rejectReason: null,
          rejectInstructions: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      await tx.desaAdminMember.upsert({
        where: { desaId_userId: { desaId: claim.desaId, userId: claim.userId } },
        create: {
          desaId: claim.desaId,
          userId: claim.userId,
          role: "VERIFIED_ADMIN",
          status: "VERIFIED",
          verifiedById: adminSession.userId,
          invitedAt: now,
          acceptedAt: now,
          renewalDueAt,
        },
        update: {
          role: "VERIFIED_ADMIN",
          status: "VERIFIED",
          verifiedById: adminSession.userId,
          revokedAt: null,
          revokedReason: null,
          renewalDueAt,
          updatedAt: now,
        },
      });

      return {
        kind: "ok" as const,
        claim,
      };
    });

    if (result.kind === "error") {
      return NextResponse.json(result.body, { status: result.status });
    }

    // Audit events run outside the transaction — they must never block or rollback the approve.
    await writeAuditEvent({
      eventType: AUDIT_EVENT.INTERNAL_CLAIM_APPROVED,
      desaId: result.claim.desaId,
      actorUserId: adminSession.userId,
      actorRole: "INTERNAL_ADMIN",
      targetUserId: result.claim.userId,
      claimId,
      entityType: "DesaAdminClaim",
      entityId: claimId,
      previousStatus: "IN_REVIEW",
      nextStatus: "APPROVED",
      metadata: {
        desaName: result.claim.desa.nama,
        userEmail: result.claim.user.email,
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.MEMBER_VERIFIED,
      desaId: result.claim.desaId,
      actorUserId: adminSession.userId,
      actorRole: "INTERNAL_ADMIN",
      targetUserId: result.claim.userId,
      claimId,
      entityType: "DesaAdminMember",
      previousStatus: "LIMITED",
      nextStatus: "VERIFIED",
      metadata: {
        desaName: result.claim.desa.nama,
        userEmail: result.claim.user.email,
      },
    });

    return NextResponse.json({
      ok: true,
      claimId,
      newClaimStatus: "APPROVED",
      newMemberStatus: "VERIFIED",
    });
  } catch (err) {
    return handleApiError(err, `POST /api/internal-admin/claims/${claimId}/approve`);
  }
}
