import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { isVerifiedAdminMember } from "@/lib/admin-desa/policy";
import { parseAdminDesaRevokeBody } from "@/lib/admin-desa/validation";

// POST /api/admin-claim/revoke-member/:memberId
// VERIFIED admin revokes LIMITED admin in the same desa.
// - VERIFIED cannot revoke another VERIFIED.
// - LIMITED cannot revoke anyone.
// - Internal admin revoke is handled separately (different route, future).
// Body: { reason?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const actorUserId = session.user.id;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let body: { reason?: string } = {};
    try {
      body = await req.json();
    } catch {
      // body is optional; reason will be missing
    }
    const { reason } = parseAdminDesaRevokeBody(body);

    const dbClient = db;
    const result = await dbClient.$transaction(async (tx) => {
      const target = await tx.desaAdminMember.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          userId: true,
          desaId: true,
          status: true,
          role: true,
          desa: { select: { nama: true } },
          user: { select: { email: true, nama: true } },
        },
      });

      if (!target) {
        return { kind: "error" as const, status: 404, body: { error: "Member not found" } };
      }

      // The actor must be a VERIFIED admin in the SAME desa.
      const actor = await tx.desaAdminMember.findFirst({
        where: {
          desaId: target.desaId,
          userId: actorUserId,
        },
        select: { id: true, status: true, role: true },
      });
      if (!actor || !isVerifiedAdminMember(actor.status, actor.role)) {
        return {
          kind: "error" as const,
          status: 403,
          body: { error: "Hanya Admin Desa VERIFIED yang dapat mencabut akses admin lain di desa ini." },
        };
      }

      // Self-revoke not allowed via this route.
      if (target.userId === actorUserId) {
        return {
          kind: "error" as const,
          status: 422,
          body: { error: "Tidak bisa mencabut akses akun kamu sendiri." },
        };
      }

      // VERIFIED cannot be revoked by another VERIFIED — only internal admin can.
      if (target.status === "VERIFIED" || target.role === "VERIFIED_ADMIN") {
        return {
          kind: "error" as const,
          status: 422,
          body: {
            error:
              "Tidak bisa mencabut akses Admin Desa VERIFIED. Hanya admin internal PantauDesa yang berwenang.",
          },
        };
      }

      // Only LIMITED active members can be revoked here.
      if (target.status !== "LIMITED") {
        return {
          kind: "error" as const,
          status: 422,
          body: { error: `Akses tidak bisa dicabut karena status saat ini: ${target.status}.` },
        };
      }

      const now = new Date();
      await tx.desaAdminMember.update({
        where: { id: memberId },
        data: {
          status: "REVOKED",
          revokedAt: now,
          revokedReason: reason ?? "Dicabut oleh Admin Desa VERIFIED",
          updatedAt: now,
        },
      });

      return {
        kind: "ok" as const,
        target,
        now,
      };
    });

    if (result.kind === "error") {
      return NextResponse.json(result.body, { status: result.status });
    }

    await writeAuditEvent({
      eventType: AUDIT_EVENT.MEMBER_REVOKED,
      desaId: result.target.desaId,
      actorUserId,
      actorRole: "VERIFIED_ADMIN",
      targetUserId: result.target.userId,
      entityType: "DesaAdminMember",
      entityId: memberId,
      previousStatus: "LIMITED",
      nextStatus: "REVOKED",
      reasonText: reason ?? undefined,
      metadata: {
        desaName: result.target.desa.nama,
        targetUserEmail: result.target.user.email,
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      memberId,
      newStatus: "REVOKED",
    });
  } catch (err) {
    return handleApiError(err, `POST /api/admin-claim/revoke-member/${memberId}`);
  }
}
