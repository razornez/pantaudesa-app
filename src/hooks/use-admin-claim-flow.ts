"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AdminClaimActiveClaim, AdminClaimProfileData } from "@/lib/data/admin-claim-read";
import type { ContactAdminFormState } from "@/components/support/contact-admin-types";
import {
  checkAdminClaimWebsiteToken,
  contactAdmin,
  generateAdminClaimWebsiteToken,
  inviteAdminDesa,
  sendAdminClaimEmailToken,
  submitAdminClaim,
} from "@/lib/admin-claim/client";
import type { ClaimMethod } from "@/components/profil/admin-claim/adminClaimCopy";

export interface InviteState {
  email: string;
  loading: boolean;
  success: string | null;
  error: string | null;
}

export interface AdminClaimFlowState {
  activeClaim: AdminClaimActiveClaim | null;
  claimId: string | null;
  officialEmail: string;
  setOfficialEmail: (value: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  rawToken: string | null;
  websiteInstruction: string | null;
  feedback: string | null;
  error: string | null;
  busy: boolean;
  invite: InviteState;
  setInvite: Dispatch<SetStateAction<InviteState>>;
  contact: ContactAdminFormState;
  setContact: Dispatch<SetStateAction<ContactAdminFormState>>;
  submitClaimOnly: () => Promise<void>;
  sendEmailToken: () => Promise<void>;
  generateWebsiteToken: () => Promise<void>;
  checkWebsiteToken: () => Promise<void>;
  sendInvite: () => Promise<void>;
  sendContact: () => Promise<void>;
}

export function useAdminClaimFlow({
  profile,
  method,
  selectedDesaId,
  onRefresh,
}: {
  profile: AdminClaimProfileData | null;
  method: ClaimMethod;
  selectedDesaId: string | null;
  onRefresh: () => Promise<void>;
}): AdminClaimFlowState {
  const currentClaim = profile?.currentClaim ?? null;
  const [claimId, setClaimId] = useState<string | null>(currentClaim?.id ?? null);
  const [officialEmail, setOfficialEmail] = useState(currentClaim?.officialEmail ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(currentClaim?.websiteUrl ?? "");
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [websiteInstruction, setWebsiteInstruction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<InviteState>({
    email: "",
    loading: false,
    success: null,
    error: null,
  });
  const [contact, setContact] = useState<ContactAdminFormState>({
    subject: "",
    description: "",
    evidence: "",
    loading: false,
    success: null,
    error: null,
  });

  const activeClaim: AdminClaimActiveClaim | null = useMemo(() => {
    if (profile?.currentClaim) return profile.currentClaim;
    if (!claimId || !selectedDesaId) return null;
    return null;
  }, [claimId, profile?.currentClaim, selectedDesaId]);

  useEffect(() => {
    if (!profile?.currentClaim) return;
    setClaimId(profile.currentClaim.id);
    setOfficialEmail(profile.currentClaim.officialEmail ?? "");
    setWebsiteUrl(profile.currentClaim.websiteUrl ?? "");
  }, [profile?.currentClaim]);

  function resetMessages() {
    setFeedback(null);
    setError(null);
  }

  async function refreshProfile(message?: string) {
    await onRefresh();
    if (message) setFeedback(message);
  }

  async function ensureClaim() {
    if (claimId) return claimId;
    if (!selectedDesaId) throw new Error("Pilih desa terlebih dahulu.");

    const payload = await submitAdminClaim({
      desaId: selectedDesaId,
      method,
      officialEmail: method === "OFFICIAL_EMAIL" ? officialEmail : undefined,
      websiteUrl: method === "WEBSITE_TOKEN" ? websiteUrl : undefined,
    });

    setClaimId(payload.claimId ?? null);
    await refreshProfile("Klaim berhasil dibuat.");
    return payload.claimId!;
  }

  async function submitClaimOnly() {
    setBusy(true);
    resetMessages();
    try {
      await ensureClaim();
      setFeedback("Klaim berhasil dibuat. Lanjutkan verifikasi sesuai metode.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal mengirim klaim.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailToken() {
    setBusy(true);
    resetMessages();
    try {
      const nextClaimId = await ensureClaim();
      await sendAdminClaimEmailToken({ claimId: nextClaimId, officialEmail });
      await refreshProfile("Email verifikasi berhasil dikirim.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Gagal mengirim email verifikasi.");
    } finally {
      setBusy(false);
    }
  }

  async function generateWebsiteToken() {
    setBusy(true);
    resetMessages();
    try {
      const nextClaimId = await ensureClaim();
      const payload = await generateAdminClaimWebsiteToken({ claimId: nextClaimId, websiteUrl });
      setRawToken(payload.rawToken ?? null);
      setWebsiteInstruction(payload.instruction ?? null);
      await refreshProfile("Token website berhasil dibuat. Pasang di website resmi desa lalu cek dari halaman ini.");
    } catch (tokenError) {
      setError(tokenError instanceof Error ? tokenError.message : "Gagal membuat token website.");
    } finally {
      setBusy(false);
    }
  }

  async function checkWebsiteToken() {
    if (!rawToken) {
      setError("Token sesi aktif sudah tidak tersedia. Generate token website lagi.");
      return;
    }

    setBusy(true);
    resetMessages();
    try {
      const nextClaimId = await ensureClaim();
      const payload = await checkAdminClaimWebsiteToken({ claimId: nextClaimId, rawToken });
      if (payload.blocked) {
        setError(`Pengecekan diblokir dengan aman (${payload.reason ?? "unknown"}).`);
      } else if (!payload.found) {
        setError(`Token belum ditemukan (${payload.reason ?? "unknown"}).`);
      } else {
        setRawToken(null);
        await refreshProfile("Token ditemukan. Status klaim sudah diperbarui.");
      }
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Gagal memeriksa token website.");
    } finally {
      setBusy(false);
    }
  }

  async function sendInvite() {
    if (!selectedDesaId) {
      setInvite((state) => ({ ...state, error: "Pilih desa aktif lebih dulu." }));
      return;
    }

    setInvite((state) => ({ ...state, loading: true, error: null, success: null }));
    try {
      await inviteAdminDesa({ desaId: selectedDesaId, email: invite.email });
      await refreshProfile();
      setInvite((state) => ({
        ...state,
        loading: false,
        success: "Undangan admin berhasil dikirim.",
      }));
    } catch (inviteError) {
      setInvite((state) => ({
        ...state,
        loading: false,
        error: inviteError instanceof Error ? inviteError.message : "Gagal mengirim undangan admin.",
      }));
    }
  }

  async function sendContact() {
    setContact((state) => ({ ...state, loading: true, error: null, success: null }));
    try {
      await contactAdmin({
        subject: contact.subject,
        description: contact.description,
        evidence: contact.evidence,
        sourcePage: "/profil/klaim-admin-desa",
      });
      setContact({
        subject: "",
        description: "",
        evidence: "",
        loading: false,
        success: "Pesan berhasil dikirim ke admin PantauDesa.",
        error: null,
      });
    } catch (contactError) {
      setContact((state) => ({
        ...state,
        loading: false,
        error: contactError instanceof Error ? contactError.message : "Gagal mengirim pesan ke admin.",
      }));
    }
  }

  return {
    activeClaim,
    claimId,
    officialEmail,
    setOfficialEmail,
    websiteUrl,
    setWebsiteUrl,
    rawToken,
    websiteInstruction,
    feedback,
    error,
    busy,
    invite,
    setInvite,
    contact,
    setContact,
    submitClaimOnly,
    sendEmailToken,
    generateWebsiteToken,
    checkWebsiteToken,
    sendInvite,
    sendContact,
  };
}
