"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Megaphone, Sparkles, ChevronDown, ImagePlus, X, RotateCw } from "lucide-react";
import {
  VOICE_CATEGORIES, VoiceCategory, CitizenVoice,
} from "@/lib/citizen-voice";
import { fetchVoices, submitVoice, submitVote, submitHelpful } from "@/lib/voices-api";
import { useAuth } from "@/lib/auth-context";
import VoiceCard from "./VoiceCard";

interface Props {
  desaId: string;
  desaNama: string;
}

const MAX_CHARS = 400;
const MAX_PHOTOS = 3;
const PREVIEW_COUNT = 3;

function charCountColor(n: number): string {
  if (n > MAX_CHARS * 0.9) return "text-rose-500";
  if (n > MAX_CHARS * 0.7) return "text-amber-500";
  return "text-slate-400";
}

function getUserDisplayName(user: ReturnType<typeof useAuth>["user"]): string {
  if (!user) return "Anonim";
  return user.nama ?? user.username ?? user.email ?? "Pengguna";
}

function CategoryPill({
  cat, label, emoji, active, onClick,
}: {
  cat: VoiceCategory; label: string; emoji: string;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? VOICE_CATEGORIES[cat].color + " ring-2 ring-offset-1 ring-current/30 scale-105"
          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      <span>{emoji}</span> {label}
    </button>
  );
}

