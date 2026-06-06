import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { db } from "@/lib/db";
import { submitIntakeReview } from "@/lib/internal-admin/intake-submit-review-service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    const result = await submitIntakeReview({
      request: req,
      actorUserId: session.userId,
      db,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return handleApiError(err, "POST /api/internal-admin/intake/submit-review");
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
