import Link from "next/link";
import { CalendarClock, ExternalLink, ShieldCheck, Sparkles, Users } from "lucide-react";
import { requireAdminDesaContext } from "@/lib/admin-desa/require-context";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";

export const dynamic = "force-dynamic";

const COPY = BACK_OFFICE_COPY.adminDesa.profile;

export default async function AdminDesaProfilePage() {
  const ctx = await requireAdminDesaContext("admin-desa.profil");

  const isVerified = ctx.member.status === "VERIFIED";
  const membershipLabel = isVerified ? COPY.membership.verified : COPY.membership.limited;
  const roleLabel = ctx.member.role === "VERIFIED_ADMIN" ? COPY.role.verifiedAdmin : COPY.role.limitedAdmin;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <p className="eyebrow text-[10px]">{COPY.headingEyebrow}</p>
          <h1 className="display text-[24px] sm:text-[30px] font-semibold text-slate-900 tracking-tight leading-tight">
            {COPY.headingTitle}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            {COPY.headingBody(ctx.desa.nama)}
          </p>
        </div>

        <Link
          href={`/desa/${ctx.desa.slug}`}
          className="btn-lux btn-lux-ghost w-full sm:w-auto text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {COPY.viewPublicProfile} <ExternalLink size={14} aria-hidden />
        </Link>
      </header>

      <section className={`lux-panel p-5 sm:p-6 ${isVerified ? "lux-status-good" : "lux-status-warn"}`}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-[10px]">{COPY.membershipEyebrow}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <p className={`display text-[24px] sm:text-[30px] font-semibold ${isVerified ? "text-emerald-900" : "text-amber-900"}`}>
                    {membershipLabel}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isVerified ? "pill-ok" : "pill-warn"}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isVerified ? "#10B981" : "#D97706" }} aria-hidden />
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
                <div className="metric-card p-3 sm:p-4">
                  <p className="metric-label text-[10px]">{COPY.metrics.joined}</p>
                  <p className="metric-value text-[1.05rem] sm:text-[1.2rem]">
                    {new Date(ctx.member.joinedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="metric-note text-[10px]">{COPY.metrics.joinedNote}</p>
                </div>
                <div className="metric-card p-3 sm:p-4">
                  <p className="metric-label text-[10px]">{COPY.metrics.renewal}</p>
                  <p className="metric-value text-[1.05rem] sm:text-[1.2rem]">{ctx.member.renewalDueAt ? COPY.metrics.renewalOn : COPY.metrics.renewalOff}</p>
                  <p className="metric-note text-[10px]">
                    {ctx.renewal.daysUntil !== null ? COPY.metrics.days(ctx.renewal.daysUntil) : COPY.metrics.renewalInactive}
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="metric-card p-4"><dt className="metric-label">{COPY.metrics.desa}</dt><dd className="mt-2 font-semibold text-slate-900">{ctx.desa.nama}</dd><p className="metric-note">{ctx.desa.kecamatan}, {ctx.desa.kabupaten}</p></div>
              <div className="metric-card p-4"><dt className="metric-label">{COPY.metrics.location}</dt><dd className="mt-2 text-slate-800">{ctx.desa.provinsi}</dd><p className="metric-note">{COPY.metrics.workArea}</p></div>
              <div className="metric-card p-4"><dt className="metric-label">{COPY.metrics.inviteAccepted}</dt><dd className="mt-2 text-slate-800">{ctx.member.acceptedAt ? new Date(ctx.member.acceptedAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : COPY.metrics.noInvite}</dd></div>
              <div className="metric-card p-4"><dt className="metric-label">{COPY.metrics.nextRenewal}</dt><dd className={`mt-2 font-medium ${ctx.renewal.state === "OVERDUE" ? "text-rose-700" : ctx.renewal.state === "URGENT" || ctx.renewal.state === "DUE_SOON" ? "text-amber-700" : "text-slate-800"}`}>{ctx.member.renewalDueAt ? new Date(ctx.member.renewalDueAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : COPY.metrics.noSchedule}</dd></div>
            </dl>
          </div>

          <aside className="space-y-3">
            <div className="notice-card notice-info">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.08)]"><ShieldCheck size={20} aria-hidden /></span>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold">{COPY.currentRole.title}</p>
                  <p className="text-sm leading-relaxed opacity-90">{isVerified ? COPY.currentRole.verified : COPY.currentRole.limited}</p>
                </div>
              </div>
            </div>

            <div className="notice-card notice-ok">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)]"><Sparkles size={20} aria-hidden /></span>
                <div className="space-y-2 min-w-0">
                  <p className="text-sm font-semibold">{COPY.workStandard.title}</p>
                  <ul className="space-y-1.5 text-sm leading-relaxed opacity-90">
                    {COPY.workStandard.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="lux-card p-5 sm:p-6 space-y-4"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><Users size={18} aria-hidden /></span><div><p className="eyebrow text-[10px]">{COPY.access.eyebrow}</p><h2 className="text-[18px] font-semibold text-slate-900 mt-1">{COPY.access.title}</h2></div></div><ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed">{(isVerified ? COPY.access.verified : COPY.access.limited).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="lux-card p-5 sm:p-6 space-y-4"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><CalendarClock size={18} aria-hidden /></span><div><p className="eyebrow text-[10px]">{COPY.limits.eyebrow}</p><h2 className="text-[18px] font-semibold text-slate-900 mt-1">{COPY.limits.title}</h2></div></div><ul className="space-y-2.5 text-sm leading-relaxed">{(isVerified ? COPY.limits.verified : COPY.limits.limited).map((item) => <li key={item} className={isVerified ? "text-slate-700" : "text-rose-700"}>{item}</li>)}</ul></div>
      </section>

      {isVerified && (ctx.renewal.state === "URGENT" || ctx.renewal.state === "OVERDUE") && <section className={`notice-card ${ctx.renewal.state === "OVERDUE" ? "notice-danger" : "notice-warn"}`} role="alert"><p className="eyebrow text-[10px]" style={{ color: ctx.renewal.state === "OVERDUE" ? "#9F1239" : "#B45309" }}>{COPY.renewalAlert.eyebrow}</p><h2 className="display text-[20px] font-semibold mt-2">{ctx.renewal.state === "OVERDUE" ? COPY.renewalAlert.overdueTitle : COPY.renewalAlert.urgentTitle}</h2><p className="text-sm mt-2 leading-relaxed opacity-90 max-w-3xl">{COPY.renewalAlert.body}</p></section>}
    </div>
  );
}
