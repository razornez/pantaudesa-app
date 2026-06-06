import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Legacy — the old client-only mocked upload page caused "false success" reports
// because it never called /api/admin-claim/documents/upload. The real upload flow
// lives at /profil/admin-desa/dokumen and is wired to Supabase Storage + Prisma.
export default function LegacyDesaAdminDokumen() {
  redirect("/profil/admin-desa/dokumen");
}
