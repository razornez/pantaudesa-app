import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import {
  loadInternalDashboardRankings,
  parseDashboardRankingFilters,
} from "@/lib/internal-admin/dashboard-service";

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const filters = parseDashboardRankingFilters({
      q: req.nextUrl.searchParams.get("q") ?? "",
      provinsi: req.nextUrl.searchParams.get("provinsi") ?? "",
      kabupaten: req.nextUrl.searchParams.get("kabupaten") ?? "",
      kecamatan: req.nextUrl.searchParams.get("kecamatan") ?? "",
      preset: req.nextUrl.searchParams.get("preset") ?? "",
    });

    const result = await loadInternalDashboardRankings(filters);
    if (result.kind === "unavailable") {
      return NextResponse.json({ error: result.message }, { status: 503 });
    }

    return NextResponse.json(result.response);
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/dashboard/village-rankings");
  }
}

