"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
} from "lucide-react";
import { ToastContainer, useToast, type ToastType } from "@/components/ui/Toast";
import { approveClaim, rejectClaim } from "./claim-review/api";

type ClaimRow = {
  id: string;
  status: string;
  method: string | null;
  officialEmail: string | null;
  websiteUrl: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  rejectCategory: string | null;
  rejectReason: string | null;
  rejectInstructions: string | null;
  reapplyAllowedAt: string | null;
  fraudCooldownUntil: string | null;
  supportSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  desa: { id: string; nama: string; kecamatan: string; kabupaten: string; websiteUrl: string | null };
  user: { id: string; nama: string | null; username: string | null; email: string };
};

const STATUS_META: Record<string, { label: string; pill: string; note: string }> = {
  PENDING: { label: "Pengajuan dibuat", pill: "pill-warn", note: "Pengaju sudah membuat klaim, tetapi verifikasi lanjutan belum lengkap." },
  IN_REVIEW: { label: "Sedang diperiksa", pill: "pill-info", note: "Bukti sudah masuk dan menunggu keputusan internal admin." },
  REJECTED: { label: "Pengajuan ditolak", pill: "pill-danger", note: "Pengaju perlu membaca alasan dan memperbaiki bukti sebelum lanjut lagi." },
  APPROVED: { label: "Pengajuan disetujui", pill: "pill-ok", note: "Akses admin desa sudah diberikan dan audit tercatat." },
};

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Baru dibuat" },
  { value: "IN_REVIEW", label: "Sedang diperiksa" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "APPROVED", label: "Disetujui" },
] as const;

const REASON_CATEGORIES = [
  { value: "WEBSITE_NOT_OFFICIAL", label: "Website tidak resmi" },
  { value: "WEBSITE_MISMATCH", label: "Website tidak cocok" },
  { value: "TOKEN_NOT_VALID", label: "Token tidak valid" },
  { value: "EMAIL_NOT_CONVINCING", label: "Email tidak meyakinkan" },
  { value: "DOCUMENT_NOT_SUFFICIENT", label: "Dokumen tidak cukup" },
  { value: "SOURCE_CONFLICT", label: "Konflik sumber data" },
  { value: "SUSPICIOUS_ACTIVITY", label: "Aktivitas mencurigakan" },
  { value: "RENEWAL_FAILED", label: "Perpanjangan gagal" },
  { value: "OTHER", label: "Lainnya" },
] as const;

function methodLabel(method: string | null) {
  if (method === "OFFICIAL_EMAIL") return "Email resmi";
  if (method === "WEBSITE_TOKEN") return "Token website resmi";
  return "Belum dipilih";
}

