import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { createNotifications, NOTIF_TYPE } from "@/lib/notifications/create-notification";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Login diperlukan untuk vote" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { type } = body;

    if (type !== "BENAR" && type !== "BOHONG") {
      return NextResponse.json({ error: "type harus 'BENAR' atau 'BOHONG'" }, { status: 400 });
    }

    const voice = await db.voice.findUnique({
      where: { id },
      select: { id: true, desaId: true, authorId: true },
    });
    if (!voice) {
      return NextResponse.json({ error: "Suara tidak ditemukan" }, { status: 404 });
    }

    const existing = await db.voiceVote.findUnique({
      where: { voiceId_userId: { voiceId: id, userId: session.user.id } },
      select: { type: true },
    });

    if (!existing) {
      await db.voiceVote.create({
        data: { voiceId: id, userId: session.user.id, type },
      });
    }

    const [benar, bohong] = await Promise.all([
      db.voiceVote.count({ where: { voiceId: id, type: "BENAR" } }),
      db.voiceVote.count({ where: { voiceId: id, type: "BOHONG" } }),
    ]);

    if (!existing) {
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
        type: NOTIF_TYPE.VOICE_VOTED,
        title: "Ada vote baru di suara warga",
        body: type === "BENAR" ? "Ada warga yang menandai suara ini benar." : "Ada warga yang menandai suara ini perlu dicek.",
        metadata: { voiceId: id, actorUserId: session.user.id, voteType: type, benar, bohong },
      })));
    }

    return NextResponse.json({ benar, bohong, viewerVoteType: existing?.type ?? type });
  } catch (error) {
    return handleApiError(error, "POST /api/voices/[id]/vote");
  }
}
