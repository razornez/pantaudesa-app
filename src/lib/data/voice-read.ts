import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { perfStart, publicPerfLogWithRows } from "@/lib/perf";
import type { CitizenVoice, VoiceStatus } from "@/lib/citizen-voice";

function mapStatus(status: string): VoiceStatus {
  if (status === "IN_PROGRESS") return "in_progress";
  if (status === "RESOLVED") return "resolved";
  return "open";
}

type VoiceRecord = Prisma.VoiceGetPayload<{
  include: {
    author: { select: { nama: true; name: true; username: true } };
    replies: {
      include: { author: { select: { nama: true; name: true; username: true } } };
    };
    votes: { select: { type: true } };
    helpfuls: { select: { id: true } };
  };
}>;

type DesaLookup = {
  nama: string;
  kabupaten: string;
  slug: string;
};

function authorName(author: VoiceRecord["author"], isAnon: boolean) {
  if (isAnon || !author) return "Anonim";
  return author.nama ?? author.name ?? author.username ?? "Warga";
}

function mapVoice(record: VoiceRecord, desa?: DesaLookup): CitizenVoice {
  const benar = record.votes.filter((vote) => vote.type === "BENAR").length;
  const bohong = record.votes.filter((vote) => vote.type === "BOHONG").length;

  return {
    id: record.id,
    desaId: record.desaId,
    desaNama: desa?.nama,
    desaKabupaten: desa?.kabupaten,
    desaSlug: desa?.slug,
    category: record.category,
    text: record.text,
    author: authorName(record.author, record.isAnon),
    isAnon: record.isAnon,
    createdAt: record.createdAt,
    helpful: record.helpfuls.length,
    photos: [],
    votes: { benar, bohong },
    status: mapStatus(record.status),
    resolvedAt: record.resolvedAt ?? undefined,
    replies: record.replies.map((reply) => ({
      id: reply.id,
      voiceId: reply.voiceId,
      author: authorName(reply.author, reply.isAnon),
      isAnon: reply.isAnon,
      isOfficialDesa: reply.isOfficialDesa,
      text: reply.text,
      createdAt: reply.createdAt,
    })),
  };
}

async function fetchVoiceRecords(desaId?: string) {
  if (!prisma) return [];

  const timer = perfStart();
  const records = await prisma.voice.findMany({
    where: desaId ? { desaId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { nama: true, name: true, username: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { nama: true, name: true, username: true } } },
      },
      votes: { select: { type: true } },
      helpfuls: { select: { id: true } },
    },
  });
  publicPerfLogWithRows(
    "public.voice-read",
    desaId ? "voice.findMany(desa)" : "voice.findMany(all)",
    records.length,
    timer,
  );
  return records;
}

async function fetchAllVoicesMapped() {
  const records = await fetchVoiceRecords();
  const desaRows = prisma
    ? await prisma.desa.findMany({
        where: { id: { in: [...new Set(records.map((record) => record.desaId))] } },
        select: { id: true, nama: true, kabupaten: true, slug: true },
      })
    : [];
  const desaMap = new Map(desaRows.map((desa) => [desa.id, desa]));
  const mapTimer = perfStart();
  const voices = records.map((record) => mapVoice(record, desaMap.get(record.desaId)));
  publicPerfLogWithRows("public.voice-read", "mapAllVoices", voices.length, mapTimer);
  return voices;
}

const getCachedAllVoices = unstable_cache(
  fetchAllVoicesMapped,
  ["pantau-desa-all-voices-v1"],
  { revalidate: 120, tags: ["voices-public"] }
);

export async function getAllVoicesFromDb() {
  const timer = perfStart();
  try {
    const voices = await getCachedAllVoices();
    publicPerfLogWithRows("public.voice-read", "getCachedAllVoices()", voices.length, timer);
    return voices;
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.warn("[voice-read] public voice read degraded due to database connectivity.");
      return [];
    }
    console.error("[voice-read] public voice read failed:", error);
    return [];
  }
}

