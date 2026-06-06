"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart2, Filter, Megaphone, Search, X } from "lucide-react";
import {
  CitizenVoice,
  VOICE_CATEGORIES,
  VoiceCategory,
} from "@/lib/citizen-voice";
import { submitHelpful, submitVote } from "@/lib/voices-api";
import VoiceCard from "@/components/desa/VoiceCard";

function GlobalVoiceCard({
  voice,
  helpedIds,
  onHelpful,
  onVote,
  votedIds,
}: {
  voice: CitizenVoice;
  helpedIds: Set<string>;
  onHelpful: (id: string) => void;
  onVote: (id: string, type: "BENAR" | "BOHONG") => void;
  votedIds: Map<string, "BENAR" | "BOHONG">;
}) {
  return (
    <div className="space-y-1.5">
      <Link
        href={`/desa/${voice.desaSlug ?? voice.desaId}`}
        prefetch={false}
        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-800"
      >
        {voice.desaNama ? `Lihat profil ${voice.desaNama}` : "Lihat profil desa"}
        <ArrowRight size={10} />
      </Link>
      <VoiceCard
        voice={voice}
        onHelpful={onHelpful}
        helpedIds={helpedIds}
        onVote={onVote}
        votedType={votedIds.get(voice.id)}
      />
    </div>
  );
}

