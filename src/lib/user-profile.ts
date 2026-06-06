/**
 * user-profile.ts — types, badge system, notifikasi, dan trust score untuk warga.
 * Semua pure functions — tidak ada UI knowledge di sini.
 */

import type { CitizenVoice } from "./citizen-voice";

// ─── Trust badge ──────────────────────────────────────────────────────────────

export type BadgeTier = 1 | 2 | 3 | 4 | 5;

export interface UserBadge {
  tier:        BadgeTier;
  label:       string;
  emoji:       string;
  description: string;
  color:       string;   // Tailwind bg color
  textColor:   string;
  minScore:    number;
}

export const USER_BADGES: Record<BadgeTier, UserBadge> = {
  1: { tier: 1, label: "Warga Peduli",           emoji: "🌱", description: "Mulai ikut memantau dan memahami data desa.",        color: "bg-slate-100",   textColor: "text-slate-600",  minScore: 0   },
  2: { tier: 2, label: "Pemantau Desa",          emoji: "🔎", description: "Aktif mengikuti perkembangan desa dan membaca data.", color: "bg-sky-100",     textColor: "text-sky-700",    minScore: 20  },
  3: { tier: 3, label: "Kontributor Warga",      emoji: "🤝", description: "Mulai memberi kontribusi yang membantu komunitas.",  color: "bg-amber-100",   textColor: "text-amber-700",  minScore: 60  },
  4: { tier: 4, label: "Penjaga Transparansi",   emoji: "🛡️", description: "Konsisten menjaga transparansi dengan cara sehat.",  color: "bg-indigo-100", textColor: "text-indigo-700", minScore: 120 },
  5: { tier: 5, label: "Penggerak Desa Terbuka", emoji: "🏅", description: "Kontributor berdampak yang dipercaya komunitas.",    color: "bg-violet-100", textColor: "text-violet-700", minScore: 250 },
};

// ─── Trust score ──────────────────────────────────────────────────────────────

export interface TrustStats {
  totalSuara:    number;
  totalVoteBenar:number;
  totalHelpful:  number;
  totalReplies:  number;
  resolvedCount: number;
  trustScore:    number;   // computed
  badge:         UserBadge;
}

export function computeTrustStatsFromVoices(voices: CitizenVoice[]): TrustStats {
  const totalSuara     = voices.length;
  const totalVoteBenar = voices.reduce((s, v) => s + v.votes.benar, 0);
  const totalHelpful   = voices.reduce((s, v) => s + v.helpful, 0);
  const totalReplies   = voices.reduce((s, v) => s + v.replies.filter(r => !r.isOfficialDesa).length, 0);
  const resolvedCount  = voices.filter(v => v.status === "resolved").length;

  const trustScore = Math.round(
    totalSuara     * 5  +
    totalVoteBenar * 3  +
    totalHelpful   * 2  +
    totalReplies   * 1  +
    resolvedCount  * 10
  );

  const tier = (Object.values(USER_BADGES) as UserBadge[])
    .filter(b => trustScore >= b.minScore)
    .sort((a, b) => b.minScore - a.minScore)[0].tier as BadgeTier;

  return { totalSuara, totalVoteBenar, totalHelpful, totalReplies, resolvedCount, trustScore, badge: USER_BADGES[tier] };
}

// ─── Notifikasi ───────────────────────────────────────────────────────────────

export type NotifType = "reply" | "vote_benar" | "vote_bohong" | "resolved" | "helpful";

export interface UserNotification {
  id:        string;
  type:      NotifType;
  voiceId:   string;
  voiceText: string;   // cuplikan teks suara yang bersangkutan
  fromName:  string;   // siapa yang memicu (anonim → "Seseorang")
  isOfficial:boolean;  // true = dari perangkat desa
  message:   string;   // deskripsi notifikasi
  createdAt: Date;
  isRead:    boolean;
}

const NOTIF_CONFIG: Record<NotifType, { icon: string; color: string; label: string }> = {
  reply:       { icon: "💬", color: "bg-indigo-50 border-indigo-100", label: "Komentar baru"    },
  vote_benar:  { icon: "✅", color: "bg-emerald-50 border-emerald-100", label: "Ditandai Benar" },
  vote_bohong: { icon: "❌", color: "bg-rose-50 border-rose-100",      label: "Ditandai Bohong" },
  resolved:    { icon: "🎉", color: "bg-amber-50 border-amber-100",    label: "Masalah Selesai" },
  helpful:     { icon: "👍", color: "bg-sky-50 border-sky-100",        label: "Berguna bagi warga" },
};

export { NOTIF_CONFIG };

// ─── Notifications (derived from the user's real DB voices) ───────────────────
// No persistent notification table exists, so we surface an activity feed built
// from real signals on the user's voices: replies received, resolved status, and
// "Benar" votes. isRead is ephemeral (toggled client-side in the session).

export function deriveNotifications(voices: CitizenVoice[], selfName: string): UserNotification[] {
  const snippet = (text: string) => (text.length > 64 ? `${text.slice(0, 61)}...` : text);
  const notifs: UserNotification[] = [];

  for (const voice of voices) {
    const text = snippet(voice.text);

    for (const reply of voice.replies) {
      if (!reply.isOfficialDesa && reply.author === selfName) continue; // skip own replies
      notifs.push({
        id: `nr-${reply.id}`,
        type: "reply",
        voiceId: voice.id,
        voiceText: text,
        fromName: reply.author,
        isOfficial: reply.isOfficialDesa,
        message: reply.isOfficialDesa
          ? `${reply.author} merespons resmi suaramu.`
          : `${reply.author} membalas suaramu.`,
        createdAt: reply.createdAt instanceof Date ? reply.createdAt : new Date(reply.createdAt),
        isRead: false,
      });
    }

    if (voice.status === "resolved") {
      notifs.push({
        id: `nres-${voice.id}`,
        type: "resolved",
        voiceId: voice.id,
        voiceText: text,
        fromName: "Perangkat desa",
        isOfficial: true,
        message: "Masalah pada suaramu ditandai selesai.",
        createdAt: voice.resolvedAt ? new Date(voice.resolvedAt) : voice.createdAt,
        isRead: false,
      });
    }

    if (voice.votes.benar > 0) {
      notifs.push({
        id: `nv-${voice.id}`,
        type: "vote_benar",
        voiceId: voice.id,
        voiceText: text,
        fromName: "Seseorang",
        isOfficial: false,
        message: `${voice.votes.benar} orang menandai suaramu sebagai Benar.`,
        createdAt: voice.createdAt,
        isRead: false,
      });
    }
  }

  return notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
