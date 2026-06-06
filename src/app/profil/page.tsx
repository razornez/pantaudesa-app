import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * /profil — universal entrypoint for the user's account area.
 * Resolves the right destination based on the user's actual capabilities:
 *   - INTERNAL_ADMIN  → /internal-admin
 *   - active LIMITED/VERIFIED Admin Desa member → /profil/admin-desa
 *   - everyone else (WARGA, applicants, REVOKED/EXPIRED) → /profil/saya
 *
 * The navbar account link points here so we never have to encode role logic
 * in the client. New role types can be handled in one place.
 */
export default async function ProfilEntryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/profil");
  }
  const userId = session.user.id;

  // Internal admin always goes to their own panel.
  if (session.user.role === "INTERNAL_ADMIN") {
    redirect("/internal-admin");
  }

  // Check active Admin Desa membership.
  if (db) {
    const member = await db.desaAdminMember.findFirst({
      where: { userId, status: { in: ["LIMITED", "VERIFIED"] } },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (member) {
      redirect("/profil/admin-desa");
    }
  }

  // Default: ordinary citizen profile.
  redirect("/profil/saya");
}
