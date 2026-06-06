import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";

const ALLOWED = ["WAITING_VERIFIED_APPROVAL", "PROCESSING", "PUBLISHED", "REJECTED", "FAILED"] as const;
type DocStatus = typeof ALLOWED[number];

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    const status = req.nextUrl.searchParams.get("status");
    const desaId = req.nextUrl.searchParams.get("desaId");

    const where = {
      ...(status && (ALLOWED as readonly string[]).includes(status)
        ? { status: status as DocStatus }
        : {}),
      ...(desaId ? { desaId } : {}),
    };

    const docs = await db.adminDesaDocument.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        storageKey: true,
        status: true,
        approvedAt: true,
        publishedAt: true,
        failedReason: true,
        rejectedReason: true,
        aiMappingStatus: true,
        aiMappingResult: true,
        createdAt: true,
        updatedAt: true,
        desa: { select: { id: true, nama: true, kecamatan: true, kabupaten: true } },
        uploadedBy: { select: { id: true, nama: true, username: true, email: true } },
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
    });
  } catch (err) {
    return handleApiError(err, "GET /api/internal-admin/documents");
  }
}
