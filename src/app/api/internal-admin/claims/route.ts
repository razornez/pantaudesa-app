import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";

const ALLOWED_STATUSES = ["PENDING", "IN_REVIEW", "REJECTED", "APPROVED"] as const;
const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const adminSession = await requireInternalAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const desaId = searchParams.get("desaId");

    const statusFilter = statusParam && ALLOWED_STATUSES.includes(statusParam as typeof ALLOWED_STATUSES[number])
      ? [statusParam as typeof ALLOWED_STATUSES[number]]
      : [...ALLOWED_STATUSES];

    const where = {
      status: { in: statusFilter },
      ...(desaId ? { desaId } : {}),
    };

    const [claims, total] = await Promise.all([
      db.desaAdminClaim.findMany({
        where,
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          method: true,
          officialEmail: true,
          websiteUrl: true,
          verifiedAt: true,
          rejectedAt: true,
          rejectionReason: true,
          rejectCategory: true,
          rejectReason: true,
          rejectInstructions: true,
          reapplyAllowedAt: true,
          fraudCooldownUntil: true,
          supportSubmittedAt: true,
          createdAt: true,
          updatedAt: true,
          desa: { select: { id: true, nama: true, kecamatan: true, kabupaten: true, websiteUrl: true } },
          user: { select: { id: true, nama: true, username: true, email: true } },
        },
      }),
      db.desaAdminClaim.count({ where }),
    ]);

    return NextResponse.json({
      claims,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    return handleApiError(err, "GET /api/internal-admin/claims");
  }
}
