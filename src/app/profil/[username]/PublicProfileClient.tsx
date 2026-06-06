"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin, Calendar, MessageSquare, ThumbsUp,
  CheckCircle2, Clock, ArrowRight, X, Home, Search,
} from "lucide-react";
import {
  USER_BADGES, type BadgeTier, type UserBadge, type TrustStats,
} from "@/lib/user-profile";
import { VOICE_CATEGORIES, STATUS_CONFIG, relativeTime, type CitizenVoice } from "@/lib/citizen-voice";
import UserAvatar from "@/components/user/UserAvatar";
import { useAuth } from "@/lib/auth-context";

export type PublicProfileUser = {
  nama: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  role: string;
  joinedAt: Date;
};

// ─── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2.5">
      <span className="text-xl">{icon}</span>
      <span className="text-lg font-black text-slate-900">{value}</span>
      <span className="text-[10px] font-medium text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Badge progress bar ────────────────────────────────────────────────────────

function TrustProgress({ score }: { score: number }) {
  const tiers = Object.values(USER_BADGES);
  const current = [...tiers].filter(b => score >= b.minScore).sort((a, b) => b.minScore - a.minScore)[0];
  const next    = tiers.find(b => b.minScore > score);
  const pct     = next
    ? Math.round(((score - current.minScore) / (next.minScore - current.minScore)) * 100)
    : 100;

  return (
    <div className="space-y-2">
      {/* Badge tier icons */}
      <div className="flex items-center gap-1 justify-between">
        {tiers.map(b => (
          <div
            key={b.tier}
            className={`flex flex-col items-center gap-0.5 transition-all ${
              score >= b.minScore ? "opacity-100 scale-110" : "opacity-30"
            }`}
          >
            <span className="text-lg">{b.emoji}</span>
            <span className="text-[8px] font-bold text-slate-500">{b.label.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            current.tier >= 4 ? "bg-violet-500" : current.tier === 3 ? "bg-amber-400" : "bg-indigo-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400">
        <span>Skor: <span className="font-bold text-slate-600">{score}</span></span>
        {next && <span>Butuh <span className="font-bold">{next.minScore - score}</span> lagi → {next.emoji} {next.label}</span>}
        {!next && <span className="text-violet-600 font-bold">Level Tertinggi 🎉</span>}
      </div>
    </div>
  );
}

// ─── Voice card (mini) ────────────────────────────────────────────────────────

function VoiceMiniCard({ voice }: { voice: CitizenVoice }) {
  const cat  = VOICE_CATEGORIES[voice.category];
  const stat = STATUS_CONFIG[voice.status];
  const desa = voice.desaNama;

  return (
    <Link
      href={`/desa/${voice.desaSlug ?? voice.desaId}/suara`}
      className="group block bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all p-4"
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
          {cat.emoji} {cat.label}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stat.bg} ${stat.text} ${stat.border}`}>
          {voice.status === "resolved" ? <CheckCircle2 size={8} /> : <Clock size={8} />}
          {stat.short}
        </span>
        {desa && (
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
            <MapPin size={9} /> {desa}
          </span>
        )}
        <span className="text-[10px] text-slate-400 ml-auto">{relativeTime(voice.createdAt)}</span>
      </div>

      {/* Text */}
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 group-hover:text-slate-900 transition-colors">
        {voice.text}
      </p>

      {/* Footer stats */}
      <div className="flex items-center gap-3 mt-2.5">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          ✅ {voice.votes.benar}
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <ThumbsUp size={10} /> {voice.helpful}
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <MessageSquare size={10} /> {voice.replies.length}
        </span>
        <ArrowRight size={11} className="ml-auto text-slate-300 group-hover:text-indigo-400 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Badge info popup ─────────────────────────────────────────────────────────

const TIER_BENEFITS: Record<BadgeTier, string[]> = {
  1: ["Bisa menyimpan desa pantauan", "Bisa mengikuti perkembangan desa"],
  2: ["Label reputasi tampil di kontribusi", "Bisa mengikuti lebih banyak desa"],
  3: ["Badge tampil di profil publik", "Bisa mengusulkan pembaruan data"],
  4: ["Kontribusi lebih dipercaya komunitas", "Bisa membantu memberi sinyal kualitas laporan"],
  5: ["Masuk daftar apresiasi komunitas", "Bisa menjadi trusted contributor awal"],
};

function BadgeInfoPopup({ badge, score, onClose }: { badge: UserBadge; score: number; onClose: () => void }) {
  const tiers = Object.values(USER_BADGES);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`${badge.color} px-6 pt-6 pb-5`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-4xl">{badge.emoji}</span>
              <h2 className={`text-lg font-black mt-2 ${badge.textColor}`}>{badge.label}</h2>
              <p className={`text-xs mt-0.5 ${badge.textColor} opacity-70`}>{badge.description}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-2xl hover:bg-black/10 transition-colors -mr-1">
              <X size={16} className={badge.textColor} />
            </button>
          </div>
          <div className={`mt-3 text-sm font-black ${badge.textColor}`}>{score} poin kepercayaan</div>
        </div>

        {/* Benefits */}
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Keistimewaan level ini</p>
          <ul className="space-y-2">
            {TIER_BENEFITS[badge.tier as BadgeTier].map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Tier progression */}
        <div className="px-6 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Semua tingkatan</p>
          <div className="space-y-2">
            {tiers.map(b => (
              <div key={b.tier} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                b.tier === badge.tier ? `${b.color} ring-2 ring-offset-1 ring-current ${b.textColor}` : "bg-slate-50"
              }`}>
                <span className="text-lg">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${b.tier === badge.tier ? b.textColor : "text-slate-600"}`}>{b.label}</p>
                  <p className="text-[10px] text-slate-400">{b.minScore}+ poin</p>
                </div>
                {b.tier === badge.tier && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white/70 ${b.textColor}`}>Kamu</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PublicProfileClient({
  username,
  profileUser,
  voices,
  stats,
}: {
  username: string;
  profileUser: PublicProfileUser | null;
  voices: CitizenVoice[];
  stats: TrustStats | null;
}) {
  const { user } = useAuth();
  const [badgeOpen, setBadgeOpen] = useState(false);

  const isOwn = user?.username === username;

  if (!profileUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          {/* Illustration */}
          <div className="relative mx-auto w-28 h-28">
            <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-5xl">🙈</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-rose-100 border-4 border-white flex items-center justify-center">
              <Search size={14} className="text-rose-500" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Profil tidak ditemukan</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Pengguna <span className="font-semibold text-slate-700">@{username}</span> tidak ada,
              belum terdaftar, atau akunnya sudah dihapus.
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-200"
            >
              <Home size={15} /> Kembali ke Beranda
            </Link>
            <Link
              href="/daftar"
              className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-all"
            >
              Daftar akun baru
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    );
  }

  const joinDate = profileUser.joinedAt.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const isWarga = profileUser.role === "WARGA";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

      {badgeOpen && stats && (
        <BadgeInfoPopup badge={stats.badge} score={stats.trustScore} onClose={() => setBadgeOpen(false)} />
      )}

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Cover — gradient berdasarkan badge tier */}
        <div className={`h-24 ${
          stats?.badge.tier === 5 ? "bg-gradient-to-r from-violet-500 to-purple-600" :
          stats?.badge.tier === 4 ? "bg-gradient-to-r from-indigo-500 to-indigo-600" :
          stats?.badge.tier === 3 ? "bg-gradient-to-r from-amber-400 to-orange-500" :
          stats?.badge.tier === 2 ? "bg-gradient-to-r from-sky-400 to-sky-500" :
          "bg-gradient-to-r from-slate-300 to-slate-400"
        }`} />

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="relative">
              <div className="ring-4 ring-white rounded-full">
                <UserAvatar nama={profileUser.nama} avatarUrl={profileUser.avatarUrl} size="xl" />
              </div>
              {stats && isWarga && (
                <button
                  onClick={() => setBadgeOpen(true)}
                  title={`${stats.badge.label} — klik untuk detail`}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center text-base shadow-md hover:scale-110 transition-transform"
                >
                  {stats.badge.emoji}
                </button>
              )}
            </div>
            {isOwn && (
              <Link
                href="/profil/saya"
                className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                Edit Profil
              </Link>
            )}
          </div>

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-slate-900">{profileUser.nama}</h1>
              <p className="text-sm text-slate-400 font-medium">@{profileUser.username}</p>
            </div>
          </div>

          {profileUser.bio && (
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{profileUser.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} /> Bergabung {joinDate}
            </span>
            {isWarga && (
              <span className="flex items-center gap-1">
                <MessageSquare size={11} /> {voices.length} suara
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Trust stats ───────────────────────────────────────────────────── */}
      {stats && isWarga && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Stat pills */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
            <StatPill label="Suara" value={stats.totalSuara}     icon="📢" />
            <StatPill label="Terbukti Benar" value={stats.totalVoteBenar} icon="✅" />
            <StatPill label="Berguna" value={stats.totalHelpful} icon="👍" />
            <StatPill label="Diselesaikan" value={stats.resolvedCount} icon="🎉" />
          </div>

          {/* Badge progress */}
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-slate-600 mb-3">Perjalanan Kepercayaan</p>
            <TrustProgress score={stats.trustScore} />
          </div>
        </div>
      )}

      {/* ── Voice history ─────────────────────────────────────────────────── */}
      {voices.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700 px-1">Riwayat Suara ({voices.length})</p>
          {voices.map(v => <VoiceMiniCard key={v.id} voice={v} />)}
        </div>
      )}

      {voices.length === 0 && isWarga && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-3xl mb-3">🤫</p>
          <p className="text-sm font-semibold text-slate-600">Belum ada suara yang dibagikan.</p>
          {isOwn && (
            <Link href="/suara" className="mt-3 inline-block text-xs text-indigo-600 font-semibold hover:underline">
              Mulai bersuara →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
