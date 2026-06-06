"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ThumbsUp, MessageCircle, ChevronDown, ChevronUp,
  Shield, Send, CheckCircle2, Clock, AlertCircle, ImageIcon,
} from "lucide-react";
import {
  CitizenVoice, VoiceReply,
  VOICE_CATEGORIES, STATUS_CONFIG, TRUST_TIER_CONFIG,
  getAvatarBg, getInitial, relativeTime,
} from "@/lib/citizen-voice";
import { submitReply } from "@/lib/voices-api";
import { useAuth } from "@/lib/auth-context";

function ReplyBubble({ reply }: { reply: VoiceReply }) {
  const isOfficial = reply.isOfficialDesa;
  return (
    <div className={`flex items-start gap-2.5 ${isOfficial ? "pl-0" : "pl-4"}`}>
      {isOfficial ? (
        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Shield size={13} className="text-white" />
        </div>
      ) : (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${getAvatarBg(reply.author)}`}>
          {getInitial(reply.author)}
        </div>
      )}

      <div className={`flex-1 min-w-0 rounded-xl px-3 py-2 text-sm ${isOfficial ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-100"}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${isOfficial ? "text-emerald-700" : "text-slate-700"}`}>{reply.author}</span>
          {isOfficial && <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">Resmi Desa</span>}
          <span className="text-[10px] text-slate-400 ml-auto">{relativeTime(reply.createdAt)}</span>
        </div>
        <p className={`text-xs leading-relaxed ${isOfficial ? "text-emerald-800" : "text-slate-600"}`}>{reply.text}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CitizenVoice["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = status === "resolved" ? CheckCircle2 : status === "in_progress" ? Clock : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon size={9} /> {cfg.short}
    </span>
  );
}

function AdminVoiceBadge({ status }: { status?: "VERIFIED" | "LIMITED" }) {
  if (!status) return null;
  const isVerified = status === "VERIFIED";
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isVerified ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
      <Shield size={8} aria-hidden /> {isVerified ? "Admin Desa Verified" : "Admin Desa Limited"}
    </span>
  );
}

function PhotoGrid({ photos }: { photos: string[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className={`grid gap-1.5 mt-2 mb-3 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {photos.slice(0, 4).map((src, i) => (
          <button key={src} onClick={() => setExpanded(src)} className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video group">
            <Image src={src} alt={`Bukti foto ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            {i === 3 && photos.length > 4 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-sm">+{photos.length - 4}</span></div>}
            <div className="absolute top-1.5 left-1.5 bg-black/40 rounded px-1.5 py-0.5 flex items-center gap-1"><ImageIcon size={9} className="text-white" /><span className="text-[9px] text-white font-semibold">Bukti Foto</span></div>
          </button>
        ))}
      </div>
      {expanded && (
        <button className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setExpanded(null)}>
          <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden">
            <Image src={expanded} alt="Foto bukti" fill className="object-contain" />
          </div>
        </button>
      )}
    </>
  );
}

interface Props {
  voice: CitizenVoice;
  onHelpful: (id: string) => void;
  helpedIds: Set<string>;
  onVote?: (id: string, type: "BENAR" | "BOHONG") => void;
  votedType?: "BENAR" | "BOHONG";
}

export default function VoiceCard({ voice, onHelpful, helpedIds, onVote, votedType }: Props) {
  const cfg = VOICE_CATEGORIES[voice.category];
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [localReplies, setLocalReplies] = useState<VoiceReply[]>(voice.replies);
  const [replySaving, setReplySaving] = useState(false);
  const [replyError, setReplyError] = useState("");

  const officialReply = localReplies.find(r => r.isOfficialDesa);
  const isHelpful = helpedIds.has(voice.id);
  const handleBenar = () => onVote?.(voice.id, "BENAR");
  const handleBohong = () => onVote?.(voice.id, "BOHONG");

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || replySaving) return;
    setReplySaving(true);
    setReplyError("");
    try {
      const savedReply = await submitReply(voice.id, { text, isAnon: !user });
      setLocalReplies(prev => [...prev, savedReply]);
      setReplyText("");
      setShowReplyForm(false);
      setShowReplies(true);
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Komentar belum bisa dikirim.");
    } finally {
      setReplySaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarBg(voice.author)}`}>{getInitial(voice.author)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-sm font-semibold text-slate-800">{voice.author}</span>
            {voice.authorIsAdminDesa && !voice.isAnon && <AdminVoiceBadge status={voice.authorAdminDesaStatus} />}
            {voice.authorTrustTier && !voice.isAnon && (() => { const tier = TRUST_TIER_CONFIG[voice.authorTrustTier]; return <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${tier.color}`}>{tier.emoji} {tier.label}</span>; })()}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
            <StatusBadge status={voice.status} />
            <span className="text-[10px] text-slate-400 ml-auto">{relativeTime(voice.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-2">{voice.text}</p>
          <PhotoGrid photos={voice.photos} />
          {officialReply && !showReplies && <button onClick={() => setShowReplies(true)} aria-label="Lihat respons resmi dari desa" className="w-full text-left flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 mb-3 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"><Shield size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" /><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Respons Resmi Desa</p><p className="text-xs text-emerald-800 leading-relaxed line-clamp-2">{officialReply.text}</p></div></button>}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <button onClick={() => onHelpful(voice.id)} disabled={isHelpful} aria-label={`Tandai berguna, ${voice.helpful} sudah menandai`} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-all min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${isHelpful ? "bg-indigo-50 border-indigo-200 text-indigo-600 cursor-default" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"}`}><ThumbsUp size={12} aria-hidden /><span>{voice.helpful} berguna</span></button>
            <button onClick={handleBenar} disabled={!!votedType} aria-label={`Tandai cerita ini benar, ${voice.votes.benar} suara`} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-all min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${votedType === "BENAR" ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default" : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"}`}>✅ <span className="font-semibold">{voice.votes.benar}</span></button>
            <button onClick={handleBohong} disabled={!!votedType} aria-label={`Tandai cerita ini tidak akurat, ${voice.votes.bohong} suara`} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-all min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 ${votedType === "BOHONG" ? "bg-rose-50 border-rose-300 text-rose-700 cursor-default" : "bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"}`}>❌ <span className="font-semibold">{voice.votes.bohong}</span></button>
            <button onClick={() => setShowReplies(v => !v)} aria-label={showReplies ? "Sembunyikan komentar" : `Lihat ${localReplies.length > 0 ? localReplies.length + " " : ""}komentar`} aria-expanded={showReplies} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all ml-auto min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"><MessageCircle size={12} />{localReplies.length > 0 ? `${localReplies.length}` : ""}{showReplies ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</button>
          </div>
          {showReplies && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{localReplies.map(r => <ReplyBubble key={r.id} reply={r} />)}{!showReplyForm ? <button onClick={() => setShowReplyForm(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 mt-2 transition-colors"><MessageCircle size={12} /> Tambah komentar</button> : <form onSubmit={handleReplySubmit} className="mt-2 space-y-2"><textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Tulis komentar singkat..." rows={2} maxLength={300} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" /><p className="text-[10px] leading-relaxed text-slate-400">{user ? `Komentar akan tampil dengan nama ${user.nama ?? user.username ?? user.email}.` : "Komentar ditampilkan sebagai anonim jika kamu belum masuk."}</p>{replyError && <p className="text-[10px] font-semibold text-rose-600">{replyError}</p>}<div className="flex gap-2"><button type="submit" disabled={!replyText.trim() || replySaving} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"><Send size={11} /> {replySaving ? "Mengirim..." : "Kirim"}</button><button type="button" onClick={() => { setShowReplyForm(false); setReplyText(""); setReplyError(""); }} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">Batal</button></div></form>}</div>}
        </div>
      </div>
    </div>
  );
}
