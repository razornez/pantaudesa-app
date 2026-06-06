import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getAdminDesaContext,
  type AdminDesaContext,
} from "@/lib/data/admin-desa-context";
import { perfLog, perfStart } from "@/lib/perf";

interface RequireAdminDesaContextOptions {
  loginRedirectTo?: string;
}

export async function requireAdminDesaContext(
  perfScope: string,
  options?: RequireAdminDesaContextOptions,
): Promise<AdminDesaContext> {
  const tAuth = perfStart();
  const session = await auth();
  perfLog(perfScope, "auth()", tAuth);

  if (!session?.user?.id) {
    const suffix = options?.loginRedirectTo
      ? `?next=${encodeURIComponent(options.loginRedirectTo)}`
      : "";
    redirect(`/login${suffix}`);
  }

  const tContext = perfStart();
  const context = await getAdminDesaContext(session.user.id);
  perfLog(perfScope, "getAdminDesaContext()", tContext);

  if (!context) {
    redirect("/profil/klaim-admin-desa?error=admin_desa_only");
  }

  return context;
}
