import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import { db } from "@/lib/db";
import { invalidateTemplateCache } from "@/lib/village-data/template-resolver";

export async function POST(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const body = await req.json() as { desaId?: string; componentId?: string; isVisible?: boolean; reason?: string };
    const { desaId, componentId, isVisible, reason } = body;

    if (!desaId || !componentId || typeof isVisible !== "boolean") {
      return NextResponse.json({ error: "desaId, componentId, and isVisible are required." }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available." }, { status: 503 });
    }

    try {
      const component = await db.villageDetailComponent.findUnique({
        where: { id: componentId },
        select: { id: true, templateId: true },
      });

      if (!component) {
        return NextResponse.json(
          { ok: false, message: "Komponen tidak ditemukan. Jalankan migrasi dan seed terlebih dahulu." },
          { status: 404 }
        );
      }

      const row = await db.desaDetailComponentVisibility.upsert({
        where: { desaId_componentId: { desaId, componentId } },
        create: {
          desaId,
          templateId: component.templateId,
          componentId,
          isVisible,
          reason: reason ?? null,
        },
        update: {
          isVisible,
          reason: reason ?? null,
        },
        select: { desaId: true, componentId: true, isVisible: true },
      });

      invalidateTemplateCache(desaId);
      return NextResponse.json({ ok: true, visibility: row });
    } catch {
      // Tables don't exist yet (pre-migration)
      return NextResponse.json(
        { ok: false, message: "Tabel visibilitas belum tersedia. Jalankan migrasi schema terlebih dahulu." },
        { status: 503 }
      );
    }
  } catch (error) {
    return handleApiError(error, "POST /api/internal-admin/village-data/component-visibility");
  }
}
