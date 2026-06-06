import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { loadInternalDashboardSummary } from "@/lib/internal-admin/dashboard-service";

export async function GET() {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const result = await loadInternalDashboardSummary();
    if (result.kind === "unavailable") {
      return NextResponse.json({ error: result.message }, { status: 503 });
    }

    return NextResponse.json(result.summary);
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/dashboard/summary");
  }
}

