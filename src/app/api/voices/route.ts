import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { createNotifications, NOTIF_TYPE } from "@/lib/notifications/create-notification";
import type { VoiceCategory } from "@/lib/citizen-voice";

const VALID_CATEGORIES = ["infrastruktur", "bansos", "fasilitas", "anggaran", "lingkungan", "lainnya"];
const ACTIVE_ADMIN_STATUSES = ["VERIFIED", "LIMITED"] as const;

const TRUST_TIERS = [
  { tier: 5 as const, minScore: 250 },
  { tier: 4 as const, minScore: 120 },
  { tier: 3 as const, minScore: 60 },
  { tier: 2 as const, minScore: 20 },
  { tier: 1 as const, minScore: 0 },
];

function computeTrustTier(voiceCount: number, helpfulCount: number, resolvedCount: number): 1 | 2 | 3 | 4 | 5 {
  const score = voiceCount * 5 + helpfulCount * 2 + resolvedCount * 10;
  for (const { tier, minScore } of TRUST_TIERS) if (score >= minScore) return tier;
  return 1;
}

function displayName(user: { nama: string | null; username: string | null; email?: string | null } | null) {
  return user?.nama ?? user?.username ?? user?.email ?? "Anonim";
}

function shapeVoice(
  v: {
    id: string; desaId: string; category: string; text: string;
    isAnon: boolean; authorId: string | null; createdAt: Date; resolvedAt: Date | null;
    status: string; photos: string[];
    author: { id: string; nama: string | null; username: string | null; email?: string | null } | null;
    votes: { userId?: string; type: string }[];
    helpfuls: { userId: string }[];
    replies: {
      id: string; isAnon: boolean; isOfficialDesa: boolean; text: string; createdAt: Date;
      author: { nama: string | null; username: string | null; email?: string | null } | null;
    }[];
  },
  opts: {
    desa?: { id: string; nama: string; kabupaten: string; slug: string };
    canonicalDesaId?: string;
    authorAdminStatus?: "VERIFIED" | "LIMITED";
    authorTrustTier?: 1 | 2 | 3 | 4 | 5;
    viewerUserId?: string;
  } = {},
) {
  const viewerVote = opts.viewerUserId ? v.votes.find((vote) => vote.userId === opts.viewerUserId)?.type : undefined;

  return {
    id: v.id,
    desaId: opts.canonicalDesaId ?? v.desaId,
    desaNama: opts.desa?.nama,
    desaKabupaten: opts.desa?.kabupaten,
    desaSlug: opts.desa?.slug,
    category: v.category as VoiceCategory,
    text: v.text,
    author: v.isAnon ? "Anonim" : displayName(v.author),
    authorId: v.authorId,
    isAnon: v.isAnon,
    authorIsAdminDesa: v.isAnon ? false : !!opts.authorAdminStatus,
    authorAdminDesaStatus: v.isAnon ? undefined : opts.authorAdminStatus,
    authorTrustTier: v.isAnon ? undefined : opts.authorTrustTier,
    viewerHasHelped: opts.viewerUserId ? v.helpfuls.some((h) => h.userId === opts.viewerUserId) : false,
    viewerVoteType: viewerVote === "BENAR" || viewerVote === "BOHONG" ? viewerVote : undefined,
    createdAt: v.createdAt,
    helpful: v.helpfuls.length,
    photos: v.photos,
    votes: {
      benar: v.votes.filter((vote) => vote.type === "BENAR").length,
      bohong: v.votes.filter((vote) => vote.type === "BOHONG").length,
    },
    status: v.status === "OPEN" ? "open" : v.status === "IN_PROGRESS" ? "in_progress" : "resolved",
    resolvedAt: v.resolvedAt ?? undefined,
    replies: v.replies.map((r) => ({
      id: r.id,
      voiceId: v.id,
      author: r.isAnon ? "Anonim" : displayName(r.author),
      isAnon: r.isAnon,
      isOfficialDesa: r.isOfficialDesa,
      text: r.text,
      createdAt: r.createdAt,
    })),
  } as const;
}

const VOICE_INCLUDE = {
  author: { select: { id: true, nama: true, username: true, email: true, avatarUrl: true } },
  votes: { select: { userId: true, type: true } },
  helpfuls: { select: { userId: true } },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, nama: true, username: true, email: true, avatarUrl: true } } },
  },
};

async function resolveDesaFilter(desaId: string | null) {
  if (!desaId || !db) return { where: undefined, desaMap: new Map<string, { id: string; nama: string; kabupaten: string; slug: string }>() };

  const desa = await db.desa.findFirst({
    where: { OR: [{ id: desaId }, { slug: desaId }] },
    select: { id: true, slug: true, nama: true, kabupaten: true },
  });

  if (!desa) {
    return { where: { desaId }, desaMap: new Map<string, { id: string; nama: string; kabupaten: string; slug: string }>() };
  }

  const value = { id: desa.id, nama: desa.nama, kabupaten: desa.kabupaten, slug: desa.slug };
  const desaMap = new Map<string, { id: string; nama: string; kabupaten: string; slug: string }>([
    [desa.id, value],
    [desa.slug, value],
  ]);
  return { where: { desaId: { in: [desa.id, desa.slug] } }, desaMap };
}

