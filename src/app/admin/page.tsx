"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2, XCircle, Clock, FileText, LogOut,
  Eye, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MOCK_UPLOADS, UploadedDoc, DocStatus } from "@/lib/auth-mock";
import { ASSETS } from "@/lib/assets";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DocStatus, { label: string; icon: React.ElementType; bg: string; text: string; border: string; btn: string }> = {
  menunggu_review: { label: "Menunggu Review", icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  btn: "bg-amber-500"  },
  disetujui:       { label: "Disetujui",        icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", btn: "bg-emerald-600"},
  ditolak:         { label: "Ditolak",           icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    btn: "bg-rose-500"   },
};

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ doc, onAction }: {
  doc: UploadedDoc;
  onAction: (id: string, status: DocStatus, note?: string) => void;
}) {
  const [expanded,  setExpanded]  = useState(doc.status === "menunggu_review");
  const [note,      setNote]      = useState(doc.reviewNote ?? "");
  const [acting,    setActing]    = useState(false);
  const cfg = STATUS_CFG[doc.status];
  const Icon = cfg.icon;

  const handle = async (status: DocStatus) => {
    setActing(true);
    await new Promise(r => setTimeout(r, 600));
    onAction(doc.id, status, note);
    setActing(false);
    setExpanded(false);
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      doc.status === "menunggu_review" ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
          <FileText size={17} className={cfg.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-800 truncate">{doc.nama}</p>
            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <Icon size={8} /> {cfg.label}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {doc.desaNama} · {doc.jenis} {doc.tahun} · {doc.fileSize} · {doc.uploadedAt.toLocaleDateString("id-ID")}
          </p>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded review panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/50">
          {/* File preview placeholder */}
          <div className="bg-slate-100 rounded-xl h-24 flex items-center justify-center gap-2">
            <Eye size={16} className="text-slate-400" />
            <p className="text-xs text-slate-500">Preview dokumen — tersedia di produksi</p>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Catatan Review <span className="font-normal text-slate-400">(opsional, dikirim ke desa jika ditolak)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Tuliskan alasan penolakan atau catatan untuk desa..."
              className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>

          {doc.status === "menunggu_review" ? (
            <div className="flex gap-2">
              <button
                onClick={() => handle("disetujui")}
                disabled={acting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={13} /> {acting ? "Memproses..." : "Setujui & Publish"}
              </button>
              <button
                onClick={() => handle("ditolak")}
                disabled={acting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                <XCircle size={13} /> {acting ? "Memproses..." : "Tolak & Kembalikan"}
              </button>
            </div>
          ) : (
            <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              {doc.status === "disetujui" ? "✅ Sudah dipublikasikan ke profil desa." : "❌ Ditolak. Desa sudah diberitahu."}
              {doc.reviewNote && <p className="font-normal opacity-80 mt-0.5">Catatan: {doc.reviewNote}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [docs,   setDocs]   = useState<UploadedDoc[]>(MOCK_UPLOADS);
  const [filter, setFilter] = useState<DocStatus | "semua">("semua");

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleAction = (id: string, status: DocStatus, note?: string) => {
    setDocs(prev => prev.map(d => d.id === id
      ? { ...d, status, reviewNote: note, reviewedAt: new Date() }
      : d
    ));
  };

  const pending  = docs.filter(d => d.status === "menunggu_review").length;
  const approved = docs.filter(d => d.status === "disetujui").length;
  const rejected = docs.filter(d => d.status === "ditolak").length;

  const filtered = filter === "semua" ? docs : docs.filter(d => d.status === filter);
  // Pending dulu, baru yang lain
  const sorted   = [...filtered].sort((a, b) =>
    (a.status === "menunggu_review" ? 0 : 1) - (b.status === "menunggu_review" ? 0 : 1)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-slate-900 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src={ASSETS.logo} alt="PantauDesa" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <p className="text-sm font-bold text-white">Admin Review Panel</p>
            {pending > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {pending} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">← Beranda</Link>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Dokumen",    val: docs.length, icon: "📄", bg: "bg-slate-800 text-white" },
            { label: "Perlu Review",     val: pending,     icon: "⏳", bg: "bg-amber-500 text-white"   },
            { label: "Dipublikasikan",   val: approved,    icon: "✅", bg: "bg-emerald-600 text-white" },
            { label: "Ditolak",          val: rejected,    icon: "❌", bg: "bg-rose-500 text-white"    },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.bg}`}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-black">{s.val}</p>
              <p className="text-xs font-semibold opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          {(["semua", "menunggu_review", "disetujui", "ditolak"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                filter === f
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f === "semua" ? "Semua" : STATUS_CFG[f].label}
              {f !== "semua" && (
                <span className="ml-1.5 opacity-60">
                  {f === "menunggu_review" ? pending : f === "disetujui" ? approved : rejected}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Doc list */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <p className="text-slate-400 text-sm">Tidak ada dokumen dengan filter ini.</p>
            </div>
          ) : (
            sorted.map(d => <ReviewCard key={d.id} doc={d} onAction={handleAction} />)
          )}
        </div>
      </div>
    </div>
  );
}
