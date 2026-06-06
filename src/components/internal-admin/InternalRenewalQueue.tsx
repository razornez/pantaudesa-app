"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { ToastContainer, useToast, type ToastType } from "@/components/ui/Toast";
import { approveRenewal, rejectRenewal } from "./renewal-queue/api";

type RenewalRow = {
  id: string;
  userId: string;
  desaId: string;
  status: string;
  renewalDueAt: string | null;
  joinedAt: string;
  renewalState: "OK" | "DUE_SOON" | "URGENT" | "OVERDUE" | "NO_DUE_DATE";
  daysUntilRenewal: number | null;
  desa: { id: string; nama: string; kecamatan: string; kabupaten: string };
  user: { id: string; nama: string | null; username: string | null; email: string };
};

const FILTERS = [
  { value: "ALL", label: "Semua" },
  { value: "DUE_SOON", label: "Segera jatuh tempo" },
  { value: "OVERDUE", label: "Sudah lewat" },
] as const;

const RENEWAL_COPY: Record<RenewalRow["renewalState"], { label: string; pill: string; note: string }> = {
  OK: { label: "Masih aman", pill: "pill-info", note: "Belum butuh tindakan segera." },
  DUE_SOON: { label: "Perlu disiapkan", pill: "pill-warn", note: "Masa aktif mendekati batas perpanjangan." },
  URGENT: { label: "Segera diputuskan", pill: "pill-danger", note: "Sisa waktu sangat mepet dan perlu keputusan cepat." },
  OVERDUE: { label: "Sudah lewat batas", pill: "pill-danger", note: "Akses berisiko berakhir jika tidak diputuskan." },
  NO_DUE_DATE: { label: "Belum terjadwal", pill: "pill-info", note: "Tanggal perpanjangan belum tercatat." },
};

function buildRenewalHref(pathname: string, state: string) {
  if (!state || state === "ALL") return pathname;
  return `${pathname}?state=${encodeURIComponent(state)}`;
}

function DecisionModal({ target, mode, onClose, onDone, onNotify }: { target: RenewalRow; mode: "approve" | "reject"; onClose: () => void; onDone: () => void; onNotify: (message: string, type?: ToastType) => void }) {
  const [reason, setReason] = useState("");
  const [suspicious, setSuspicious] = useState(false);
  const [loading, setLoading] = useState(false);
  const isApprove = mode === "approve";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isApprove && !reason.trim()) { onNotify("Alasan penolakan wajib diisi.", "error"); return; }
    setLoading(true);
    try {
      if (isApprove) {
        await approveRenewal(target.id);
      } else {
        await rejectRenewal(target.id, { reason: reason.trim(), suspicious });
      }
      onNotify(isApprove ? "Masa aktif berhasil diperpanjang." : "Akses ditandai berakhir.", "success");
      onDone();
    } catch (error) { onNotify(error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi.", "error"); }
    finally { setLoading(false); }
  }

  const actorName = target.user.nama ?? target.user.username ?? target.user.email;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="lux-panel max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-1"><p className="eyebrow text-[10px]">{isApprove ? "Setujui perpanjangan" : "Tolak perpanjangan"}</p><h2 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">{target.desa.nama}</h2><p className="text-xs text-slate-500">{actorName} · {target.user.email}</p></div>
        <div className={`notice-card ${isApprove ? "notice-ok" : "notice-danger"} text-xs`}>{isApprove ? "Masa aktif akan diperpanjang 6 bulan." : "Akses admin akan berakhir. Riwayat tetap tersimpan."}</div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isApprove && <><div><label className="field-label text-xs">Alasan</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Jelaskan kenapa ditolak." className="textarea-lux text-sm" required /></div><label className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)] text-xs cursor-pointer"><input type="checkbox" checked={suspicious} onChange={(e) => setSuspicious(e.target.checked)} className="mt-0.5 accent-[#1E1B4B]" /><span className="text-slate-700 leading-relaxed">Perlu pemeriksaan lanjutan bila ada pola mencurigakan.</span></label></>}
          <div className="flex gap-2"><button type="button" onClick={onClose} className="btn-lux btn-lux-secondary flex-1 text-sm">Batal</button><button type="submit" disabled={loading} className={`btn-lux ${isApprove ? "btn-lux-success" : "btn-lux-danger"} flex-1 text-sm`}>{loading ? "Memproses..." : isApprove ? "Setujui" : "Akhiri akses"}</button></div>
        </form>
      </div>
    </div>
  );
}

