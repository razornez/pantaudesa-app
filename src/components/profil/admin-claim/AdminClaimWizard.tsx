"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import AdminClaimDesaPicker from "@/components/profil/admin-claim/AdminClaimDesaPicker";
import AdminClaimInstruction from "@/components/profil/admin-claim/AdminClaimInstruction";
import AdminClaimMethodPicker from "@/components/profil/admin-claim/AdminClaimMethodPicker";
import AdminClaimNotice from "@/components/profil/admin-claim/AdminClaimNotice";
import AdminClaimStatusPanel from "@/components/profil/admin-claim/AdminClaimStatusPanel";
import AdminClaimStepNav from "@/components/profil/admin-claim/AdminClaimStepNav";
import type { AdminClaimPageNotice } from "@/lib/admin-claim/eligibility";
import { getAdminClaimEligibility } from "@/lib/admin-claim/eligibility";
import {
  CLAIM_STEP_LABELS,
  getInitialMethod,
  getSelectedDesa,
  getStepForCurrentFlow,
  type ClaimMethod,
  type ClaimStep,
} from "@/components/profil/admin-claim/adminClaimCopy";
import AdminClaimTimeline from "@/components/profil/admin-claim/AdminClaimTimeline";
import AdminInviteForm from "@/components/profil/admin-claim/AdminInviteForm";
import AdminClaimHelpSection from "@/components/profil/admin-claim/AdminClaimHelpSection";
import { useAdminClaimProfile } from "@/components/profil/admin-claim/useAdminClaimProfile";
import { useAdminClaimFlow } from "@/hooks/use-admin-claim-flow";
import type { AuthUser } from "@/lib/auth-context";
import type { AdminClaimProfileData } from "@/lib/data/admin-claim-read";
import ContactAdminEntryCard from "@/components/support/ContactAdminEntryCard";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";

const COPY = BACK_OFFICE_COPY.user.adminClaim;

export default function AdminClaimWizard({
  user,
  initialNotice,
  initialProfileData,
}: {
  user: Pick<AuthUser, "id" | "nama" | "username" | "email" | "role">;
  initialNotice: AdminClaimPageNotice | null;
  initialProfileData: AdminClaimProfileData;
}) {
  const { data, loading, loadError, defaultDesaId, defaultDesa, isDemoAccount, refresh } = useAdminClaimProfile({
    requiredDetail: "full",
    initialData: initialProfileData,
  });
  const [stepOverride, setStepOverride] = useState<ClaimStep | null>(null);
  const [methodOverride, setMethodOverride] = useState<ClaimMethod | null>(null);
  const [search, setSearch] = useState("");
  const [chosenDesaId, setChosenDesaId] = useState<string | null>(null);
  const step = stepOverride ?? getStepForCurrentFlow(data?.currentClaim ?? null, data?.currentState.status ?? "none");
  const method = methodOverride ?? getInitialMethod(data?.currentClaim ?? null);

  const desaOptions = useMemo(() => data?.desaOptions ?? [], [data?.desaOptions]);
  const selectedDesaId = chosenDesaId ?? defaultDesaId;
  const selectedDesa = useMemo(() => getSelectedDesa(desaOptions, selectedDesaId), [desaOptions, selectedDesaId]);
  const filteredDesa = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return desaOptions;
    return desaOptions.filter((desa) => [desa.nama, desa.kecamatan, desa.kabupaten, desa.provinsi].some((value) => value.toLowerCase().includes(term)));
  }, [desaOptions, search]);
  const eligibility = getAdminClaimEligibility({
    activeClaim: data?.currentClaim
      ? { desaId: data.currentClaim.desaId, desaName: data.currentClaim.desaName, status: data.currentClaim.status, source: "claim" }
      : null,
    activeMember: data?.currentMember
      ? { desaId: data.currentMember.desaId, desaName: data.currentMember.desaName, status: data.currentMember.status, source: "member" }
      : null,
    targetDesaId: selectedDesaId,
  });

  const flow = useAdminClaimFlow({ profile: data ?? null, method, selectedDesaId, onRefresh: refresh });

  const canInvite = data?.currentMember?.status === "VERIFIED" && data.currentMember.role === "VERIFIED_ADMIN";
  const inviteDisabledReason = canInvite ? "" : COPY.inviteDisabledReason;
  const progressSummary = data?.currentMember?.status === "VERIFIED"
    ? COPY.progressSummary.verified
    : data?.currentMember?.status === "LIMITED"
    ? COPY.progressSummary.limited
    : data?.currentClaim
    ? COPY.progressSummary.activeClaim
    : COPY.progressSummary.none;

  return (
    <section className="space-y-5 lg:space-y-6">
      <AdminClaimNotice notice={initialNotice} />

      <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-sky-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            <ShieldCheck size={13} />
            {COPY.badge}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {user.nama || user.username || user.email}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{COPY.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{COPY.body}</p>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <AdminClaimStepNav steps={CLAIM_STEP_LABELS} currentStep={step} onSelect={setStepOverride} />

        <details className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{COPY.progressTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{progressSummary}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {COPY.stepBadge(step)}
            </span>
          </summary>
          <div className="px-3 pb-3">
            <AdminClaimTimeline compact claim={data?.currentClaim ?? null} member={data?.currentMember ?? null} />
          </div>
        </details>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            {step === 1 ? <AdminClaimDesaPicker loading={loading} loadError={loadError} search={search} onSearchChange={setSearch} filteredDesa={filteredDesa} visibleCount={6} selectedDesaId={selectedDesaId} onSelect={setChosenDesaId} selectedDesa={selectedDesa} eligibility={eligibility} onContinue={() => setStepOverride(2)} /> : null}
            {step === 2 ? <AdminClaimMethodPicker selectedDesa={selectedDesa} method={method} onSelectMethod={setMethodOverride} onBack={() => setStepOverride(1)} onContinue={() => setStepOverride(3)} /> : null}
            {step === 3 ? <AdminClaimInstruction method={method} selectedDesa={selectedDesa} currentClaim={data?.currentClaim ?? null} eligibility={eligibility} flow={flow} onBack={() => setStepOverride(2)} onContinue={() => setStepOverride(4)} /> : null}
            {step === 4 ? <AdminClaimStatusPanel currentState={data?.currentState ?? null} currentClaim={data?.currentClaim ?? null} currentMember={data?.currentMember ?? null} showDemoLabel={isDemoAccount} selectedDesaName={selectedDesa?.nama ?? defaultDesa?.nama ?? null} onBack={() => setStepOverride(3)} onRestart={() => setStepOverride(1)} /> : null}
          </div>

          <div className="hidden lg:block lg:self-start">
            <div className="lg:sticky lg:top-6">
              <AdminClaimTimeline compact claim={data?.currentClaim ?? null} member={data?.currentMember ?? null} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminInviteForm canInvite={canInvite} disabledReason={inviteDisabledReason} invite={flow.invite} onEmailChange={(value) => flow.setInvite((state) => ({ ...state, email: value, error: null, success: null }))} onSubmit={flow.sendInvite} />
        <ContactAdminEntryCard />
      </div>

      <AdminClaimHelpSection />
    </section>
  );
}