export default function SuaraWargaPageClient({
  initialVoices,
}: {
  initialVoices: CitizenVoice[];
}) {
  const [voices, setVoices] = useState<CitizenVoice[]>(initialVoices);
  const [helpedIds, setHelpedIds] = useState<Set<string>>(new Set());
  const [votedIds, setVotedIds] = useState<Map<string, "BENAR" | "BOHONG">>(new Map());

  const [searchDesa, setSearchDesa] = useState("");
  const [filterDesa, setFilterDesa] = useState("");
  const [filterCat, setFilterCat] = useState<VoiceCategory | "">("");
  const [showStats, setShowStats] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const stats = useMemo(() => {
    const resolved = voices.filter((voice) => voice.status === "resolved").length;
    const inProgress = voices.filter((voice) => voice.status === "in_progress").length;
    const open = voices.filter((voice) => voice.status === "open").length;
    const desaCount = new Set(voices.map((voice) => voice.desaId)).size;
    return { total: voices.length, resolved, inProgress, open, desaCount };
  }, [voices]);

  const desaOptions = useMemo(
    () => [...new Set(voices.map((voice) => voice.desaId))]
      .map((id) => {
        const voice = voices.find((item) => item.desaId === id);
        return {
          id,
          slug: voice?.desaSlug ?? id,
          nama: voice?.desaNama ?? "Desa belum tercatat",
          kabupaten: voice?.desaKabupaten ?? "Wilayah belum tercatat",
        };
      })
      .sort((a, b) => a.nama.localeCompare(b.nama)),
    [voices]
  );

  const filtered = useMemo(() => {
    let result = voices;
    if (filterDesa) result = result.filter((voice) => voice.desaId === filterDesa);
    if (filterCat) result = result.filter((voice) => voice.category === filterCat);
    return result;
  }, [voices, filterDesa, filterCat]);

  const handleHelpful = async (id: string) => {
    if (helpedIds.has(id)) return;
    setHelpedIds((prev) => new Set(prev).add(id));
    setVoices((prev) => prev.map((voice) => voice.id === id ? { ...voice, helpful: voice.helpful + 1 } : voice));
    try {
      const { helpful } = await submitHelpful(id);
      setVoices((prev) => prev.map((voice) => voice.id === id ? { ...voice, helpful } : voice));
    } catch {
      // Optimistic update stays; not critical for read-path verification.
    }
  };

  const handleVote = async (id: string, type: "BENAR" | "BOHONG") => {
    if (votedIds.get(id) === type) return;
    const prev = votedIds.get(id);
    setVotedIds((map) => new Map(map).set(id, type));
    setVoices((items) => items.map((voice) => {
      if (voice.id !== id) return voice;
      const votes = { ...voice.votes };
      if (prev) votes[prev === "BENAR" ? "benar" : "bohong"]--;
      votes[type === "BENAR" ? "benar" : "bohong"]++;
      return { ...voice, votes };
    }));

    try {
      const updated = await submitVote(id, type);
      setVoices((items) => items.map((voice) => voice.id === id ? { ...voice, votes: updated } : voice));
    } catch {
      setVotedIds((map) => {
        const next = new Map(map);
        if (prev) next.set(id, prev);
        else next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Megaphone size={12} />
            Langsung dari warga
          </div>
          <h1 className="mb-2 text-2xl font-black leading-tight sm:text-3xl">Suara Warga</h1>
          <p className="mb-4 max-w-lg text-sm text-indigo-100">
            Kumpulan cerita dan pertanyaan warga tentang kondisi desa. Gunakan cerita ini sebagai bahan awal untuk memahami situasi di lapangan.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-2xl font-black">{voices.length}</span>
              <span className="ml-1.5 text-indigo-200">suara</span>
            </div>
            <div className="h-5 w-px bg-white/20" />
            <div>
              <span className="text-2xl font-black">{stats.desaCount}</span>
              <span className="ml-1.5 text-indigo-200">desa</span>
            </div>
            <div className="h-5 w-px bg-white/20" />
            <div>
              <span className="text-2xl font-black">{stats.resolved}</span>
              <span className="ml-1.5 text-indigo-200">sudah selesai</span>
            </div>
            <button
              type="button"
              onClick={() => setShowStats((value) => !value)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <BarChart2 size={12} />
              {showStats ? "Sembunyikan" : "Lihat"} statistik
            </button>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 h-48 w-48 rounded-full bg-white/5" />
      </div>

      {showStats && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm sm:grid-cols-4">
          <div><p className="text-xl font-black text-slate-800">{stats.total}</p><p className="text-xs text-slate-500">suara warga</p></div>
          <div><p className="text-xl font-black text-rose-600">{stats.open}</p><p className="text-xs text-slate-500">belum selesai</p></div>
          <div><p className="text-xl font-black text-amber-600">{stats.inProgress}</p><p className="text-xs text-slate-500">diproses</p></div>
          <div><p className="text-xl font-black text-emerald-600">{stats.resolved}</p><p className="text-xs text-slate-500">selesai</p></div>
        </div>
      )}

      {!showAddForm ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="mb-0.5 text-sm font-bold text-amber-800">Punya cerita tentang desamu?</p>
            <p className="text-xs text-amber-600">Pilih desamu dan ceritakan langsung, tidak perlu formal.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            <Megaphone size={13} />
            Ceritakan Kondisi Desaku
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Pilih desa yang ingin kamu ceritakan:</p>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 transition-colors hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchDesa}
              onChange={(event) => setSearchDesa(event.target.value)}
              placeholder="Cari nama desa..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {desaOptions
              .filter((desa) =>
                desa.nama.toLowerCase().includes(searchDesa.toLowerCase()) ||
                desa.kabupaten.toLowerCase().includes(searchDesa.toLowerCase())
              )
              .map((desa) => (
                <Link
                  key={desa.id}
                  href={`/desa/${desa.slug}/suara`}
                  prefetch={false}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{desa.nama}</p>
                    <p className="text-xs text-slate-400">{desa.kabupaten}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 transition-colors group-hover:text-indigo-500" />
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Tampilkan:</span>
          {(filterDesa || filterCat) && (
            <button
              type="button"
              onClick={() => { setFilterDesa(""); setFilterCat(""); }}
              className="ml-auto flex items-center gap-1 text-xs text-rose-500 transition-colors hover:text-rose-700"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterDesa}
            onChange={(event) => setFilterDesa(event.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Semua Desa</option>
            {desaOptions.map((desa) => (
              <option key={desa.id} value={desa.id}>{desa.nama}</option>
            ))}
          </select>
          {(Object.entries(VOICE_CATEGORIES) as [VoiceCategory, typeof VOICE_CATEGORIES[VoiceCategory]][]).map(
            ([cat, { label, emoji, color }]) => (
              <button
                type="button"
                key={cat}
                onClick={() => setFilterCat((prev) => prev === cat ? "" : cat)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterCat === cat ? color + " ring-2 ring-current/20 ring-offset-1" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {emoji} {label}
              </button>
            )
          )}
        </div>
        <p className="text-xs text-slate-400">
          Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> dari {voices.length} suara
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Megaphone size={18} />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-800">Belum ada suara warga yang bisa ditampilkan.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Jadilah warga pertama yang membagikan kondisi desamu.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            <Megaphone size={13} />
            Ceritakan Kondisi Desaku
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((voice) => (
            <GlobalVoiceCard
              key={voice.id}
              voice={voice}
              helpedIds={helpedIds}
              onHelpful={handleHelpful}
              onVote={handleVote}
              votedIds={votedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
