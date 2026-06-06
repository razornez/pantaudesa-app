/**
 * badge.ts — sistem badge 5 level untuk desa.
 * Level ditentukan dari kombinasi serapan anggaran + skor transparansi.
 */

import { DesaBadge, BadgeLevel } from "./types";

// ─── Konfigurasi badge per level ─────────────────────────────────────────────

export const BADGE_CONFIG: Record<BadgeLevel, Omit<DesaBadge, "level">> = {
  5: {
    label:     "Desa Teladan",
    deskripsi: "Serapan ≥90% dan transparansi sangat tinggi. Desa ini jadi contoh terbaik.",
    warna:     "amber",
    icon:      "🏆",
  },
  4: {
    label:     "Desa Berprestasi",
    deskripsi: "Serapan 80–89% dan transparansi baik. Kinerja di atas rata-rata nasional.",
    warna:     "indigo",
    icon:      "🥇",
  },
  3: {
    label:     "Desa Berkembang",
    deskripsi: "Serapan 65–79% dan transparansi cukup. Masih ada ruang untuk meningkat.",
    warna:     "sky",
    icon:      "🌱",
  },
  2: {
    label:     "Desa Perlu Dorongan",
    deskripsi: "Serapan 50–64% atau transparansi rendah. Perlu perhatian dari warga dan pemda.",
    warna:     "orange",
    icon:      "⚠️",
  },
  1: {
    label:     "Desa Butuh Pengawasan",
    deskripsi: "Serapan <50% dan transparansi sangat rendah. Warga harus aktif mengawasi.",
    warna:     "rose",
    icon:      "🚨",
  },
};

// ─── Hitung badge dari skor ───────────────────────────────────────────────────

export function getBadgeLevel(serapan: number, skorTransparansi: number): BadgeLevel {
  const avg = (serapan * 0.6) + (skorTransparansi * 0.4);
  if (avg >= 88)  return 5;
  if (avg >= 75)  return 4;
  if (avg >= 62)  return 3;
  if (avg >= 48)  return 2;
  return 1;
}

export function buildBadge(serapan: number, skorTransparansi: number): DesaBadge {
  const level = getBadgeLevel(serapan, skorTransparansi);
  return { level, ...BADGE_CONFIG[level] };
}

// ─── Tailwind classes per warna badge ────────────────────────────────────────

export const BADGE_STYLES: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-300",  ring: "ring-amber-400/30"  },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-300", ring: "ring-indigo-400/30" },
  sky:    { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-300",    ring: "ring-sky-400/30"    },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300", ring: "ring-orange-400/30" },
  rose:   { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-300",   ring: "ring-rose-400/30"   },
};
