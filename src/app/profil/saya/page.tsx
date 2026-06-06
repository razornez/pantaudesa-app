import { redirect } from "next/navigation";
import SayaProfileClient from "@/app/profil/saya/SayaProfileClient";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminClaimProfileSummaryData } from "@/lib/data/admin-claim-read";
import { getVoicesByAuthorIdFromDb } from "@/lib/data/voice-read";
import { computeTrustStatsFromVoices, deriveNotifications } from "@/lib/user-profile";

export const dynamic = "force-dynamic";

export default async function SayaProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, initialAdminClaimProfile, voices] = await Promise.all([
    db
      ? db.user.findUnique({
          where: { id: session.user.id },
          select: {
            nama: true,
            bio: true,
            avatarUrl: true,
          },
        })
      : Promise.resolve(null),
    getAdminClaimProfileSummaryData(session.user.id),
    getVoicesByAuthorIdFromDb(session.user.id),
  ]);

  const selfName = profile?.nama ?? session.user.name ?? "";
  const trustStats = computeTrustStatsFromVoices(voices);
  const notifications = deriveNotifications(voices, selfName);

  return (
    <SayaProfileClient
      initialAdminClaimProfile={initialAdminClaimProfile}
      initialProfile={{
        nama: selfName,
        bio: profile?.bio ?? "",
        avatarUrl: profile?.avatarUrl ?? undefined,
      }}
      voices={voices}
      trustStats={trustStats}
      notifications={notifications}
    />
  );
}
