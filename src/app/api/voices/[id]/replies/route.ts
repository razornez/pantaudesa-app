import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { createNotifications, NOTIF_TYPE } from "@/lib/notifications/create-notification";

interface Params {
  params: Promise<{ id: string }>;
}

function displayName(user: { nama: string | null; username: string | null; email: string | null } | null) {
  return user?.nama ?? user?.username ?? user?.email ?? "Anonim";
}

function shapeReply(reply: {
  id: string;
  voiceId: string;
  isAnon: boolean;
  isOfficialDesa: boolean;
  text: string;
  createdAt: Date;
  author: { nama: string | null; username: string | null; email: string | null } | null;
}) {
  return {
    id: reply.id,
    voiceId: reply.voiceId,
    author: reply.isAnon ? "Anonim" : displayName(reply.author),
    isAnon: reply.isAnon,
    isOfficialDesa: reply.isOfficialDesa,
    text: reply.text,
    createdAt: reply.createdAt,
  };
}

async function notifyVoiceReply(input: {
  voiceId: string;
  desaId: string;
  actorUserId?: string;
  actorName: string;
  voiceAuthorId: string | null;
  isOfficialDesa: boolean;
}) {
  if (!db) return;

  const activeAdmins = await db.desaAdminMember.findMany({
    where: {
      desaId: input.desaId,
      status: { in: ["VERIFIED", "LIMITED"] },
      ...(input.actorUserId ? { userId: { not: input.actorUserId } } : {}),
    },
    select: { userId: true },
  });

  const recipients = new Set(activeAdmins.map((m) => m.userId));
  if (input.voiceAuthorId && input.voiceAuthorId !== input.actorUserId) {
    recipients.add(input.voiceAuthorId);
  }

  await createNotifications([...recipients].map((userId) => ({
    userId,
    desaId: input.desaId,
    type: NOTIF_TYPE.VOICE_REPLY_CREATED,
    title: input.isOfficialDesa ? "Ada balasan resmi desa" : "Ada komentar baru di suara warga",
    body: `${input.actorName} menambahkan komentar pada suara warga.`,
    metadata: { voiceId: input.voiceId, actorUserId: input.actorUserId ?? null, official: input.isOfficialDesa },
  })));
}

export async function POST(req: Request, { params }: Params) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Layanan komentar belum siap" }, { status: 503 });
    }

    const { id } = await params;
    const session = await auth();
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) return NextResponse.json({ error: "Komentar wajib diisi" }, { status: 400 });
    if (text.length < 3) return NextResponse.json({ error: "Komentar terlalu pendek" }, { status: 400 });
    if (text.length > 300) return NextResponse.json({ error: "Komentar terlalu panjang (maksimal 300 karakter)" }, { status: 400 });

    const voice = await db.voice.findUnique({
      where: { id },
      select: { id: true, desaId: true, authorId: true },
    });
    if (!voice) return NextResponse.json({ error: "Suara warga tidak ditemukan" }, { status: 404 });

    let isOfficialDesa = false;
    if (session?.user?.id) {
      const adminMember = await db.desaAdminMember.findFirst({
        where: {
          userId: session.user.id,
          desaId: voice.desaId,
          status: { in: ["VERIFIED", "LIMITED"] },
        },
        select: { id: true },
      });
      isOfficialDesa = !!adminMember;
    }

    const effectiveIsAnon = session?.user?.id ? false : true;

    const reply = await db.voiceReply.create({
      data: {
        voiceId: id,
        text,
        isAnon: effectiveIsAnon,
        isOfficialDesa,
        authorId: session?.user?.id ?? null,
      },
      include: { author: { select: { nama: true, username: true, email: true } } },
    });

    void notifyVoiceReply({
      voiceId: id,
      desaId: voice.desaId,
      actorUserId: session?.user?.id,
      actorName: shapeReply(reply).author,
      voiceAuthorId: voice.authorId,
      isOfficialDesa,
    });

    return NextResponse.json(shapeReply(reply), { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/voices/[id]/replies");
  }
}