function RenewalCard({ item, onApprove, onReject }: { item: RenewalRow; onApprove: (target: RenewalRow) => void; onReject: (target: RenewalRow) => void }) {
  const copy = RENEWAL_COPY[item.renewalState];
  const name = item.user.nama ?? item.user.username ?? item.user.email;
  const daysLabel = item.daysUntilRenewal === null ? "—" : item.daysUntilRenewal >= 0 ? `${item.daysUntilRenewal} hari` : `Lewat ${Math.abs(item.daysUntilRenewal)} hari`;

  return (
    <article className="lux-card t-spring p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 text-[14px] sm:text-[15px] tracking-tight leading-snug">{item.desa.nama}</p><p className="text-[11px] sm:text-xs text-slate-500">{item.desa.kecamatan}, {item.desa.kabupaten}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${copy.pill}`}>{copy.label}</span></div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600"><span>{name}</span><span className="text-slate-300">·</span><span>{daysLabel}</span>{item.renewalDueAt && <><span className="text-slate-300">·</span><span>{new Date(item.renewalDueAt).toLocaleDateString("id-ID", { dateStyle: "short" })}</span></>}</div>
      {(item.renewalState === "OVERDUE" || item.renewalState === "URGENT" || item.renewalState === "DUE_SOON") && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => onApprove(item)} className="btn-lux btn-lux-success text-xs"><CheckCircle2 size={11} aria-hidden /> Setujui</button><button type="button" onClick={() => onReject(item)} className="btn-lux btn-lux-danger text-xs"><AlertTriangle size={11} aria-hidden /> Tolak</button></div>}
    </article>
  );
}

export default function InternalRenewalQueue({ members, stateFilter }: { members: RenewalRow[]; stateFilter: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [approveTarget, setApproveTarget] = useState<RenewalRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RenewalRow | null>(null);

  const summary = useMemo(() => members.reduce((acc, item) => { acc.total += 1; if (item.renewalState === "OVERDUE") acc.overdue += 1; if (item.renewalState === "URGENT" || item.renewalState === "DUE_SOON") acc.soon += 1; return acc; }, { total: 0, overdue: 0, soon: 0 }), [members]);
  const refresh = () => router.refresh();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-1"><p className="eyebrow text-[10px]">Perpanjangan admin desa</p><h1 className="display text-[22px] sm:text-[26px] font-semibold text-slate-900 tracking-tight">Masa aktif admin</h1></div><div className="flex flex-wrap gap-1.5"><span className="pill-info rounded-full px-2.5 py-0.5 text-[10px] font-semibold">{summary.total} total</span>{summary.soon > 0 && <span className="pill-warn rounded-full px-2.5 py-0.5 text-[10px] font-semibold">{summary.soon} perlu disiapkan</span>}{summary.overdue > 0 && <span className="pill-danger rounded-full px-2.5 py-0.5 text-[10px] font-semibold">{summary.overdue} lewat batas</span>}</div></div>
      <div className="flex flex-wrap gap-1.5">{FILTERS.map((filter) => <Link key={filter.value} href={buildRenewalHref(pathname || "/internal-admin/renewals", filter.value)} prefetch={false} className={`btn-lux ${stateFilter === filter.value || (filter.value === "ALL" && !stateFilter) ? "btn-lux-primary" : "btn-lux-ghost"} !min-h-[36px] sm:!min-h-[40px] text-[11px] sm:text-xs`}>{filter.label}</Link>)}</div>
      {members.length === 0 ? <div className="lux-card p-8 text-center space-y-2"><CalendarClock size={24} className="mx-auto text-slate-300" aria-hidden /><p className="text-sm font-semibold text-slate-700">Belum ada perpanjangan yang perlu ditinjau</p><p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Halaman ini menampilkan admin desa yang masa aktifnya mendekati batas atau sudah lewat. Jika semua admin masih dalam masa aktif, tidak ada item yang muncul di sini.</p></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{members.map((item) => <RenewalCard key={item.id} item={item} onApprove={setApproveTarget} onReject={setRejectTarget} />)}</div>}
      {approveTarget && <DecisionModal target={approveTarget} mode="approve" onNotify={toast} onClose={() => setApproveTarget(null)} onDone={() => { setApproveTarget(null); refresh(); }} />}
      {rejectTarget && <DecisionModal target={rejectTarget} mode="reject" onNotify={toast} onClose={() => setRejectTarget(null)} onDone={() => { setRejectTarget(null); refresh(); }} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
