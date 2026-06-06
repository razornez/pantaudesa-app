import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";

const PAGE_SIZE = 20;

const DOC_STATUS_LABEL: Record<string, string> = {
  PROCESSING:                 "Dokumen disubmit ke review",
  PUBLISHED:                  "Data diterbitkan dari dokumen",
  REJECTED:                   "Dokumen ditolak oleh admin verified",
  FAILED:                     "Dokumen gagal diproses",
  WAITING_VERIFIED_APPROVAL:  "Menunggu persetujuan",
};

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const sp = req.nextUrl.searchParams;
    const desaId   = sp.get("desaId")?.trim()   ?? "";
    const q        = sp.get("q")?.trim()         ?? "";
    const provinsi = sp.get("provinsi")?.trim()  ?? "";
    const kabupaten= sp.get("kabupaten")?.trim() ?? "";
    const kecamatan= sp.get("kecamatan")?.trim() ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const skip = (page - 1) * PAGE_SIZE;

    if (!db) {
      return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
    }

    // Build shared desa filter (by ID takes priority, then text filters)
    const hasTextFilter = !!(q || provinsi || kabupaten || kecamatan);
    const desaRelationFilter = hasTextFilter ? {
      ...(q ? { OR: [
        { nama:      { contains: q, mode: "insensitive" as const } },
        { kecamatan: { contains: q, mode: "insensitive" as const } },
        { kabupaten: { contains: q, mode: "insensitive" as const } },
      ]} : {}),
      ...(provinsi  ? { provinsi:  { equals: provinsi,  mode: "insensitive" as const } } : {}),
      ...(kabupaten ? { kabupaten: { equals: kabupaten, mode: "insensitive" as const } } : {}),
      ...(kecamatan ? { kecamatan: { equals: kecamatan, mode: "insensitive" as const } } : {}),
    } : null;

    const versionWhere = desaId
      ? { desaId }
      : desaRelationFilter ? { desa: desaRelationFilter }
      : undefined;

    const auditWhere = desaId
      ? { desaId }
      : desaRelationFilter ? { desa: desaRelationFilter }
      : undefined;

    const docWhere = desaId
      ? { desaId }
      : desaRelationFilter ? { desa: desaRelationFilter }
      : undefined;

    try {
      // Fetch versions and audit events independently so one failure doesn't block the other
      const [versions, total] = await Promise.all([
        db.villageDataVersion.findMany({
          where: versionWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: PAGE_SIZE,
          select: {
            id: true,
            desaId: true,
            versionNumber: true,
            status: true,
            title: true,
            sourceLabel: true,
            changedFields: true,
            reviewNote: true,
            publishedAt: true,
            createdAt: true,
            desa: { select: { nama: true, kecamatan: true, kabupaten: true } },
          },
        }),
        db.villageDataVersion.count({ where: versionWhere }),
      ]);

      // Fetch audit events — fall back to AdminDesaDocument records when empty
      let auditEvents: Array<{
        id: string; desaId: string; eventType: string; eventLabel: string | null;
        actorRole: string | null; note: string | null; createdAt: string;
        desa: { nama: string };
      }> = [];

      try {
        const dedicatedEvents = await db.desaDataAuditEvent.findMany({
          where: auditWhere,
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            desaId: true,
            eventType: true,
            eventLabel: true,
            actorRole: true,
            note: true,
            createdAt: true,
            desa: { select: { nama: true } },
          },
        });

        if (dedicatedEvents.length > 0) {
          auditEvents = dedicatedEvents.map(e => ({
            ...e,
            createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
          }));
        } else {
          // Fallback: surface AdminDesaDocument submissions as activity events
          const docs = await db.adminDesaDocument.findMany({
            where: docWhere,
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
              id: true,
              desaId: true,
              status: true,
              title: true,
              createdAt: true,
              desa: { select: { nama: true } },
            },
          });
          auditEvents = docs.map(doc => ({
            id: doc.id,
            desaId: doc.desaId,
            eventType: doc.status,
            eventLabel: DOC_STATUS_LABEL[doc.status] ?? doc.status,
            actorRole: null,
            note: doc.title,
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
            desa: { nama: doc.desa.nama },
          }));
        }
      } catch {
        // DesaDataAuditEvent table may not exist yet — skip audit events
      }

      return NextResponse.json({ versions, total, page, pageSize: PAGE_SIZE, auditEvents });
    } catch (error) {
      if (!isDatabaseConnectivityError(error)) throw error;
      return NextResponse.json({ error: "Database tidak tersedia sementara." }, { status: 503 });
    }
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/village-data/versions");
  }
}
