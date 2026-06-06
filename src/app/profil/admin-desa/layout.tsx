import Link from "next/link";
import { getVisibleTabs } from "@/lib/admin-claim/profile-tabs";
import { requireAdminDesaContext } from "@/lib/admin-desa/require-context";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";
import AdminDesaBadge from "@/components/admin-desa/AdminDesaBadge";
import AdminDesaTabNav from "@/components/admin-desa/AdminDesaTabNav";
import { BadgeCheck, Sparkles } from "lucide-react";

const COPY = BACK_OFFICE_COPY.adminDesa.shell;

export const dynamic = "force-dynamic";

export default async function AdminDesaLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdminDesaContext("admin-desa.layout", {
    loginRedirectTo: "/profil/admin-desa",
  });

  const visibleTabs = getVisibleTabs(ctx.member.status);
  const isVerified = ctx.member.status === "VERIFIED";
  const membershipLabel = isVerified ? COPY.membership.verified : COPY.membership.limited;
  const roleLabel = ctx.member.role === "VERIFIED_ADMIN" ? COPY.role.verifiedAdmin : COPY.role.limitedAdmin;
  const accountBadgeLabel = isVerified ? "Verified" : COPY.accountStatus.limitedBadge;
  const renewalValue = ctx.member.renewalDueAt ? COPY.renewal.active : COPY.renewal.emptyValue;
  const renewalNote = ctx.member.renewalDueAt
    ? ctx.renewal.daysUntil !== null
      ? COPY.renewal.days(ctx.renewal.daysUntil)
      : COPY.renewal.scheduled
    : COPY.renewal.none;

  return (
    <div className="min-h-screen" data-testid="admin-desa-shell">
      <header className="pt-5 sm:pt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="lux-panel overflow-hidden">
            <div className="px-5 sm:px-7 pt-6 pb-5 sm:pt-7 sm:pb-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <AdminDesaBadge
                    status={ctx.member.status}
                    role={ctx.member.role}
                    desaName={ctx.desa.nama}
                    renewalDueAt={ctx.member.renewalDueAt}
                    renewalState={ctx.renewal.state}
                    daysUntilRenewal={ctx.renewal.daysUntil}
                    avatarUrl={ctx.user.avatarUrl}
                    displayName={ctx.user.nama ?? ctx.user.username ?? ctx.user.email}
                  />
                  <div className="min-w-0 space-y-2.5">
                    <p className="eyebrow text-[10px]">{COPY.eyebrow}</p>
                    <div>
                      <p className="display text-[22px] sm:text-[28px] font-semibold text-slate-900 tracking-tight leading-tight">{ctx.desa.nama}</p>
                      <p className="text-[13px] sm:text-sm text-slate-500 mt-1 leading-snug sm:leading-relaxed">
                        {ctx.desa.kecamatan}, {ctx.desa.kabupaten}, {ctx.desa.provinsi}
                      </p>
                    </div>
                    <div className="flex max-w-full flex-nowrap items-center gap-1.5 overflow-hidden px-0 py-0 sm:p-0">
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold whitespace-nowrap sm:px-2.5 sm:py-1 sm:text-[11px] ${isVerified ? "pill-ok" : "pill-warn"}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isVerified ? "#10B981" : "#D97706" }} aria-hidden />
                        {membershipLabel}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold whitespace-nowrap pill-info sm:px-2.5 sm:py-1 sm:text-[11px]">{roleLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 lg:items-end">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full lg:w-auto">
                    <div className="metric-card min-w-0 !p-3 sm:!p-4 sm:min-w-[132px]">
                      <p className="metric-label text-[10px]">{COPY.accountStatus.title}</p>
                      <div className="mt-2 flex items-center gap-2 min-w-0">
                        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isVerified ? "bg-[#1877F2] text-white" : "bg-amber-500 text-white"}`}>
                          {isVerified ? <BadgeCheck size={15} aria-hidden /> : <Sparkles size={14} aria-hidden />}
                        </span>
                        <span className={`inline-flex min-w-0 shrink items-center rounded-full px-2.5 py-1.5 text-[12px] font-semibold leading-none whitespace-nowrap ${isVerified ? "bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(16,185,129,0.12))] text-slate-900 ring-1 ring-indigo-100" : "bg-amber-50 text-amber-900 ring-1 ring-amber-100"}`}>{accountBadgeLabel}</span>
                      </div>
                    </div>
                    <div className="metric-card min-w-0 !p-3 sm:!p-4 sm:min-w-[132px]">
                      <p className="metric-label text-[10px]">{COPY.renewal.title}</p>
                      <p className="metric-value text-[1.2rem] sm:text-[1.35rem] mt-2">{renewalValue}</p>
                      <p className="metric-note text-[11px] leading-snug mt-1">{renewalNote}</p>
                    </div>
                  </div>

                  <Link prefetch={false} href="/profil/saya" className="btn-lux btn-lux-secondary w-full lg:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                    {COPY.backToProfile}
                  </Link>
                </div>
              </div>
            </div>

            <AdminDesaTabNav tabs={visibleTabs} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
