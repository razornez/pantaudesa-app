import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { createNotifications, NOTIF_TYPE } from "@/lib/notifications/create-notification";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Login diperlukan" }, { status: 401 });
    }

    const { id } = await params;

    const voice = await db.voice.findUnique({
      where: { id },
      select: {
        id: true,
        desaId: true,
        authorId: true,
        author: { select: { nama: true, username: true, email: true } },
      },
    });
    if (!voice) {
      return NextResponse.json({ error: "Suara tidak ditemukan" }, { status: 404 });
    }

    await db.voiceHelpful.upsert({
      where: { voiceId_userId: { voiceId: id, userId: session.user.id } },
      update: {},
      create: { voiceId: id, userId: session.user.id },
    });

    const count = await db.voiceHelpful.count({ where: { voiceId: id } });

    const admins = await db.desaAdminMember.findMany({
      where: {
        desaId: voice.desaId,
        status: { in: ["VERIFIED", "LIMITED"] },
        userId: { not: session.user.id },
      },
      select: { userId: true },
    });
    const recipients = new Set(admins.map((a) => a.userId));
    if (voice.authorId && voice.authorId !== session.user.id) recipients.add(voice.authorId);

    void createNotifications([...recipients].map((userId) => ({
      userId,
      desaId: voice.desaId,
      type: NOTIF_TYPE.VOICE_HELPFUL,
      title: "Suara warga ditandai berguna",
      body: "Ada warga yang menandai suara warga sebagai berguna.",
      metadata: { voiceId: id, actorUserId: session.user.id, helpful: count },
    })));

    return NextResponse.json({ helpful: count });
  } catch (error) {
    return handleApiError(error, "POST /api/voices/[id]/helpful");
  }
}
