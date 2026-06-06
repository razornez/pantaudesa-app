import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { sendContactAdminEmail } from "@/lib/email/admin-claim-email";

interface SupportSubmitBody {
  claimId: string;
  desaId: string;
  reason: string;
  explanation: string;
  whyCannotVerify: string;
  evidenceDescription?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let body: SupportSubmitBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { claimId, desaId, reason, explanation, whyCannotVerify, evidenceDescription } = body;

    if (!claimId || !desaId) {
      return NextResponse.json({ error: "claimId and desaId are required" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }
    if (!explanation?.trim()) {
      return NextResponse.json({ error: "explanation is required" }, { status: 400 });
    }
    if (!whyCannotVerify?.trim()) {
      return NextResponse.json({ error: "whyCannotVerify is required" }, { status: 400 });
    }
    if (reason.length > 200) {
      return NextResponse.json({ error: "reason too long (max 200 chars)" }, { status: 400 });
    }
    if (explanation.length > 2000) {
      return NextResponse.json({ error: "explanation too long (max 2000 chars)" }, { status: 400 });
    }

    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        desaId: true,
        status: true,
        supportSubmittedAt: true,
        desa: { select: { nama: true } },
        user: { select: { nama: true, email: true } },
      },
    });

    if (!claim || claim.userId !== userId) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    if (claim.desaId !== desaId) {
      return NextResponse.json({ error: "Claim/desa mismatch" }, { status: 400 });
    }
    if (claim.status === "APPROVED") {
      return NextResponse.json({ error: "Claim already approved" }, { status: 422 });
    }

    const now = new Date();

    // Move claim to IN_REVIEW if it was PENDING
    const newStatus = claim.status === "PENDING" ? "IN_REVIEW" : claim.status;
    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        status: newStatus,
        supportSubmittedAt: now,
        ...(claim.status === "PENDING" ? { verifiedAt: now } : {}),
      },
    });

    // Notify internal admin via contact email
    const displayName = claim.user.nama ?? userEmail;
    const emailBody = [
      `Pengajuan Admin Desa baru melalui formulir Pengajuan Admin Desa.`,
      ``,
      `Desa: ${claim.desa.nama}`,
      `Pengaju: ${displayName} (${userEmail})`,
      `Claim ID: ${claimId}`,
      ``,
      `Alasan pengajuan: ${reason}`,
      ``,
      `Penjelasan:`,
      explanation,
      ``,
      `Mengapa tidak bisa verifikasi via website/email:`,
      whyCannotVerify,
      evidenceDescription ? `\nDeskripsi bukti/evidence:\n${evidenceDescription}` : "",
    ].join("\n");

    const emailResult = await sendContactAdminEmail({
      subject: `[Pengajuan Admin Desa] ${claim.desa.nama} — ${displayName}`,
      description: emailBody,
      requesterEmail: userEmail,
      sourcePage: `/profil/klaim-admin-desa/pengajuan`,
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.CLAIM_SUPPORT_SUBMITTED,
      desaId,
      actorUserId: userId,
      claimId,
      method: "SUPPORT_REVIEW",
      previousStatus: claim.status,
      nextStatus: newStatus,
      metadata: {
        desaName: claim.desa.nama,
        reason,
        hasEvidence: Boolean(evidenceDescription),
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.code,
        supportSubmittedAt: now.toISOString(),
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    const isRejected = claim.status === "REJECTED";
    const message = isRejected
      ? "Bukti tambahan kamu berhasil dikirim. Status klaim tetap REJECTED sampai admin PantauDesa meninjau ulang bukti ini. Hasil peninjauan akan dikirimkan via email."
      : "Bukti pengajuan Admin Desa berhasil dikirim. Klaim kamu masuk tahap review internal. Admin PantauDesa akan memeriksa bukti dan memberikan keputusan atau instruksi lanjutan.";

    return NextResponse.json({
      ok: true,
      claimId,
      newStatus,
      previousStatus: claim.status,
      supportSubmittedAt: now.toISOString(),
      emailSent: emailResult.ok,
      message,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/support-submission");
  }
}
