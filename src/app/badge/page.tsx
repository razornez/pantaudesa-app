import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { USER_BADGES } from "@/lib/user-profile";

const BADGE_RULES = [
  "Kontribusi berkualitas lebih penting daripada jumlah aktivitas.",
  "Tuduhan tanpa sumber tidak dihitung sebagai kontribusi reputasi.",
  "Laporan yang menyerang pribadi bisa diturunkan prioritasnya.",
  "Kontributor dengan reputasi tinggi tetap harus mengikuti aturan komunitas.",
];

export const metadata: Metadata = {
  title: "Badge Kontribusi Warga — PantauDesa",
  description: "Pelajari level badge PantauDesa sebagai reputasi kontribusi warga yang membantu menjaga transparansi desa.",
};

export default function BadgePage() {
  const badges = Object.values(USER_BADGES);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="space-y-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <ShieldCheck size={14} />
            Reputasi kontribusi warga
          </div>
          <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            Badge bukan hiasan. Badge menunjukkan partisipasi warga yang bertanggung jawab.
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Badge PantauDesa membantu komunitas mengenali warga yang aktif membaca data, mengikuti perkembangan desa, dan memberi kontribusi yang membantu transparansi tanpa mendorong spam atau tuduhan sembarangan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {badges.map((badge) => (
            <article key={badge.tier} className={`rounded-2xl p-5 ${badge.color}`}>
              <div className="text-3xl">{badge.emoji}</div>
              <p className={`mt-3 text-sm font-black ${badge.textColor}`}>{badge.label}</p>
              <p className={`mt-1 text-xs font-bold ${badge.textColor} opacity-70`}>Level {badge.tier} · {badge.minScore}+ poin</p>
              <p className={`mt-3 text-xs leading-relaxed ${badge.textColor} opacity-80`}>{badge.description}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-lg font-black text-slate-900">Cara naik level</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Skor reputasi naik dari kontribusi yang membantu komunitas: desa yang dipantau, suara warga yang terbukti benar, informasi yang dianggap berguna, diskusi sehat, dan masalah yang ikut terselesaikan.
            </p>
            <Link
              href="/daftar"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Mulai ikut memantau
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-lg font-black text-amber-950">Aturan anti-spam</p>
            <ul className="mt-4 space-y-2">
              {BADGE_RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