function PhotoPreview({ urls, onRemove }: { urls: string[]; onRemove: (i: number) => void }) {
  if (urls.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {urls.map((url, i) => (
        <div key={i} className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-200 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-0.5 right-0.5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ width: 18, height: 18 }}
          >
            <X size={10} className="text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SuaraWargaSection({ desaId, desaNama }: Props) {
  const { user } = useAuth();
  const [voices, setVoices] = useState<CitizenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitErr, setSubmitErr] = useState("");

  const [category, setCategory] = useState<VoiceCategory | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [helpedIds, setHelpedIds] = useState<Set<string>>(new Set());
  const [votedIds, setVotedIds] = useState<Map<string, "BENAR" | "BOHONG">>(new Map());
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncViewerState = useCallback((data: CitizenVoice[]) => {
    setHelpedIds(new Set(data.filter((v) => v.viewerHasHelped).map((v) => v.id)));
    setVotedIds(new Map(data.filter((v) => v.viewerVoteType).map((v) => [v.id, v.viewerVoteType as "BENAR" | "BOHONG"])));
  }, []);

  const loadVoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVoices(desaId);
      setVoices(data);
      syncViewerState(data);
    } catch {
      setVoices([]);
      syncViewerState([]);
    } finally {
      setLoading(false);
    }
  }, [desaId, syncViewerState]);

  useEffect(() => {
    const id = setTimeout(() => { void loadVoices(); }, 0);
    return () => clearTimeout(id);
  }, [loadVoices]);

  const displayed = showAll ? voices : voices.slice(0, PREVIEW_COUNT);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - photoUrls.length;
    files.slice(0, remaining).forEach(file => {
      setPhotoUrls(prev => [...prev, URL.createObjectURL(file)]);
    });
    e.target.value = "";
  };

  const removePhoto = (i: number) => {
    setPhotoUrls(prev => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!text.trim() || !category) return;
    setSubmitErr("");
    setSaving(true);
    try {
      const newVoice = await submitVoice({
        desaId,
        category,
        text: text.trim(),
        isAnon: user ? isAnon : (isAnon || !name.trim()),
        photos: photoUrls,
      });
      setVoices(prev => [newVoice, ...prev]);
      if (newVoice.viewerHasHelped) setHelpedIds(prev => new Set(prev).add(newVoice.id));
      if (newVoice.viewerVoteType) setVotedIds(prev => new Map(prev).set(newVoice.id, newVoice.viewerVoteType!));
      setSubmitted(true);
      setText(""); setName(""); setCategory(null); setIsAnon(false); setPhotoUrls([]);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Gagal mengirim cerita. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleHelpful = async (id: string) => {
    if (helpedIds.has(id)) return;
    setHelpedIds(prev => new Set(prev).add(id));
    setVoices(prev => prev.map(v => v.id === id ? { ...v, helpful: v.helpful + 1, viewerHasHelped: true } : v));
    try {
      const { helpful } = await submitHelpful(id);
      setVoices(prev => prev.map(v => v.id === id ? { ...v, helpful, viewerHasHelped: true } : v));
    } catch {
      setHelpedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      setVoices(prev => prev.map(v => v.id === id ? { ...v, helpful: Math.max(0, v.helpful - 1), viewerHasHelped: false } : v));
    }
  };

  const handleVote = async (id: string, type: "BENAR" | "BOHONG") => {
    if (votedIds.has(id)) return;
    setVotedIds(m => new Map(m).set(id, type));
    setVoices(vs => vs.map(v => {
      if (v.id !== id) return v;
      const votes = { ...v.votes };
      votes[type === "BENAR" ? "benar" : "bohong"]++;
      return { ...v, votes, viewerVoteType: type };
    }));
    try {
      const updated = await submitVote(id, type);
      setVoices(vs => vs.map(v => v.id === id ? { ...v, votes: { benar: updated.benar, bohong: updated.bohong }, viewerVoteType: updated.viewerVoteType ?? type } : v));
    } catch {
      setVotedIds(m => { const n = new Map(m); n.delete(id); return n; });
      setVoices(vs => vs.map(v => {
        if (v.id !== id) return v;
        const votes = { ...v.votes };
        votes[type === "BENAR" ? "benar" : "bohong"] = Math.max(0, votes[type === "BENAR" ? "benar" : "bohong"] - 1);
        return { ...v, votes, viewerVoteType: undefined };
      }));
    }
  };

  const canSubmit = text.trim().length >= 10 && !!category && text.length <= MAX_CHARS && !saving;

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 sm:px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone size={16} className="text-indigo-200" />
          <p className="text-xs text-indigo-200 font-semibold uppercase tracking-widest">Suara Warga</p>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
          Kamu yang tahu kebenaran<br className="hidden sm:block" />
          tentang desamu.
        </h2>
        <p className="text-indigo-200 text-xs mt-1.5 leading-relaxed">
          Jalan berlubang? BLT belum cair? Posyandu aktif atau tidak?
          Tulis apa adanya — tidak perlu formal, tidak perlu takut.
        </p>
      </div>

      <div className="bg-indigo-50/50 px-5 sm:px-6 py-5 border-b border-slate-200">
        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Sparkles size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">Terima kasih sudah bersuara! 🙏</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Ceritamu sudah dicatat dan bisa dilihat oleh siapapun yang peduli dengan {desaNama}.
              </p>
            </div>
            <button onClick={() => setSubmitted(false)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 transition-colors">Ceritakan lagi</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitErr && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700">⚠️ {submitErr}</div>}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Tentang apa? <span className="font-normal text-slate-400">(pilih satu)</span></p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(VOICE_CATEGORIES) as [VoiceCategory, typeof VOICE_CATEGORIES[VoiceCategory]][]).map(([cat, { label, emoji }]) => <CategoryPill key={cat} cat={cat} label={label} emoji={emoji} active={category === cat} onClick={() => setCategory(cat)} />)}
              </div>
            </div>
            <div>
              <div className="relative">
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`Ceritakan apa yang kamu lihat atau rasakan di ${desaNama}. Tidak perlu bahasa baku — tulis saja apa adanya.`} rows={4} maxLength={MAX_CHARS + 50} className="w-full px-4 py-3.5 text-sm bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder-slate-400 text-slate-800 leading-relaxed" />
                <span className={`absolute bottom-3 right-3 text-[10px] font-mono transition-colors ${charCountColor(text.length)}`}>{text.length}/{MAX_CHARS}</span>
              </div>
              {text.length > MAX_CHARS && <p className="text-xs text-rose-500 mt-1">Terlalu panjang — maksimal {MAX_CHARS} karakter.</p>}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
              <PhotoPreview urls={photoUrls} onRemove={removePhoto} />
              {photoUrls.length < MAX_PHOTOS && <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 border border-dashed border-slate-300 hover:border-indigo-400 px-3 py-2 rounded-xl transition-colors mt-2"><ImagePlus size={13} />Lampirkan foto bukti<span className="text-slate-400 font-normal">({photoUrls.length}/{MAX_PHOTOS})</span></button>}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {user ? <p className="flex-1 text-xs text-slate-500">Cerita akan tampil atas nama <span className="font-semibold text-slate-700">{isAnon ? "Anonim" : getUserDisplayName(user)}</span>.</p> : <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isAnon} placeholder="Namamu (kosongkan kalau mau anonim)" className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400" />}
              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0 select-none">
                <div onClick={() => setIsAnon(v => !v)} className="relative cursor-pointer flex items-center rounded-full border-2 transition-all" style={{ height: 18, width: 32, backgroundColor: isAnon ? "#4f46e5" : "white", borderColor: isAnon ? "#4f46e5" : "#cbd5e1" }}><div className="absolute w-3 h-3 rounded-full bg-white shadow transition-all" style={{ left: isAnon ? 14 : 2 }} /></div>
                <span className="text-xs text-slate-600 font-medium">Kirim anonim</span>
              </label>
            </div>
            <button type="submit" disabled={!canSubmit} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-900/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">{saving ? <RotateCw size={14} className="animate-spin" /> : <Send size={14} />}{saving ? "Menyimpan..." : "Bagikan Ceritamu"}</button>
            {!canSubmit && text.length > 0 && text.length < 10 && <p className="text-xs text-slate-400">Tulis minimal 10 karakter ya.</p>}
            {!canSubmit && !category && text.length >= 10 && <p className="text-xs text-slate-400">Pilih kategori dulu.</p>}
          </form>
        )}
      </div>

      <div className="bg-white px-5 sm:px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          {loading ? <div className="flex items-center gap-2 text-slate-400"><RotateCw size={14} className="animate-spin" /><span className="text-sm">Memuat cerita warga...</span></div> : <p className="text-sm font-bold text-slate-800">{voices.length > 0 ? `${voices.length} Suara Warga` : "Belum ada cerita"}</p>}
          {!loading && voices.length === 0 && <p className="text-xs text-slate-400">Jadilah yang pertama bersuara untuk desa ini.</p>}
        </div>
        {!loading && voices.length > 0 && <><div className="space-y-3">{displayed.map(v => <VoiceCard key={v.id} voice={v} onHelpful={handleHelpful} helpedIds={helpedIds} onVote={handleVote} votedType={votedIds.get(v.id)} />)}</div>{voices.length > PREVIEW_COUNT && !showAll && <button onClick={() => setShowAll(true)} className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-2.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-all"><ChevronDown size={14} />Lihat {voices.length - PREVIEW_COUNT} cerita lainnya</button>}</>}
      </div>
    </div>
  );
}
