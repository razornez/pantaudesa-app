import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

const FRAUD_COOLDOWN_DAYS = 3;
const DEFAULT_COOLDOWN_DAYS = 1;

const VALID_REASON_CATEGORIES = [
  "WEBSITE_NOT_OFFICIAL",
  "WEBSITE_MISMATCH",
  "TOKEN_NOT_VALID",
  "EMAIL_NOT_CONVINCING",
  "DOCUMENT_NOT_SUFFICIENT",
  "SOURCE_CONFLICT",
  "SUSPICIOUS_ACTIVITY",
  "RENEWAL_FAILED",
  "OTHER",
] as const;
type ReasonCategory = typeof VALID_REASON_CATEGORIES[number];

interface RejectBody {
  reasonCategory: ReasonCategory;
  reasonText: string;
  fixInstructions: string;
  isFraud?: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ claimId: string }> },
) {
  try {
    const adminSession = await requireInternalAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { claimId } = await params;

    let body: RejectBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { reasonCategory, reasonText, fixInstructions, isFraud = false } = body;

    if (!reasonCategory || !VALID_REASON_CATEGORIES.includes(reasonCategory)) {
      return NextResponse.json({ error: "Valid reasonCategory is required" }, { status: 400 });
    }
    if (!reasonText?.trim()) {
      return NextResponse.json({ error: "reasonText is required" }, { status: 400 });
    }
    if (!fixInstructions?.trim()) {
      return NextResponse.json({ error: "fixInstructions is required" }, { status: 400 });
    }

    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        desa: { select: { nama: true } },
        user: { select: { email: true } },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    if (claim.status !== "IN_REVIEW" && claim.status !== "PENDING") {
      return NextResponse.json({
        error: `Only PENDING or IN_REVIEW claims can be rejected. Current status: ${claim.status}`,
      }, { status: 422 });
    }

    const now = new Date();
    const cooldownDays = isFraud ? FRAUD_COOLDOWN_DAYS : DEFAULT_COOLDOWN_DAYS;
    const reapplyAllowedAt = new Date(now.getTime() + cooldownDays * 86_400_000);
    const fraudCooldownUntil = isFraud ? reapplyAllowedAt : null;

    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        status: "REJECTED",
        rejectedAt: now,
        rejectionReason: reasonText,
        rejectCategory: reasonCategory,
        rejectReason: reasonText,
        rejectInstructions: fixInstructions,
        reapplyAllowedAt,
        fraudCooldownUntil,
      },
    });

    const auditEventType = isFraud
      ? AUDIT_EVENT.INTERNAL_COOLDOWN_APPLIED
      : AUDIT_EVENT.INTERNAL_CLAIM_REJECTED;

    await writeAuditEvent({
      eventType: auditEventType,
      desaId: claim.desaId,
      actorUserId: adminSession.userId,
      actorRole: "INTERNAL_ADMIN",
      targetUserId: claim.userId,
      claimId,
      entityType: "DesaAdminClaim",
      entityId: claimId,
      previousStatus: claim.status,
      nextStatus: "REJECTED",
      reasonCategory,
      reasonText,
      metadata: {
        isFraud,
        cooldownDays,
        reapplyAllowedAt: reapplyAllowedAt.toISOString(),
        desaName: claim.desa.nama,
        userEmail: claim.user.email,
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      claimId,
      newStatus: "REJECTED",
      isFraud,
      reapplyAllowedAt: reapplyAllowedAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, `POST /api/internal-admin/claims/${(await params).claimId}/reject`);
  }
}
