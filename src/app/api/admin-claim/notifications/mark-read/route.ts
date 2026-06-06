import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

// POST /api/admin-claim/notifications/mark-read
// Body: { ids?: string[] }
// If ids is omitted or empty, marks ALL unread notifications for the user as read.
// If ids is provided, marks only those notifications (ownership enforced).
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    let ids: string[] | undefined;
    try {
      const body = await req.json();
      if (Array.isArray(body?.ids) && body.ids.length > 0) {
        ids = body.ids as string[];
      }
    } catch {
      // Body parse failure = mark-all
    }

    const now = new Date();

    const result = await db.adminDesaNotification.updateMany({
      where: {
        userId,
        isRead: false,
        ...(ids ? { id: { in: ids } } : {}),
      },
      data: { isRead: true, readAt: now },
    });

    return NextResponse.json({ updated: result.count });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/notifications/mark-read");
  }
}