function buildQueueHref(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function RejectModal({ claim, onClose, onDone, onNotify }: { claim: ClaimRow; onClose: () => void; onDone: () => void; onNotify: (message: string, type?: ToastType) => void }) {
  const [reasonCategory, setReasonCategory] = useState("EMAIL_NOT_CONVINCING");
  const [reasonText, setReasonText] = useState("");
  const [fixInstructions, setFixInstructions] = useState("");
  const [isFraud, setIsFraud] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonText.trim() || !fixInstructions.trim()) {
      onNotify("Alasan penolakan dan langkah perbaikan wajib diisi.", "error");
      return;
    }
    setLoading(true);
    try {
      await rejectClaim(claim.id, { reasonCategory, reasonText, fixInstructions, isFraud });
      onNotify("Pengajuan ditolak dan alasan sudah dikirim ke pengguna.", "success");
      onDone();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi beberapa saat.", "error");
    } finally {
      setLoading(false);
    }
  }

  const displayName = claim.user.nama ?? claim.user.username ?? claim.user.email;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center sm:py-8">
        <div className="lux-panel w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-h-[calc(100vh-4rem)] sm:p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="eyebrow text-[10px]">Tolak pengajuan</p>
              <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">{claim.desa.nama}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{displayName} • {claim.user.email}</p>
            </div>

            <div className="notice-card notice-danger text-sm leading-relaxed">
              Keputusan ini akan menahan aktivasi akun admin desa. Pengguna akan melihat alasan penolakan dan langkah yang perlu diperbaiki.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Kategori alasan</label>
                <select value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)} className="select-lux" required>
                  {REASON_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>

              <div>
                <label className="field-label">Alasan yang dilihat pengaju</label>
                <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder="Jelaskan kenapa pengajuan belum bisa diterima." className="textarea-lux" rows={4} required />
              </div>

              <div>
                <label className="field-label">Yang perlu diperbaiki pengaju</label>
                <textarea value={fixInstructions} onChange={(e) => setFixInstructions(e.target.value)} placeholder="Tuliskan bukti atau langkah yang perlu dilengkapi pengguna." className="textarea-lux" rows={4} required />
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)] text-sm cursor-pointer">
                <input type="checkbox" checked={isFraud} onChange={(e) => setIsFraud(e.target.checked)} className="mt-1 accent-[#1E1B4B]" />
                <span className="text-slate-700 leading-relaxed">Tandai sebagai aktivitas mencurigakan bila perlu masa tunggu tambahan sebelum pengajuan berikutnya.</span>
              </label>

              <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-1 sm:backdrop-blur-none">
                <button type="button" onClick={onClose} className="btn-lux btn-lux-secondary flex-1">Batal</button>
                <button type="submit" disabled={loading} className="btn-lux btn-lux-danger flex-1">{loading ? "Menyimpan..." : "Tolak pengajuan"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ claim, onRefresh, onReject, onNotify }: { claim: ClaimRow; onRefresh: () => void; onReject: (claim: ClaimRow) => void; onNotify: (message: string, type?: ToastType) => void }) {
  const [approving, setApproving] = useState(false);
  const displayName = claim.user.nama ?? claim.user.username ?? claim.user.email;
  const status = STATUS_META[claim.status] ?? { label: claim.status, pill: "pill-info", note: "Status belum dikenali." };

  async function handleApprove() {
    setApproving(true);
    try {
      await approveClaim(claim.id);
      onNotify("Pengajuan disetujui dan akun admin desa sudah diperbarui.", "success");
      onRefresh();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi beberapa saat.", "error");
    } finally {
      setApproving(false);
    }
  }

  return (
    <article className="lux-card t-spring lift hover:shadow-lux-hover p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1"><p className="font-semibold text-slate-900 text-[16px] tracking-tight leading-snug">{claim.desa.nama}</p><p className="text-sm text-slate-500">{claim.desa.kecamatan}, {claim.desa.kabupaten}</p></div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shrink-0 ${status.pill}`}><span className={`w-1.5 h-1.5 rounded-full ${claim.status === "APPROVED" ? "bg-emerald-500" : claim.status === "REJECTED" ? "bg-rose-500" : claim.status === "IN_REVIEW" ? "bg-indigo-500" : "bg-amber-500"}`} aria-hidden />{status.label}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 text-sm"><div className="metric-card"><p className="metric-label">Pengaju</p><p className="mt-2 text-slate-900 font-medium">{displayName}</p><p className="metric-note">{claim.user.email}</p></div><div className="metric-card"><p className="metric-label">Jalur verifikasi</p><p className="mt-2 text-slate-900 font-medium">{methodLabel(claim.method)}</p><p className="metric-note">Diperbarui {new Date(claim.updatedAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p></div></div>
      <div className="notice-card notice-info text-sm leading-relaxed"><p className="font-semibold">Ringkasan keputusan</p><p className="mt-2 opacity-90">{status.note}</p></div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">{claim.officialEmail && <span className="inline-flex items-center gap-1"><Mail size={12} aria-hidden /> {claim.officialEmail}</span>}{claim.websiteUrl && <a href={claim.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-700 hover:underline"><ExternalLink size={12} aria-hidden /> Buka website desa</a>}{claim.supportSubmittedAt && <span className="inline-flex items-center gap-1"><BadgeCheck size={12} aria-hidden /> Bukti tambahan masuk {new Date(claim.supportSubmittedAt).toLocaleDateString("id-ID")}</span>}{claim.verifiedAt && <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} aria-hidden /> Disetujui {new Date(claim.verifiedAt).toLocaleDateString("id-ID")}</span>}</div>
      {claim.status === "REJECTED" && <div className="notice-card notice-danger text-sm leading-relaxed"><p className="font-semibold">Alasan yang terlihat oleh pengaju</p>{claim.rejectReason ? <p className="mt-2 opacity-90">{claim.rejectReason}</p> : null}{claim.rejectInstructions ? <><p className="font-semibold mt-3">Langkah perbaikan</p><p className="mt-2 opacity-90">{claim.rejectInstructions}</p></> : null}{claim.reapplyAllowedAt ? <p className="mt-3 text-xs opacity-80">Pengajuan ulang tersedia pada {new Date(claim.reapplyAllowedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}.</p> : null}{claim.fraudCooldownUntil ? <p className="mt-2 text-xs font-semibold">Masa tunggu khusus sampai {new Date(claim.fraudCooldownUntil).toLocaleDateString("id-ID", { dateStyle: "long" })}.</p> : null}</div>}
      {(claim.status === "IN_REVIEW" || claim.status === "PENDING") && <div className="surface-divider pt-4 flex flex-wrap gap-2">{claim.status === "IN_REVIEW" ? <button type="button" onClick={handleApprove} disabled={approving} className="btn-lux btn-lux-success !min-h-[40px] text-xs">{approving ? "Memproses..." : "Setujui jadi admin terverifikasi"}</button> : null}<button type="button" onClick={() => onReject(claim)} className="btn-lux btn-lux-danger !min-h-[40px] text-xs">{claim.status === "PENDING" ? "Tolak dari tahap awal" : "Tolak pengajuan"}</button></div>}
    </article>
  );
}

export default function ClaimReviewQueue({ claims, total, page, pageSize, statusFilter }: { claims: ClaimRow[]; total: number; page: number; pageSize: number; statusFilter: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [rejectTarget, setRejectTarget] = useState<ClaimRow | null>(null);
  const totalPages = Math.ceil(total / pageSize);
  const summary = useMemo(() => claims.reduce((acc, claim) => { acc.total += 1; if (claim.status === "PENDING") acc.pending += 1; if (claim.status === "IN_REVIEW") acc.review += 1; if (claim.status === "REJECTED") acc.rejected += 1; if (claim.status === "APPROVED") acc.approved += 1; return acc; }, { total: 0, pending: 0, review: 0, rejected: 0, approved: 0 }), [claims]);
  function refresh() { router.refresh(); }
  return (
    <div className="space-y-7" data-testid="internal-claims-queue">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-2"><p className="eyebrow text-[10px]">Review pengajuan admin desa</p><h1 className="display text-[30px] sm:text-[34px] font-semibold text-slate-900 tracking-tight leading-tight">Antrean keputusan yang perlu ditangani</h1><p className="text-sm text-slate-500 leading-relaxed max-w-2xl">Periksa bukti pengajuan, putuskan dengan jelas, dan pastikan pengaju memahami langkah berikutnya.</p></div><div className="flex flex-wrap gap-2"><span className="pill-info rounded-full px-3 py-1 text-[11px] font-semibold">{total} total klaim</span>{summary.review > 0 && <span className="pill-warn rounded-full px-3 py-1 text-[11px] font-semibold">{summary.review} sedang diperiksa</span>}{summary.rejected > 0 && <span className="pill-danger rounded-full px-3 py-1 text-[11px] font-semibold">{summary.rejected} ditolak</span>}</div></header>
      <div className="flex flex-wrap gap-2">{STATUS_TABS.map((tab) => <Link key={tab.value} href={buildQueueHref(pathname || "/internal-admin/claims", { status: tab.value, page: "1" })} prefetch={false} className={`btn-lux ${statusFilter === tab.value ? "btn-lux-primary" : "btn-lux-ghost"} !min-h-[40px] text-xs`}>{tab.label}</Link>)}</div>
      {claims.length === 0 ? <div className="lux-card p-10 text-center space-y-3"><Clock3 size={28} className="mx-auto text-slate-300" aria-hidden /><p className="text-sm text-slate-500">Tidak ada pengajuan pada filter ini.</p></div> : <div className="grid gap-4 sm:grid-cols-2">{claims.map((claim) => <ClaimCard key={claim.id} claim={claim} onRefresh={refresh} onReject={setRejectTarget} onNotify={toast} />)}</div>}
      {totalPages > 1 && <div className="flex justify-center gap-2 pt-2">{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <Link key={p} href={buildQueueHref(pathname || "/internal-admin/claims", { status: statusFilter, page: String(p) })} prefetch={false} className={`btn-lux ${p === page ? "btn-lux-primary" : "btn-lux-ghost"} !min-h-[36px] !w-[36px] !px-0 text-xs`}>{p}</Link>)}</div>}
      {rejectTarget && <RejectModal claim={rejectTarget} onNotify={toast} onClose={() => setRejectTarget(null)} onDone={() => { setRejectTarget(null); refresh(); }} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
