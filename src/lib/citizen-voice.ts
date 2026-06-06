/**
 * citizen-voice.ts — types, mock data, dan helpers untuk "Suara Warga".
 *
 * Saat ini menggunakan data statis. Saat backend tersedia,
 * cukup ganti getter functions dengan API calls — komponen tidak perlu diubah.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoiceCategory =
  | "infrastruktur"
  | "bansos"
  | "fasilitas"
  | "anggaran"
  | "lingkungan"
  | "lainnya";

/** open = belum ditangani | in_progress = sedang diproses | resolved = sudah selesai */
export type VoiceStatus = "open" | "in_progress" | "resolved";

export interface VoiceReply {
  id:             string;
  voiceId:        string;
  author:         string;
  isAnon:         boolean;
  /** true = balasan resmi dari perangkat desa */
  isOfficialDesa: boolean;
  text:           string;
  createdAt:      Date;
}

export interface CitizenVoice {
  id:              string;
  desaId:          string;
  desaNama?:       string;
  desaKabupaten?:  string;
  desaSlug?:       string;
  category:        VoiceCategory;
  text:            string;
  author:          string;
  authorId?:       string | null;
  isAnon:          boolean;
  /** true = author adalah Admin Desa aktif (VERIFIED/LIMITED) untuk desa ini */
  authorIsAdminDesa?: boolean;
  /** Status Admin Desa author jika aktif di desa tersebut */
  authorAdminDesaStatus?: "VERIFIED" | "LIMITED";
  /** Trust tier (1–5) berdasarkan aktivitas warga di semua desa */
  authorTrustTier?: 1 | 2 | 3 | 4 | 5;
  /** state viewer saat ini agar tombol berguna/vote tidak bisa diklik ulang setelah refresh */
  viewerHasHelped?: boolean;
  viewerVoteType?: "BENAR" | "BOHONG";
  createdAt:       Date;
  helpful:         number;
  /** URL foto bukti. Dalam produksi: URL dari storage (S3, dll.) */
  photos:          string[];
  votes:           { benar: number; bohong: number };
  status:          VoiceStatus;
  resolvedAt?:     Date;
  replies:         VoiceReply[];
}

// ─── Kategori config ─────────────────────────────────────────────────────────

export const VOICE_CATEGORIES: Record<VoiceCategory, { label: string; emoji: string; color: string }> = {
  infrastruktur: { label: "Infrastruktur",   emoji: "🛣️",  color: "bg-orange-100 text-orange-700 border-orange-200"   },
  bansos:        { label: "Bansos & BLT",    emoji: "💰",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  fasilitas:     { label: "Fasilitas Umum",  emoji: "🏫",  color: "bg-sky-100 text-sky-700 border-sky-200"             },
  anggaran:      { label: "Anggaran",        emoji: "📋",  color: "bg-indigo-100 text-indigo-700 border-indigo-200"    },
  lingkungan:    { label: "Lingkungan",      emoji: "🌿",  color: "bg-teal-100 text-teal-700 border-teal-200"          },
  lainnya:       { label: "Lainnya",         emoji: "💬",  color: "bg-slate-100 text-slate-700 border-slate-200"       },
};

/** Trust tier display config — mirrors user-profile.ts USER_BADGES but usable in VoiceCard without importing mock-data deps */
export const TRUST_TIER_CONFIG: Record<1 | 2 | 3 | 4 | 5, { emoji: string; label: string; color: string }> = {
  1: { emoji: "🌱", label: "Warga Peduli",           color: "bg-slate-100 text-slate-600"    },
  2: { emoji: "🔎", label: "Pemantau Desa",          color: "bg-sky-100 text-sky-700"        },
  3: { emoji: "🤝", label: "Kontributor Warga",      color: "bg-amber-100 text-amber-700"    },
  4: { emoji: "🛡️", label: "Penjaga Transparansi",   color: "bg-indigo-100 text-indigo-700"  },
  5: { emoji: "🏅", label: "Penggerak Desa Terbuka", color: "bg-violet-100 text-violet-700"  },
};

export const STATUS_CONFIG: Record<VoiceStatus, { label: string; short: string; bg: string; text: string; border: string }> = {
  open:        { label: "Belum ditangani",    short: "Belum",   bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"    },
  in_progress: { label: "Sedang diproses",    short: "Proses",  bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"   },
  resolved:    { label: "Sudah diselesaikan", short: "Selesai", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_BG = [
  "bg-indigo-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500",   "bg-violet-500",  "bg-sky-500",
  "bg-teal-500",   "bg-orange-500",
];

export function getAvatarBg(name: string): string {
  const idx = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_BG.length;
  return AVATAR_BG[idx];
}

export function getInitial(name: string): string {
  return name === "Anonim" ? "?" : name.trim().charAt(0).toUpperCase();
}

// ─── Relative time ────────────────────────────────────────────────────────────

export function relativeTime(date: Date | string | number): string {
  // Props crossing the Server→Client boundary serialize Date → string, so coerce
  // defensively instead of assuming a Date instance.
  const d = date instanceof Date ? date : new Date(date);
  const time = d.getTime();
  if (Number.isNaN(time)) return "";
  const diff  = Date.now() - time;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return "Baru saja";
  if (mins  < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days  ===1) return "Kemarin";
  if (days  <  7) return `${days} hari lalu`;
  if (days  < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
}

// NOTE: The mock voice data + getters (getVoicesForDesa / getAllVoices /
// getVoiceStats / getDesaRanking / getCategoryStats) were removed. All voices
// now come from the database via src/lib/data/voice-read.ts. This module keeps
// only the shared voice domain (types, category/status config, formatting).
