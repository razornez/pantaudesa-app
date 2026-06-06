"use client";

import BadgePill from "@/components/user/BadgePill";
import { USER_BADGES, type BadgeTier } from "@/lib/user-profile";

export function TrustCard({ score, tier }: { score: number; tier: BadgeTier }) {
  const badge = USER_BADGES[tier];
  const next = USER_BADGES[(tier < 5 ? tier + 1 : 5) as BadgeTier];
  const percentage =
    tier < 5 ? Math.round(((score - badge.minScore) / (next.minScore - badge.minScore)) * 100) : 100;

  return (
    <div className={`rounded-2xl p-4 ${badge.color}`}>
      <div className="mb-3 flex items-center justify-between">
        <BadgePill badge={badge} showDesc />
        <span className={`text-sm font-black opacity-60 ${badge.textColor}`}>{score} poin</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
        <div className={`h-full rounded-full bg-current opacity-60 ${badge.textColor}`} style={{ width: `${percentage}%` }} />
      </div>
      {tier < 5 && (
        <p className={`mt-1.5 text-[10px] opacity-60 ${badge.textColor}`}>
          {next.minScore - score} poin lagi → {next.emoji} {next.label}
        </p>
      )}
    </div>
  );
}
