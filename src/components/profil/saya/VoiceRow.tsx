"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VOICE_CATEGORIES, STATUS_CONFIG, relativeTime } from "@/lib/citizen-voice";
import type { CitizenVoice } from "@/lib/citizen-voice";

interface VoiceRowProps {
  voice: CitizenVoice;
  desaName?: string;
}

export function VoiceRow({ voice, desaName }: VoiceRowProps) {
  const category = VOICE_CATEGORIES[voice.category];
  const status = STATUS_CONFIG[voice.status];

  return (
    <Link
      href={`/desa/${voice.desaId}/suara`}
      className="group flex items-start gap-3 border-b border-slate-50 px-4 py-3.5 transition-colors last:border-0 hover:bg-slate-50"
    >
      <span className="flex-shrink-0 text-lg">{category.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-700 transition-colors group-hover:text-slate-900">
          {voice.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${status.bg} ${status.text} ${status.border}`}>
            {status.short}
          </span>
          {desaName && <span className="text-[10px] text-slate-400">{desaName}</span>}
          <span className="text-[10px] text-slate-400">{relativeTime(voice.createdAt)}</span>
          <span className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
            <span>✅ {voice.votes.benar}</span>
            <span>👍 {voice.helpful}</span>
            <span>💬 {voice.replies.length}</span>
          </span>
        </div>
      </div>
      <ChevronRight size={13} className="mt-1 flex-shrink-0 text-slate-300 transition-colors group-hover:text-indigo-400" />
    </Link>
  );
}
