import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

interface ReportBody {
  desaId: string;
  reason: string;
  reportedUserId?: string;
  description?: string;
  evidenceUrl?: string;
  reporterEmail?: string;
}

const ALLOWED_REASONS = [
  "impersonation",
  "unauthorized_access",
  "false_claim",
  "data_manipulation",
  "other",
] as const;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    // Auth optional — anonymous report allowed but user is recorded if logged in
    const session = await auth();
    const reporterUserId = session?.user?.id ?? null;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let body: ReportBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { desaId, reason, reportedUserId, description, evidenceUrl, reporterEmail } = body;

    if (!desaId || typeof desaId !== "string") {
      return NextResponse.json({ error: "desaId is required" }, { status: 400 });
    }
    if (!reason || !ALLOWED_REASONS.includes(reason as typeof ALLOWED_REASONS[number])) {
      return NextResponse.json({
        error: `reason must be one of: ${ALLOWED_REASONS.join(", ")}`,
      }, { status: 400 });
    }
    if (evidenceUrl && !isValidUrl(evidenceUrl)) {
      return NextResponse.json({ error: "Invalid evidenceUrl" }, { status: 400 });
    }
    if (reporterEmail && !isValidEmail(reporterEmail)) {
      return NextResponse.json({ error: "Invalid reporterEmail format" }, { status: 400 });
    }
    if (description && description.length > 2000) {
      return NextResponse.json({ error: "description too long (max 2000 chars)" }, { status: 400 });
    }

    // Verify desa exists
    const desa = await db.desa.findUnique({ where: { id: desaId }, select: { id: true } });
    if (!desa) {
      return NextResponse.json({ error: "Desa not found" }, { status: 404 });
    }

    // No auto-suspend — create record and audit only
    const report = await db.fakeAdminReport.create({
      data: {
        desaId,
        reason,
        reportedUserId: reportedUserId ?? null,
        reporterUserId: reporterUserId ?? null,
        description: description ?? null,
        evidenceUrl: evidenceUrl ?? null,
        reporterEmail: reporterEmail ?? null,
        status: "OPEN",
      },
      select: { id: true },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.FAKE_ADMIN_REPORT_SUBMITTED,
      desaId,
      actorUserId: reporterUserId ?? undefined,
      targetUserId: reportedUserId ?? undefined,
      metadata: {
        reportId: report.id,
        reason,
        hasEvidence: Boolean(evidenceUrl),
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    // If a specific user was reported and has an active claim, write secondary audit
    if (reportedUserId) {
      const affectedClaim = await db.desaAdminClaim.findFirst({
        where: { desaId, userId: reportedUserId, status: { in: ["PENDING", "IN_REVIEW"] } },
        select: { id: true },
      });
      if (affectedClaim) {
        await writeAuditEvent({
          eventType: AUDIT_EVENT.ADMIN_CLAIM_FLAGGED_BY_PUBLIC,
          desaId,
          actorUserId: reporterUserId ?? undefined,
          targetUserId: reportedUserId,
          claimId: affectedClaim.id,
          metadata: { reportId: report.id, reason },
        });
      }
    }

    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/report-fake-admin");
  }
}
