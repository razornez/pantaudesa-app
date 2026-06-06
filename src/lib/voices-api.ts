/**
 * voices-api.ts — client-side helpers untuk mengambil dan mengirim suara warga.
 * Komponen UI tidak perlu tahu dari mana data berasal.
 */

import type { CitizenVoice, VoiceReply } from "./citizen-voice";

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function fetchVoices(desaId?: string): Promise<CitizenVoice[]> {
  const url = desaId ? `/api/voices?desaId=${encodeURIComponent(desaId)}` : "/api/voices";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil data suara warga");
  const data = await res.json();
  return data.map((v: CitizenVoice & { createdAt: string; resolvedAt?: string; replies: Array<VoiceReply & { createdAt: string }> }) => ({
    ...v,
    createdAt: new Date(v.createdAt),
    resolvedAt: v.resolvedAt ? new Date(v.resolvedAt) : undefined,
    replies: v.replies.map((r) => ({ ...r, createdAt: new Date(r.createdAt) })),
  }));
}

export async function submitVoice(payload: {
  desaId: string;
  category: string;
  text: string;
  isAnon: boolean;
  photos?: string[];
}): Promise<CitizenVoice> {
  const res = await fetch("/api/voices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Gagal mengirim suara");
  }
  const v = await res.json();
  return {
    ...v,
    createdAt: new Date(v.createdAt),
    resolvedAt: v.resolvedAt ? new Date(v.resolvedAt) : undefined,
    replies: (v.replies ?? []).map((r: VoiceReply & { createdAt: string }) => ({ ...r, createdAt: new Date(r.createdAt) })),
  };
}

export async function submitVote(voiceId: string, type: "BENAR" | "BOHONG") {
  const res = await fetch(`/api/voices/${voiceId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Gagal mengirim vote");
  }
  return res.json() as Promise<{ benar: number; bohong: number; viewerVoteType?: "BENAR" | "BOHONG" }>;
}

export async function submitHelpful(voiceId: string) {
  const res = await fetch(`/api/voices/${voiceId}/helpful`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Gagal menandai berguna");
  }
  return res.json() as Promise<{ helpful: number }>;
}

export async function submitReply(voiceId: string, payload: {
  text: string;
  isAnon: boolean;
}): Promise<VoiceReply> {
  const res = await fetch(`/api/voices/${voiceId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Gagal mengirim komentar");
  }
  const reply = await res.json();
  return { ...reply, createdAt: new Date(reply.createdAt) };
}