async function notifyActiveAdmins(input: {
  desaId: string;
  actorUserId?: string;
  type: typeof NOTIF_TYPE.VOICE_CREATED;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
}) {
  if (!db) return;
  const admins = await db.desaAdminMember.findMany({
    where: {
      desaId: input.desaId,
      status: { in: [...ACTIVE_ADMIN_STATUSES] },
      ...(input.actorUserId ? { userId: { not: input.actorUserId } } : {}),
    },
    select: { userId: true },
  });

  await createNotifications(admins.map((admin) => ({
    userId: admin.userId,
    desaId: input.desaId,
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata,
  })));
}

// ─── GET /api/voices?desaId=&limit=&cursor= ───────────────────────────────────

export async function GET(req: Request) {
  try {
    if (!db) return NextResponse.json([]);

    const session = await auth();
    const { searchParams } = new URL(req.url);
    const desaId = searchParams.get("desaId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const cursor = searchParams.get("cursor") ?? undefined;
    const resolved = await resolveDesaFilter(desaId);

    const voices = await db.voice.findMany({
      where: resolved.where,
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: VOICE_INCLUDE,
    });

    const desaIds = [...new Set(voices.flatMap((voice) => {
      const known = resolved.desaMap.get(voice.desaId);
      return known ? [known.id, known.slug] : [voice.desaId];
    }))];

    const desaRows = desaIds.length > 0
      ? await db.desa.findMany({
          where: { OR: [{ id: { in: desaIds } }, { slug: { in: desaIds } }] },
          select: { id: true, slug: true, nama: true, kabupaten: true },
        })
      : [];

    const desaMap = new Map(resolved.desaMap);
    desaRows.forEach((desa) => {
      const value = { id: desa.id, nama: desa.nama, kabupaten: desa.kabupaten, slug: desa.slug };
      desaMap.set(desa.id, value);
      desaMap.set(desa.slug, value);
    });

    const authorDesaPairs = voices
      .filter((v) => !v.isAnon && v.authorId)
      .map((v) => ({ authorId: v.authorId!, desaId: desaMap.get(v.desaId)?.id ?? v.desaId }));

    const adminMembers = authorDesaPairs.length > 0
      ? await db.desaAdminMember.findMany({
          where: {
            OR: authorDesaPairs.map((p) => ({ userId: p.authorId, desaId: p.desaId })),
            status: { in: [...ACTIVE_ADMIN_STATUSES] },
          },
          select: { userId: true, desaId: true, status: true },
        })
      : [];

    const adminStatusMap = new Map(adminMembers.map((m) => [`${m.userId}:${m.desaId}`, m.status as "VERIFIED" | "LIMITED"]));
    const authorIds = [...new Set(voices.filter((v) => !v.isAnon && v.authorId).map((v) => v.authorId!))];

    const [voiceCounts, helpfulCounts, resolvedCounts] = authorIds.length > 0
      ? await Promise.all([
          db.voice.groupBy({ by: ["authorId"], where: { authorId: { in: authorIds }, isAnon: false }, _count: { id: true } }),
          db.voiceHelpful.groupBy({ by: ["userId"], where: { voice: { authorId: { in: authorIds }, isAnon: false } }, _count: { id: true } }),
          db.voice.groupBy({ by: ["authorId"], where: { authorId: { in: authorIds }, isAnon: false, status: "RESOLVED" }, _count: { id: true } }),
        ])
      : [[], [], []] as const;

    const voiceCountMap = new Map<string, number>(voiceCounts.map((r) => [r.authorId as string, r._count.id]));
    const helpfulCountMap = new Map<string, number>(helpfulCounts.map((r) => [r.userId as string, r._count.id]));
    const resolvedCountMap = new Map<string, number>(resolvedCounts.map((r) => [r.authorId as string, r._count.id]));

    return NextResponse.json(voices.map((voice) => {
      const canonicalDesaId = desaMap.get(voice.desaId)?.id ?? voice.desaId;
      const authorAdminStatus = !voice.isAnon && voice.authorId
        ? adminStatusMap.get(`${voice.authorId}:${canonicalDesaId}`)
        : undefined;
      const trustTier = !voice.isAnon && voice.authorId
        ? computeTrustTier(
            voiceCountMap.get(voice.authorId) ?? 0,
            helpfulCountMap.get(voice.authorId) ?? 0,
            resolvedCountMap.get(voice.authorId) ?? 0,
          )
        : undefined;

      return shapeVoice(voice, {
        desa: desaMap.get(voice.desaId),
        canonicalDesaId,
        authorAdminStatus,
        authorTrustTier: trustTier,
        viewerUserId: session?.user?.id,
      });
    }));
  } catch (error) {
    return handleApiError(error, "GET /api/voices");
  }
}

// ─── POST /api/voices ─────────────────────────────────────────────────────────

// Lightweight per-IP rate limit for unauthenticated voice submissions.
// Prevents spam / desaId enumeration via rapid posting.
const VOICE_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const VOICE_RATE_MAX_UNAUTH = 3;               // unauthenticated: 3 per 10 min
const VOICE_RATE_MAX_AUTH = 10;                // authenticated: 10 per 10 min
const voiceRateBuckets = new Map<string, number[]>();

function voiceRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const hits = (voiceRateBuckets.get(key) ?? []).filter((t) => now - t < VOICE_RATE_WINDOW_MS);
  if (hits.length >= max) { voiceRateBuckets.set(key, hits); return true; }
  hits.push(now);
  voiceRateBuckets.set(key, hits);
  return false;
}

