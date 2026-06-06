"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Mail,
  MoreVertical,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { DesaAdminRoster, DesaAdminRow } from "@/lib/data/desa-admins";
import { ToastContainer, useToast, type ToastType } from "@/components/ui/Toast";
import { inviteAdminDesa, revokeAdminDesaMember } from "./api";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";
import {
  canRevokeAdminDesaMember,
  isAdminDesaInviteLimitReached,
} from "@/lib/admin-desa/policy";

const COPY = BACK_OFFICE_COPY.adminDesa.listAdmin;
const COMMON_COPY = BACK_OFFICE_COPY.adminDesa.common;

interface Props {
  currentUserId: string;
  desaId: string;
  desaName: string;
  canManage: boolean;
  roster: DesaAdminRoster;
  maxAdmins: number;
}

function StatusPill({ status }: { status: DesaAdminRow["status"] }) {
  const map: Record<DesaAdminRow["status"], { label: string; cls: string }> = {
    VERIFIED: { label: COPY.roleStatus.VERIFIED, cls: "pill-ok" },
    LIMITED: { label: COPY.roleStatus.LIMITED, cls: "pill-warn" },
    REVOKED: { label: COPY.roleStatus.REVOKED, cls: "pill-danger" },
    EXPIRED: { label: COPY.roleStatus.EXPIRED, cls: "pill-info" },
  };
  const m = map[status];
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${m.cls}`}>{m.label}</span>;
}

function AdminRow({ row, canManage, isSelf, onRevoke }: { row: DesaAdminRow; canManage: boolean; isSelf: boolean; onRevoke: (row: DesaAdminRow) => void }) {
  const displayName = row.user.nama ?? row.user.username ?? row.user.email;
  const isVerified = row.status === "VERIFIED";
  const canRevokeThis = canRevokeAdminDesaMember({
    canManage,
    targetStatus: row.status,
    isSelf,
  });

  return (
    <div className="flex items-start gap-4 rounded-[1.3rem] bg-white/72 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
      <span className="relative shrink-0 w-12 h-12">
        <span className="absolute inset-0 rounded-full overflow-hidden bg-slate-100 ring-1 ring-black/5 border border-white z-0">
          {row.user.avatarUrl ? <Image src={row.user.avatarUrl} alt={displayName} width={48} height={48} className="w-full h-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">{displayName.slice(0, 2).toUpperCase()}</span>}
        </span>
        {(isVerified || row.status === "LIMITED") && <span className={`absolute -bottom-0.5 -right-0.5 z-10 w-[20px] h-[20px] rounded-full ${isVerified ? "bg-emerald-500" : "bg-amber-500"} flex items-center justify-center border-2 border-white shadow-[0_6px_14px_rgba(15,23,42,0.2)] ring-1 ring-black/5`}>{isVerified ? <ShieldCheck size={10} className="text-white" /> : <BadgeCheck size={10} className="text-white" />}</span>}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900 truncate">{displayName}</p><StatusPill status={row.status} />{isSelf && <span className="text-[10px] text-slate-500 px-2 py-1 bg-slate-100 rounded-full">{COMMON_COPY.you}</span>}</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Mail size={12} aria-hidden /> {row.user.email}</span>{row.acceptedAt && <span>Bergabung {new Date(row.acceptedAt).toLocaleDateString("id-ID")}</span>}</div>
        {row.revokedAt && row.revokedReason && <p className="text-xs text-slate-500 leading-relaxed">{COPY.historySection.revokedWithReason(new Date(row.revokedAt).toLocaleDateString("id-ID"), row.revokedReason)}</p>}
      </div>
      {canRevokeThis && <button type="button" onClick={() => onRevoke(row)} className="btn-lux btn-lux-secondary !min-h-[40px] !w-[40px] !p-0 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2" aria-label={COPY.actions.revokeAriaLabel(displayName)}><MoreVertical size={16} aria-hidden /></button>}
    </div>
  );
}

function ModalFrame({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="lux-panel max-w-md w-full p-5 sm:p-6 space-y-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow text-[10px]">{COPY.modal.eyebrow}</p><h2 className="text-[20px] font-semibold text-slate-900 mt-1">{title}</h2><p className="text-sm text-slate-500 mt-1 leading-relaxed">{subtitle}</p></div><button onClick={onClose} className="btn-lux btn-lux-secondary !min-h-[40px] !w-[40px] !p-0" aria-label={COMMON_COPY.close}><X size={18} aria-hidden /></button></div>{children}</div></div>;
}

function InviteModal({ desaId, desaName, onClose, onDone, onNotify }: { desaId: string; desaName: string; onClose: () => void; onDone: () => void; onNotify: (message: string, type?: ToastType) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { onNotify(COPY.modal.emailRequired, "error"); return; }
    setLoading(true);
    try {
      await inviteAdminDesa({ desaId, email: email.trim() });
      onNotify(COPY.modal.inviteSuccess, "success"); setEmail(""); setTimeout(() => onDone(), 250);
    } catch (error) { onNotify(error instanceof Error ? error.message : COMMON_COPY.connectionError, "error"); } finally { setLoading(false); }
  }
  return <ModalFrame title={COPY.modal.inviteTitle} subtitle={COPY.modal.inviteSubtitle(desaName)} onClose={onClose}><div className="notice-card notice-warn text-sm leading-relaxed">{COPY.modal.inviteNotice}</div><form onSubmit={handleSubmit} className="space-y-4"><div><label className="field-label">{COPY.modal.inviteEmailLabel}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={COPY.modal.inviteEmailPlaceholder} className="field-lux" required autoFocus /><p className="text-xs text-slate-500 mt-2 leading-relaxed">{COPY.modal.inviteHelper}</p></div><div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-lux btn-lux-secondary flex-1">{COMMON_COPY.cancel}</button><button type="submit" disabled={loading} className="btn-lux btn-lux-primary flex-1">{loading ? COPY.modal.sendingInvite : COPY.modal.sendInvite}</button></div></form></ModalFrame>;
}

function RevokeModal({ member, onClose, onDone, onNotify }: { member: DesaAdminRow; onClose: () => void; onDone: () => void; onNotify: (message: string, type?: ToastType) => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const displayName = member.user.nama ?? member.user.username ?? member.user.email;
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await revokeAdminDesaMember(member.id, { reason: reason.trim() || undefined });
      onNotify(COPY.modal.revokeSuccess, "success"); onDone();
    } catch (error) { onNotify(error instanceof Error ? error.message : COMMON_COPY.connectionError, "error"); } finally { setLoading(false); }
  }
  return <ModalFrame title={COPY.modal.revokeTitle} subtitle={displayName} onClose={onClose}><div className="notice-card notice-danger text-sm leading-relaxed">{COPY.modal.revokeNotice}</div><form onSubmit={handleSubmit} className="space-y-4"><div><label className="field-label">{COPY.modal.revokeReasonLabel}</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder={COPY.modal.revokeReasonPlaceholder} className="textarea-lux" /></div><div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-lux btn-lux-secondary flex-1">{COMMON_COPY.cancel}</button><button type="submit" disabled={loading} className="btn-lux btn-lux-danger flex-1">{loading ? COPY.modal.revokeLoading : COPY.modal.revokeButton}</button></div></form></ModalFrame>;
}

export default function AdminDesaListAdminClient({ currentUserId, desaId, desaName, canManage, roster, maxAdmins }: Props) {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<DesaAdminRow | null>(null);
  const [nowMs] = useState(() => Date.now());
  const totalActive = roster.verifiedCount + roster.limitedCount;
  const inviteLimitReached = isAdminDesaInviteLimitReached(totalActive, maxAdmins);
  function refresh() { router.refresh(); }
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-1"><p className="eyebrow text-[10px]">{COPY.headingEyebrow}</p><h1 className="display text-[22px] sm:text-[26px] font-semibold text-slate-900 tracking-tight">{COPY.headingTitle}</h1></div>{canManage && <button type="button" onClick={() => setShowInvite(true)} disabled={inviteLimitReached} className="btn-lux btn-lux-primary w-full sm:w-auto text-sm"><UserPlus size={14} aria-hidden /> {COPY.inviteButton}</button>}</div>
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 text-[10px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:text-[11px]">
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_8px_18px_-16px_rgba(15,23,42,0.35)]">{COPY.summary.active}: <strong className="font-semibold text-slate-900">{totalActive}/{maxAdmins}</strong></span>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_8px_18px_-16px_rgba(15,23,42,0.35)]">{COPY.summary.verified}: <strong className="font-semibold text-slate-900">{roster.verifiedCount}</strong></span>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_8px_18px_-16px_rgba(15,23,42,0.35)]">{COPY.summary.limited}: <strong className="font-semibold text-slate-900">{roster.limitedCount}</strong></span>
        {roster.pendingInvites.length > 0 && <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_8px_18px_-16px_rgba(15,23,42,0.35)]">{COPY.summary.invites}: <strong className="font-semibold text-slate-900">{roster.pendingInvites.length}</strong></span>}
      </div>
      {!canManage && <div className="notice-card notice-info text-sm leading-relaxed">{COPY.notices.onlyMainAdminCanManage}</div>}
      {inviteLimitReached && canManage && <div className="notice-card notice-warn text-sm leading-relaxed">{COPY.notices.inviteLimitReached(maxAdmins)}</div>}
      <section className="lux-panel p-5 sm:p-6 space-y-4"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><Users size={18} aria-hidden /></span><div><p className="eyebrow text-[10px]">{COPY.activeSection.eyebrow}</p><h2 className="text-[18px] font-semibold text-slate-900 mt-1">{COPY.activeSection.title}</h2></div></div>{roster.active.length === 0 ? <div className="lux-card p-10 text-center"><p className="text-sm text-slate-500">{COPY.activeSection.empty}</p></div> : <div className="space-y-3">{roster.active.map((row) => <AdminRow key={row.id} row={row} canManage={canManage} isSelf={row.userId === currentUserId} onRevoke={setRevokeTarget} />)}</div>}</section>
      {canManage && roster.pendingInvites.length > 0 && <section className="lux-card p-5 sm:p-6 space-y-4"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Clock size={18} aria-hidden /></span><div><p className="eyebrow text-[10px]">{COPY.inviteSection.eyebrow}</p><h2 className="text-[18px] font-semibold text-slate-900 mt-1">{COPY.inviteSection.title}</h2></div></div><div className="space-y-3">{roster.pendingInvites.map((inv) => { const expired = new Date(inv.expiresAt).getTime() < nowMs; const created = new Date(inv.createdAt).toLocaleDateString("id-ID"); const expires = new Date(inv.expiresAt).toLocaleDateString("id-ID"); return <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]"><div className="space-y-1"><p className="font-semibold text-slate-900">{inv.email}</p><p className={`text-xs ${expired ? "text-rose-600" : "text-slate-500"}`}>{COPY.inviteSection.sentAt(created)} · {expired ? COPY.inviteSection.expired : COPY.inviteSection.validUntil(expires)}</p></div><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${expired ? "pill-danger" : "pill-warn"}`}>{expired ? COPY.inviteSection.expiredShort : COPY.inviteSection.pending}</span></div>; })}</div></section>}
      {roster.history.length > 0 && <section className="lux-card p-5 sm:p-6 space-y-4"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><AlertTriangle size={18} aria-hidden /></span><div><p className="eyebrow text-[10px]">{COPY.historySection.eyebrow}</p><h2 className="text-[18px] font-semibold text-slate-900 mt-1">{COPY.historySection.title}</h2></div></div><div className="space-y-3">{roster.history.map((row) => <AdminRow key={row.id} row={row} canManage={false} isSelf={row.userId === currentUserId} onRevoke={() => {}} />)}</div></section>}
      {showInvite && <InviteModal desaId={desaId} desaName={desaName} onNotify={toast} onClose={() => setShowInvite(false)} onDone={() => { setShowInvite(false); refresh(); }} />}
      {revokeTarget && <RevokeModal member={revokeTarget} onNotify={toast} onClose={() => setRevokeTarget(null)} onDone={() => { setRevokeTarget(null); refresh(); }} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
