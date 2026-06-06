import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { createNotification, NOTIF_TYPE } from "@/lib/notifications/create-notification";
import { isVerifiedAdminMember } from "@/lib/admin-desa/policy";

function parseRejectReason(value: unknown) {
  if (typeof value !== "string") return null;
  const reason = value.trim();
  if (!reason) return null;
  return reason.slice(0, 2000);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const reason = parseRejectReason((body as { reason?: unknown } | null)?.reason);
    if (!reason) {
      return NextResponse.json({
        error: "Alasan penolakan wajib diisi.",
        code: "REJECT_REASON_REQUIRED",
      }, { status: 400 });
    }

    const doc = await db.adminDesaDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        desaId: true,
        status: true,
        title: true,
        uploadedById: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.status !== "WAITING_VERIFIED_APPROVAL") {
      return NextResponse.json({
        error: `Hanya dokumen dengan status WAITING_VERIFIED_APPROVAL yang dapat ditolak. Saat ini: ${doc.status}.`,
      }, { status: 422 });
    }

    const actor = await db.desaAdminMember.findFirst({
      where: {
        desaId: doc.desaId,
        userId,
      },
      select: { status: true, role: true },
    });

    if (!actor || !isVerifiedAdminMember(actor.status, actor.role)) {
      return NextResponse.json({
        error: "Hanya Admin Desa VERIFIED yang dapat menolak dokumen.",
      }, { status: 403 });
    }

    const now = new Date();
    await db.adminDesaDocument.update({
      where: { id: documentId },
      data: {
        status: "REJECTED",
        rejectedReason: reason,
        updatedAt: now,
      },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.DOCUMENT_REJECTED_BY_VERIFIED,
      desaId: doc.desaId,
      actorUserId: userId,
      actorRole: "VERIFIED_ADMIN",
      targetUserId: doc.uploadedById ?? undefined,
      entityType: "AdminDesaDocument",
      entityId: doc.id,
      previousStatus: "WAITING_VERIFIED_APPROVAL",
      nextStatus: "REJECTED",
      reasonText: reason,
      metadata: {
        title: doc.title,
        action: "rejected-by-verified",
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    if (doc.uploadedById) {
      await createNotification({
        userId: doc.uploadedById,
        type: NOTIF_TYPE.DOCUMENT_REJECTED,
        title: "Dokumen kamu ditolak",
        body: `"${doc.title}" ditolak oleh Admin VERIFIED. Alasan: ${reason}`,
        desaId: doc.desaId,
        metadata: { documentId, reason },
      });
    }

    return NextResponse.json({
      ok: true,
      documentId,
      newStatus: "REJECTED",
    });
  } catch (err) {
    return handleApiError(err, `POST /api/admin-claim/documents/${documentId}/reject`);
  }
}
