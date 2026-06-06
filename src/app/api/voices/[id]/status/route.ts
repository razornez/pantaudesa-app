import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
type VoiceStatusValue = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Layanan belum siap" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Login diperlukan" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const status = body.status as VoiceStatusValue;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const voice = await db.voice.findUnique({ where: { id }, select: { id: true, desaId: true } });
    if (!voice) {
      return NextResponse.json({ error: "Suara warga tidak ditemukan" }, { status: 404 });
    }

    // Only admin desa (VERIFIED or LIMITED) for this desa can update status
    const member = await db.desaAdminMember.findFirst({
      where: {
        userId: session.user.id,
        desaId: voice.desaId,
        status: { in: ["VERIFIED", "LIMITED"] },
      },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Akses ditolak. Hanya Admin Desa yang dapat mengubah status suara." }, { status: 403 });
    }

    const updated = await db.voice.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
      select: { id: true, status: true, resolvedAt: true },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      resolvedAt: updated.resolvedAt,
    });
  } catch (error) {
    return handleApiError(error, "PATCH /api/voices/[id]/status");
  }
}
