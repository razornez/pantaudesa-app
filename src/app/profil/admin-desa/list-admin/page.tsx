import { getDesaAdminRoster } from "@/lib/data/desa-admins";
import AdminDesaListAdminClient from "@/components/admin-desa/AdminDesaListAdminClient";
import { requireAdminDesaContext } from "@/lib/admin-desa/require-context";
import { perfLog, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

const MAX_ADMINS_PER_DESA = 5;

export default async function AdminDesaListAdminPage() {
  const ctx = await requireAdminDesaContext("admin-desa.list-admin");

  const tRoster = perfStart();
  const roster = await getDesaAdminRoster(ctx.desa.id);
  perfLog("admin-desa.list-admin", "getDesaAdminRoster()", tRoster);
  const canManage = ctx.member.status === "VERIFIED" && ctx.member.role === "VERIFIED_ADMIN";

  return (
    <AdminDesaListAdminClient
      currentUserId={ctx.user.id}
      desaId={ctx.desa.id}
      desaName={ctx.desa.nama}
      canManage={canManage}
      roster={roster}
      maxAdmins={MAX_ADMINS_PER_DESA}
    />
  );
}
