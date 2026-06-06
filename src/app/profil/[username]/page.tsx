import PublicProfileClient, { type PublicProfileUser } from "./PublicProfileClient";
import { db } from "@/lib/db";
import { getVoicesByAuthorIdFromDb } from "@/lib/data/voice-read";
import { computeTrustStatsFromVoices } from "@/lib/user-profile";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = db
    ? await db.user.findFirst({
        where: { username },
        select: {
          id: true,
          nama: true,
          name: true,
          username: true,
          bio: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      })
    : null;

  if (!user) {
    return <PublicProfileClient username={username} profileUser={null} voices={[]} stats={null} />;
  }

  const voices = await getVoicesByAuthorIdFromDb(user.id);
  const stats = computeTrustStatsFromVoices(voices);
  const profileUser: PublicProfileUser = {
    nama: user.nama ?? user.name ?? user.username ?? "Warga",
    username: user.username ?? username,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    joinedAt: user.createdAt,
  };

  return (
    <PublicProfileClient username={username} profileUser={profileUser} voices={voices} stats={stats} />
  );
}
