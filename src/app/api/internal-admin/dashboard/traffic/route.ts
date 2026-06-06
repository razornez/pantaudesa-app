import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { DASHBOARD_TRAFFIC_EMPTY_STATE } from "@/lib/internal-admin/dashboard-constants";

export async function GET() {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    return NextResponse.json(DASHBOARD_TRAFFIC_EMPTY_STATE);
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/dashboard/traffic");
  }
}

