import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { searchDesaOptionsViaSupabase } from "@/lib/internal-admin/supabase-fallback";

const DEFAULT_TAKE = 12;
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

// Module-level cache — survives across requests within the same server instance.
// Eliminates the Prisma cold-start penalty on subsequent calls.
type DesaRow = { id: string; nama: string; slug: string; kecamatan: string; kabupaten: string; provinsi: string };
const cache = new Map<string, { data: DesaRow[]; ts: number }>();

function fromCache(key: string): DesaRow[] | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data;
  cache.delete(key);
  return null;
}

function toCache(key: string, data: DesaRow[]) {
  if (cache.size >= 200) {
    // Evict oldest entry to keep memory bounded
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, { data, ts: Date.now() });
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const cacheKey = q.toLowerCase();

    const cached = fromCache(cacheKey);
    if (cached) {
      return NextResponse.json({ desa: cached, cached: true });
    }

    if (!db) {
      const desa = await searchDesaOptionsViaSupabase(q, DEFAULT_TAKE);
      toCache(cacheKey, desa as DesaRow[]);
      return NextResponse.json({ desa });
    }

    try {
      const desa = await db.desa.findMany({
        where: q
          ? {
              OR: [
                { nama: { contains: q, mode: "insensitive" } },
                { kecamatan: { contains: q, mode: "insensitive" } },
                { kabupaten: { contains: q, mode: "insensitive" } },
                { provinsi: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: [{ nama: "asc" }],
        take: DEFAULT_TAKE,
        select: {
          id: true,
          nama: true,
          slug: true,
          kecamatan: true,
          kabupaten: true,
          provinsi: true,
        },
      });

      toCache(cacheKey, desa);
      return NextResponse.json({ desa });
    } catch (error) {
      if (!isDatabaseConnectivityError(error)) throw error;
      const desa = await searchDesaOptionsViaSupabase(q, DEFAULT_TAKE);
      toCache(cacheKey, desa as DesaRow[]);
      return NextResponse.json({ desa });
    }
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/desa-options");
  }
}
