import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Legacy — fixes the "/desa-admin/profil blank" regression by routing through /profil,
// which resolves to /profil/admin-desa for active members or /profil/saya otherwise.
// No client-side useAuth check that could bounce a logged-in user back to /login.
export default function LegacyDesaAdminProfil() {
  redirect("/profil");
}
