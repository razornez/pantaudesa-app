"use client";

import Link from "next/link";
import type { CitizenVoice } from "@/lib/citizen-voice";
import { VoiceRow } from "./VoiceRow";

export function SayaProfileVoicesTab({
  voices,
  desaMap,
}: {
  voices: CitizenVoice[];
  desaMap: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {voices.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="mb-3 text-3xl">🤫</p>
          <p className="text-sm font-semibold text-slate-600">Belum ada suara yang kamu bagikan.</p>
          <Link href="/suara" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
            Mulai bersuara →
          </Link>
        </div>
      ) : (
        voices.map((voice) => <VoiceRow key={voice.id} voice={voice} desaName={desaMap[voice.desaId]} />)
      )}
    </div>
  );
}
