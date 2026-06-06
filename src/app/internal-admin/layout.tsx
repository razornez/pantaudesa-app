import Link from "next/link";
import { redirect } from "next/navigation";
import { House, ShieldCheck } from "lucide-react";
import InternalAdminLogoutButton from "@/components/internal-admin/InternalAdminLogoutButton";
import { auth } from "@/lib/auth";
import { getInternalAdminSession } from "@/lib/auth/internal-admin";
import {
  INTERNAL_ADMIN_AREAS_SUMMARY,
  INTERNAL_ADMIN_NAV_ITEMS,
} from "@/lib/internal-admin/constants";
import { perfLog, perfStart } from "@/lib/perf";

export default async function InternalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = perfStart();
  const session = await getInternalAdminSession();
  perfLog("internal-admin.layout", "getInternalAdminSession()", t);
  if (!session) {
    // Distinguish "not logged in" from "logged in but not internal admin".
    // A logged-in non-admin keeps their session and is sent somewhere usable —
    // never to a non-existent /masuk route (which rendered the 404 page) and
    // never logged out. Only truly unauthenticated users go to /login.
    const rawSession = await auth();
    redirect(
      rawSession?.user?.id
        ? "/?error=akses-ditolak"
        : "/login?next=/internal-admin",
    );
  }

  return (
    <div className="min-h-screen" data-testid="internal-admin-shell">
      <header className="pt-4 sm:pt-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="lux-panel overflow-hidden">
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: icon + title */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(16,185,129,0.12))] text-[#1E1B4B] shadow-[inset_0_0_0_1px_rgba(79,70,229,0.14),0_14px_24px_-20px_rgba(15,23,42,0.35)]">
                    <ShieldCheck size={20} aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="eyebrow text-[9px] sm:text-[10px]">Back Office PantauDesa</p>
                    <h1 className="display text-[20px] sm:text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
                      Internal Admin
                    </h1>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="pill-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        Akses internal
                      </span>
                      <span className="pill-info inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        Audit tercatat
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: compact summary */}
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="lux-card px-3 py-1.5">
                    <span className="text-slate-500">3 area: </span>
                    <span className="font-semibold text-slate-900">{INTERNAL_ADMIN_AREAS_SUMMARY}</span>
                  </span>
                  <Link
                    href="/"
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 t-spring hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <House size={13} aria-hidden />
                    Beranda
                  </Link>
                  <InternalAdminLogoutButton />
                </div>
              </div>
            </div>

            <nav
              aria-label="Internal admin navigation"
              className="overflow-x-auto no-scrollbar"
              style={{ borderTop: "1px solid var(--hair)" }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
                <div className="inline-flex min-w-max items-center gap-1.5 rounded-[1.2rem] bg-white/80 p-1 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_14px_28px_-20px_rgba(15,23,42,0.2)]">
                  {INTERNAL_ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 t-spring hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      <Icon size={14} aria-hidden />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