export async function POST(req: Request) {
  try {
    if (!db) return NextResponse.json({ error: "Layanan penyimpanan belum siap" }, { status: 503 });

    const session = await auth();

    // Rate-limit: stricter for unauthenticated posters to prevent spam/enumeration.
    const clientIp = (req as import("next/server").NextRequest).headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? (req as import("next/server").NextRequest).headers?.get("x-real-ip")
      ?? "unknown";
    const rateLimitKey = session?.user?.id ?? `ip:${clientIp}`;
    const maxPerWindow = session?.user?.id ? VOICE_RATE_MAX_AUTH : VOICE_RATE_MAX_UNAUTH;
    if (voiceRateLimited(rateLimitKey, maxPerWindow)) {
      return NextResponse.json(
        { error: "Terlalu banyak kiriman. Coba lagi beberapa menit lagi." },
        { status: 429 },
      );
    }
    const body = await req.json();
    const { desaId, category, text, photos } = body;

    if (!desaId || !category || !text?.trim()) {
      return NextResponse.json({ error: "desaId, category, dan text wajib diisi" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
    if (text.trim().length < 10) return NextResponse.json({ error: "Cerita terlalu pendek (minimal 10 karakter)" }, { status: 400 });
    if (text.trim().length > 400) return NextResponse.json({ error: "Cerita terlalu panjang (maksimal 400 karakter)" }, { status: 400 });

    const desa = await db.desa.findFirst({
      where: { OR: [{ id: desaId }, { slug: desaId }] },
      select: { id: true, slug: true, nama: true, kabupaten: true },
    });
    const canonicalDesaId = desa?.id ?? desaId;
    const photoList = Array.isArray(photos) ? photos.filter((p) => typeof p === "string").slice(0, 3) : [];
    const effectiveIsAnon = session?.user?.id ? false : true;

    const voice = await db.voice.create({
      data: {
        desaId: canonicalDesaId,
        category,
        text: text.trim(),
        isAnon: effectiveIsAnon,
        authorId: session?.user?.id ?? null,
        photos: photoList,
      },
      include: VOICE_INCLUDE,
    });

    let authorAdminStatus: "VERIFIED" | "LIMITED" | undefined;
    let trustTier: 1 | 2 | 3 | 4 | 5 | undefined;

    if (!effectiveIsAnon && session?.user?.id) {
      const [adminMember, vcCount, hlCount, rvCount] = await Promise.all([
        db.desaAdminMember.findFirst({ where: { userId: session.user.id, desaId: canonicalDesaId, status: { in: [...ACTIVE_ADMIN_STATUSES] } }, select: { status: true } }),
        db.voice.count({ where: { authorId: session.user.id, isAnon: false } }),
        db.voiceHelpful.count({ where: { voice: { authorId: session.user.id, isAnon: false } } }),
        db.voice.count({ where: { authorId: session.user.id, isAnon: false, status: "RESOLVED" } }),
      ]);
      authorAdminStatus = adminMember?.status as "VERIFIED" | "LIMITED" | undefined;
      trustTier = computeTrustTier(vcCount, hlCount, rvCount);
    }

    void notifyActiveAdmins({
      desaId: canonicalDesaId,
      actorUserId: session?.user?.id,
      type: NOTIF_TYPE.VOICE_CREATED,
      title: "Ada suara warga baru",
      body: `${displayName(voice.author)} menulis suara warga untuk desa ini.`,
      metadata: { voiceId: voice.id, category },
    });

    return NextResponse.json(shapeVoice(voice, {
      desa: desa ? { id: desa.id, nama: desa.nama, kabupaten: desa.kabupaten, slug: desa.slug } : undefined,
      canonicalDesaId,
      authorAdminStatus,
      authorTrustTier: trustTier,
      viewerUserId: session?.user?.id,
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/voices");
  }
}