export async function getVoicesForDesaFromDb(desaId: string) {
  try {
    const records = await fetchVoiceRecords(desaId);
    const desa = prisma
      ? await prisma.desa.findFirst({
          where: { OR: [{ id: desaId }, { slug: desaId }] },
          select: { id: true, nama: true, kabupaten: true, slug: true },
        })
      : null;
    const canonicalDesa =
      desa && records.length > 0 ? { nama: desa.nama, kabupaten: desa.kabupaten, slug: desa.slug } : undefined;
    return records.map((record) => mapVoice(record, canonicalDesa));
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.warn("[voice-read] public desa voice read degraded due to database connectivity.");
      return [];
    }
    console.error("[voice-read] public desa voice read failed:", error);
    return [];
  }
}

export async function getVoicesByAuthorIdFromDb(userId: string): Promise<CitizenVoice[]> {
  if (!prisma) return [];
  try {
    const records = await prisma.voice.findMany({
      where: { authorId: userId, isAnon: false },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { nama: true, name: true, username: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { nama: true, name: true, username: true } } },
        },
        votes: { select: { type: true } },
        helpfuls: { select: { id: true } },
      },
    });
    const desaRows = await prisma.desa.findMany({
      where: { id: { in: [...new Set(records.map((r) => r.desaId))] } },
      select: { id: true, nama: true, kabupaten: true, slug: true },
    });
    const desaMap = new Map(desaRows.map((d) => [d.id, d]));
    return records.map((record) => mapVoice(record, desaMap.get(record.desaId)));
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.warn("[voice-read] author voice read degraded due to database connectivity.");
      return [];
    }
    console.error("[voice-read] author voice read failed:", error);
    return [];
  }
}

export type DesaVoicePreview = {
  total: number;
  preview: Array<Pick<CitizenVoice, "id" | "category" | "text" | "author">>;
};

async function fetchVoicePreviewForDesa(desaId: string): Promise<DesaVoicePreview> {
  if (!prisma) return { total: 0, preview: [] };

  try {
    const timer = perfStart();
    const [total, records] = await Promise.all([
      prisma.voice.count({ where: { desaId } }),
      prisma.voice.findMany({
        where: { desaId },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          category: true,
          text: true,
          isAnon: true,
          author: { select: { nama: true, name: true, username: true } },
        },
      }),
    ]);
    publicPerfLogWithRows("public.voice-read", "voicePreview.count+findMany", records.length, timer);

    return {
      total,
      preview: records.map((record) => ({
        id: record.id,
        category: record.category,
        text: record.text,
        author: authorName(record.author, record.isAnon),
      })),
    };
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.warn("[voice-read] public desa voice preview read degraded due to database connectivity.");
      return { total: 0, preview: [] };
    }
    console.error("[voice-read] public desa voice preview read failed:", error);
    return { total: 0, preview: [] };
  }
}

const getCachedVoicePreviewForDesa = unstable_cache(
  fetchVoicePreviewForDesa,
  ["pantau-desa-voice-preview-v1"],
  { revalidate: 120, tags: ["voices-public"] }
);

export async function getVoicePreviewForDesaFromDb(desaId: string): Promise<DesaVoicePreview> {
  return getCachedVoicePreviewForDesa(desaId);
}

export function getVoiceStatsFromVoices(voices: CitizenVoice[]) {
  const total = voices.length;
  const resolved = voices.filter((voice) => voice.status === "resolved").length;
  const inProgress = voices.filter((voice) => voice.status === "in_progress").length;
  const open = voices.filter((voice) => voice.status === "open").length;
  const desaCount = new Set(voices.map((voice) => voice.desaId)).size;

  const resolvedWithDate = voices.filter((voice) => voice.status === "resolved" && voice.resolvedAt);
  const avgResolutionDays = resolvedWithDate.length
    ? Math.round(
        resolvedWithDate.reduce((acc, voice) => {
          return acc + (new Date(voice.resolvedAt as string | Date).getTime() - voice.createdAt.getTime()) / 86_400_000;
        }, 0) / resolvedWithDate.length
      )
    : null;

  return { total, resolved, inProgress, open, desaCount, avgResolutionDays };
}
