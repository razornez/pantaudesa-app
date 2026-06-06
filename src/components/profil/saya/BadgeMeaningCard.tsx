"use client";

import Link from "next/link";
import { USER_BADGES, type BadgeTier } from "@/lib/user-profile";

export function BadgeMeaningCard({ score, tier }: { score: number; tier: BadgeTier }) {
  const badge = USER_BADGES[tier];
  const next = tier < 5 ? USER_BADGES[(tier + 1) as BadgeTier] : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-900">Apa arti badge kamu?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Badge bukan sekadar hiasan. Badge menunjukkan seberapa aktif kamu ikut menjaga transparansi desa dengan cara yang
            bertanggung jawab.
          </p>
        </div>
        <span className={`rounded-2xl px-3 py-2 text-xs font-black ${badge.color} ${badge.textColor}`}>
          {badge.emoji} Level {badge.tier}
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-800">{badge.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{badge.description}</p>
        <p className="mt-2 text-[10px] font-bold text-slate-400">{score} poin reputasi</p>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/badge" className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
          Pelajari badge
        </Link>
        {next && (
          <div className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-500">
            Berikutnya: <span className="font-bold text-slate-700">{next.emoji} {next.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
