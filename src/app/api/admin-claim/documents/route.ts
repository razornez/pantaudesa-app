import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

// GET /api/admin-claim/documents
// Lists documents for the current admin's desa.
// Caller must be active LIMITED or VERIFIED member.
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

    const member = await db.desaAdminMember.findFirst({
      where: { userId, status: { in: ["LIMITED", "VERIFIED"] } },
      orderBy: { updatedAt: "desc" },
      select: { desaId: true, status: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Hanya Admin Desa yang dapat melihat dokumen." }, { status: 403 });
    }

    const docs = await db.adminDesaDocument.findMany({
      where: { desaId: member.desaId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        approvedAt: true,
        publishedAt: true,
        failedReason: true,
        rejectedReason: true,
        createdAt: true,
        updatedAt: true,
        uploadedById: true,
        uploadedBy: {
          select: { id: true, nama: true, username: true, email: true },
        },
        approvedById: true,
      },
    });

    return NextResponse.json({
      documents: docs.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        approvedAt: d.approvedAt?.toISOString() ?? null,
        publishedAt: d.publishedAt?.toISOString() ?? null,
      })),
      memberStatus: member.status,
    });
  } catch (err) {
    return handleApiError(err, "GET /api/admin-claim/documents");
  }
}
