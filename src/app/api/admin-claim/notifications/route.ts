import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

// GET /api/admin-claim/notifications
// Returns up to 50 most-recent in-app notifications for the current user.
// Caller must be authenticated; no admin-desa membership gate (notifications
// are per-user, not per-desa, so even a recently-expired admin can read them).
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const notifications = await db.adminDesaNotification.findMany({
      where: { userId, channel: "in_app" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        desaId: true,
        metadata: true,
      },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      })),
      unreadCount,
    });
  } catch (err) {
    return handleApiError(err, "GET /api/admin-claim/notifications");
  }
}
