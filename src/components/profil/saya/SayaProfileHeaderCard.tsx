"use client";

import UserAvatar from "@/components/user/UserAvatar";
import BadgePill from "@/components/user/BadgePill";
import type { BadgeTier } from "@/lib/user-profile";

type Tab = "profil" | "suara" | "notifikasi";

interface SayaProfileHeaderCardProps {
  nama: string;
  username: string;
  avatarUrl?: string;
  badge: {
    tier: BadgeTier;
    label: string;
    color: string;
    textColor: string;
    emoji: string;
    description: string;
    minScore: number;
  };
  tab: Tab;
  tabs: Array<{ id: Tab; label: string; badge?: number }>;
  onTabChange: (tab: Tab) => void;
}

export function SayaProfileHeaderCard({
  nama,
  username,
  avatarUrl,
  badge,
  tab,
  tabs,
  onTabChange,
}: SayaProfileHeaderCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="h-16 bg-gradient-to-r from-indigo-600 to-violet-600" />
      <div className="-mt-8 px-5 pb-4">
        <div className="mb-4 flex items-end justify-between">
          <div className="rounded-full ring-4 ring-white">
            <UserAvatar nama={nama} avatarUrl={avatarUrl} size="lg" />
          </div>
          <div className="text-right">
            <BadgePill badge={badge} compact />
            <p className="mt-0.5 text-[10px] text-slate-400">Lihat arti ↓</p>
          </div>
        </div>
        <p className="text-base font-black text-slate-900">{nama}</p>
        <p className="text-xs text-slate-400">@{username}</p>
      </div>

      <div className="flex border-t border-slate-100">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-bold transition-all ${
              tab === item.id ? "border-indigo-500 bg-indigo-50/30 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {item.label}
            {item.badge !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                  item.id === "notifikasi" && item.badge > 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
