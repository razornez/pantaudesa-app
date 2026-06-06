import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAdminClaimProfileData,
  getAdminClaimProfileSummaryData,
} from "@/lib/data/admin-claim-read";
import { normalizeAdminClaimProfileDetail } from "@/lib/admin-claim/profile-cache";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const detail = normalizeAdminClaimProfileDetail(searchParams.get("detail"));
    const data = detail === "summary"
      ? await getAdminClaimProfileSummaryData(session.user.id)
      : await getAdminClaimProfileData(session.user.id);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "GET /api/admin-claim/profile");
  }
}
