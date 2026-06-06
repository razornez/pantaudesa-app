"use client";

import Link from "next/link";
import { ArrowRight, LifeBuoy, ShieldCheck } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import ClaimStatusBadge from "@/components/profil/admin-claim/ClaimStatusBadge";
import { getCurrentDataStatus, getCurrentStatusTone } from "@/components/profil/admin-claim/adminClaimCopy";
import { useAdminClaimProfile } from "@/components/profil/admin-claim/useAdminClaimProfile";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";
import type { AuthUser } from "@/lib/auth-context";
import type { AdminClaimProfileSummaryData } from "@/lib/data/admin-claim-read";

const COPY = BACK_OFFICE_COPY.user.profileAdminCard;

type ClaimStatus = "none" | "pending" | "limited" | "verified" | "rejected" | "suspended" | "platform";

function getCtaLabel(status: ClaimStatus | undefined): string {
  if (!status || status === "none" || status === "platform") return COPY.cta.none;
  if (status === "verified") return COPY.cta.verified;
  if (status === "limited") return COPY.cta.limited;
  if (status === "pending") return COPY.cta.pending;
  return COPY.cta.rejected;
}

function getCtaHref(status: ClaimStatus | undefined): string {
  if (!status || status === "none" || status === "platform") return COPY.ctaHref.none;
  if (status === "verified") return COPY.ctaHref.verified;
  if (status === "limited") return COPY.ctaHref.limited;
  if (status === "pending") return COPY.ctaHref.pending;
  return COPY.ctaHref.rejected;
}

function AdminAccessCardSkeleton() {
  return (
    <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-sky-50 p-4 shadow-sm sm:p-5" aria-busy="true">
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-2">
          <div className="h-7 w-36 rounded-full bg-slate-200/70" />
          <div className="h-7 w-28 rounded-full bg-slate-200/50" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-4/5 rounded-xl bg-slate-200/70" />
          <div className="h-4 w-full rounded-lg bg-slate-200/50" />
          <div className="h-4 w-2/3 rounded-lg bg-slate-200/50" />
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4 space-y-3">
          <div className="h-4 w-32 rounded-lg bg-slate-200/60" />
          <div className="h-7 w-64 rounded-xl bg-slate-200/70" />
          <div className="h-4 w-full rounded-lg bg-slate-200/50" />
          <div className="flex gap-2 pt-1">
            <div className="h-7 w-32 rounded-full bg-slate-200/50" />
            <div className="h-7 w-28 rounded-full bg-slate-200/50" />
          </div>
        </div>
        <div className="h-12 w-full rounded-xl bg-indigo-200/70" />
        <div className="h-12 w-full rounded-xl bg-slate-200/50" />
      </div>
    </section>
  );
}

export default function ProfileAdminAccessEntryCard({
  user,
  initialProfileData,
}: {
  user: Pick<AuthUser, "id" | "nama" | "username" | "email" | "role">;
  initialProfileData: AdminClaimProfileSummaryData;
}) {
  const { data, loading, loadError, isDemoAccount } = useAdminClaimProfile({
    requiredDetail: "summary",
    initialData: initialProfileData,
  });

  if (loading) return <AdminAccessCardSkeleton />;

  const currentState = data?.currentState;
  const currentTone = currentState ? getCurrentStatusTone(currentState.status) : null;
  const ctaStatus = currentState?.status as ClaimStatus | undefined;
  const ctaLabel = getCtaLabel(ctaStatus);
  const ctaHref = getCtaHref(ctaStatus);

  return (
    <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-sky-50 p-4 shadow-sm sm:p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">
            <ShieldCheck size={13} /> {COPY.eyebrow}
          </div>
          <DataStatusBadge status={getCurrentDataStatus(data)} size="xs" />
        </div>
        <div className="max-w-xl">
          <h2 className="text-[22px] font-black leading-tight tracking-tight text-slate-950 sm:text-2xl">{COPY.heading}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-sm">{COPY.subheading}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 p-4 sm:p-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status saat ini</p>
            {currentState ? <ClaimStatusBadge status={currentState.status} compact /> : null}
          </div>
          {loadError || !currentState ? (
            <p className="text-sm text-slate-500">Status belum bisa dimuat sekarang. Kamu tetap bisa lanjut klaim atau hubungi admin.</p>
          ) : (
            <>
              <p className="text-[18px] font-black leading-tight text-slate-900 sm:text-lg">{currentTone?.title}</p>
              <p className="text-sm leading-relaxed text-slate-500 sm:text-xs">{currentTone?.note}</p>
            </>
          )}
        </div>
        {currentState ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{currentState.desaName}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{currentState.roleLabel}</span>
            {isDemoAccount ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">Data contoh</span> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={ctaHref} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
          {ctaLabel}<ArrowRight size={14} />
        </Link>
        <Link href="/hubungi-admin?source=%2Fprofil%2Fsaya" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
          <LifeBuoy size={14} />{COPY.contactAdmin}
        </Link>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{user.role === "DESA" ? COPY.roleNote.desa : COPY.roleNote.other}</p>
    </section>
  );
}
