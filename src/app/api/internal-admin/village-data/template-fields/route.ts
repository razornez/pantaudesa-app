import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { buildTemplateFieldEngineViewModel } from "@/lib/village-data/template-engine-view";

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const desaId = req.nextUrl.searchParams.get("desaId")?.trim() ?? "";
    if (!desaId) {
      return NextResponse.json({ error: "desaId is required" }, { status: 400 });
    }

    const payload = await buildTemplateFieldEngineViewModel(desaId);
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/village-data/template-fields");
  }
}
