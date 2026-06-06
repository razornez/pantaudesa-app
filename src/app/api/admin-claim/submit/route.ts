import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { ACTIVE_CLAIM_STATUSES, ACTIVE_MEMBER_STATUSES } from "@/lib/admin-claim/eligibility";

type ClaimMethod = "OFFICIAL_EMAIL" | "WEBSITE_TOKEN" | "SUPPORT_REVIEW";

interface SubmitBody {
  desaId: string;
  method: ClaimMethod;
  officialEmail?: string;
  websiteUrl?: string;
}

const ALLOWED_METHODS: ClaimMethod[] = ["OFFICIAL_EMAIL", "WEBSITE_TOKEN", "SUPPORT_REVIEW"];

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

    let body: SubmitBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { desaId, method, officialEmail, websiteUrl } = body;

    if (!desaId || typeof desaId !== "string") {
      return NextResponse.json({ error: "desaId is required" }, { status: 400 });
    }
    if (!method || !ALLOWED_METHODS.includes(method)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }
    if (method === "OFFICIAL_EMAIL" && officialEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail)) {
        return NextResponse.json({ error: "Invalid officialEmail format" }, { status: 400 });
      }
    }

    const desa = await db.desa.findUnique({
      where: { id: desaId },
      select: { id: true, nama: true },
    });
    if (!desa) {
      return NextResponse.json({ error: "Desa not found" }, { status: 404 });
    }

    // Block if desa already has a VERIFIED admin — direct to support path instead
    const existingVerified = await db.desaAdminMember.findFirst({
      where: { desaId, status: "VERIFIED" },
      select: { id: true },
    });
    if (existingVerified) {
      return NextResponse.json({
        error: `Desa ini sudah memiliki Admin Desa VERIFIED. Jika kamu ingin mengajukan pergantian atau pengkinian admin, hubungi admin PantauDesa melalui formulir Pengajuan Admin Desa dan sertakan bukti yang kuat.`,
        code: "DESA_ALREADY_HAS_VERIFIED",
      }, { status: 409 });
    }

    // One-user-one-desa: check active membership then active claims
    const [activeMember, activeClaim] = await Promise.all([
      db.desaAdminMember.findFirst({
        where: { userId, status: { in: [...ACTIVE_MEMBER_STATUSES] } },
        select: { desaId: true, desa: { select: { nama: true } } },
      }),
      db.desaAdminClaim.findFirst({
        where: { userId, status: { in: [...ACTIVE_CLAIM_STATUSES] } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, desaId: true, desa: { select: { nama: true } } },
      }),
    ]);

    if (activeMember) {
      return NextResponse.json({
        error: activeMember.desaId === desaId
          ? `Akun ini sudah tercatat sebagai admin untuk ${activeMember.desa.nama}.`
          : `Akun ini sudah mewakili ${activeMember.desa.nama}. Satu akun hanya boleh mengelola satu desa.`,
      }, { status: 409 });
    }

    if (activeClaim && activeClaim.desaId !== desaId) {
      return NextResponse.json({
        error: `Kamu masih punya klaim aktif untuk ${activeClaim.desa.nama}. Selesaikan klaim itu dulu sebelum memilih desa lain.`,
      }, { status: 409 });
    }

    // Check if user has a REJECTED claim with an active cooldown (server-side enforcement)
    const rejectedClaim = await db.desaAdminClaim.findFirst({
      where: { userId, desaId, status: "REJECTED" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, fraudCooldownUntil: true, reapplyAllowedAt: true },
    });

    if (rejectedClaim) {
      const now = new Date();
      if (rejectedClaim.fraudCooldownUntil && rejectedClaim.fraudCooldownUntil > now) {
        const cooldownDate = rejectedClaim.fraudCooldownUntil.toISOString();
        return NextResponse.json({
          error: `Klaim belum bisa diajukan ulang karena terdapat indikasi risiko pada proses verifikasi sebelumnya. Kamu bisa mengajukan ulang setelah ${cooldownDate}. Jika merasa ini keliru, hubungi admin PantauDesa.`,
          code: "FRAUD_COOLDOWN_ACTIVE",
          reapplyAllowedAt: cooldownDate,
        }, { status: 429 });
      }
      if (rejectedClaim.reapplyAllowedAt && rejectedClaim.reapplyAllowedAt > now) {
        const reapplyDate = rejectedClaim.reapplyAllowedAt.toISOString();
        return NextResponse.json({
          error: `Kamu belum bisa mengajukan ulang. Pengajuan ulang bisa dilakukan setelah ${reapplyDate}.`,
          code: "REAPPLY_COOLDOWN_ACTIVE",
          reapplyAllowedAt: reapplyDate,
        }, { status: 429 });
      }
    }

    const existing = await db.desaAdminClaim.findFirst({
      where: { userId, desaId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, method: true },
    });

    let claim;
    let eventType: typeof AUDIT_EVENT[keyof typeof AUDIT_EVENT];

    if (existing && (existing.status === "PENDING" || existing.status === "IN_REVIEW")) {
      // Update existing active claim
      claim = await db.desaAdminClaim.update({
        where: { id: existing.id },
        data: {
          method,
          officialEmail: officialEmail ?? null,
          websiteUrl: websiteUrl ?? null,
          updatedAt: new Date(),
        },
        select: { id: true, status: true, method: true },
      });
      eventType = existing.method !== method ? AUDIT_EVENT.CLAIM_METHOD_UPDATED : AUDIT_EVENT.CLAIM_REUSED;
    } else {
      // Create new claim (either no existing or previous was REJECTED/APPROVED)
      claim = await db.desaAdminClaim.create({
        data: {
          userId,
          desaId,
          method,
          status: "PENDING",
          officialEmail: officialEmail ?? null,
          websiteUrl: websiteUrl ?? null,
        },
        select: { id: true, status: true, method: true },
      });
      eventType = AUDIT_EVENT.CLAIM_STARTED;
    }

    await writeAuditEvent({
      eventType,
      desaId,
      actorUserId: userId,
      claimId: claim.id,
      method,
      nextStatus: claim.status,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata: { desaName: desa.nama, isNew: !existing },
    });

    return NextResponse.json({
      ok: true,
      claimId: claim.id,
      status: claim.status,
      method: claim.method,
      isNew: !existing,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/submit");
  }
}
