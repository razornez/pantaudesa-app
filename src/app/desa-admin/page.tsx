import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Legacy route — Sprint 04-008 moved Admin Desa surface to /profil/admin-desa.
// /profil resolves the correct destination based on the user's actual capabilities
// (active membership status, internal admin flag, ordinary user).
export default function LegacyDesaAdminEntry() {
  redirect("/profil");
}
