import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import { db } from "@/lib/db";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { getDesaFilterOptionsViaSupabase } from "@/lib/internal-admin/supabase-fallback";

/** Returns distinct provinsi/kabupaten/kecamatan values for admin filter dropdowns. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const sp = req.nextUrl.searchParams;
    const provinsi = sp.get("provinsi")?.trim() ?? "";
    const kabupaten = sp.get("kabupaten")?.trim() ?? "";

    if (!db) {
      const fallback = await getDesaFilterOptionsViaSupabase({ provinsi, kabupaten });
      return NextResponse.json(fallback);
    }

    const provinsiWhere = { NOT: { provinsi: "" } };
    const kabupatenWhere = provinsi ? { provinsi } : {};
    const kecamatanWhere = { ...(provinsi ? { provinsi } : {}), ...(kabupaten ? { kabupaten } : {}) };

    const [provinsiRows, kabupatenRows, kecamatanRows] = await Promise.all([
      db.desa.findMany({ where: provinsiWhere, select: { provinsi: true }, distinct: ["provinsi"], orderBy: { provinsi: "asc" } }),
      db.desa.findMany({ where: kabupatenWhere, select: { kabupaten: true }, distinct: ["kabupaten"], orderBy: { kabupaten: "asc" } }),
      db.desa.findMany({ where: kecamatanWhere, select: { kecamatan: true }, distinct: ["kecamatan"], orderBy: { kecamatan: "asc" } }),
    ]);

    return NextResponse.json({
      provinsi: provinsiRows.map(r => r.provinsi).filter(Boolean),
      kabupaten: kabupatenRows.map(r => r.kabupaten).filter(Boolean),
      kecamatan: kecamatanRows.map(r => r.kecamatan).filter(Boolean),
    });
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      const sp = req.nextUrl.searchParams;
      const provinsi = sp.get("provinsi")?.trim() ?? "";
      const kabupaten = sp.get("kabupaten")?.trim() ?? "";
      try {
        const fallback = await getDesaFilterOptionsViaSupabase({ provinsi, kabupaten });
        return NextResponse.json(fallback);
      } catch {
        // fall through to shared API error handler
      }
    }
    return handleApiError(err, "GET /api/internal-admin/desa-filter-options");
  }
}
