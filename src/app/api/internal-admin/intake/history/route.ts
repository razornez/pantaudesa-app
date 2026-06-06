import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { getIntakeHistoryViaSupabase } from "@/lib/internal-admin/supabase-fallback";
import { listDesaDataAuditEventsForDocuments } from "@/lib/versioning/village-data-persistence";

const HISTORY_EVENT_TYPES = [
  "INTERNAL_INTAKE_SUBMITTED",
  "INTERNAL_AI_MAPPING_RUN",
  "INTERNAL_DOCUMENT_REVIEWED",
  "INTERNAL_DATA_PUBLISHED",
  "INTERNAL_DOCUMENT_FAILED",
] as const;

function describeEvent(eventType: string, metadata?: unknown) {
  switch (eventType) {
    case "INTERNAL_INTAKE_SUBMITTED":
      return "Disubmit ke review internal";
    case "INTERNAL_AI_MAPPING_RUN":
      return "Draft mapping disiapkan";
    case "INTERNAL_DOCUMENT_REVIEWED":
      return typeof metadata === "object" &&
        metadata !== null &&
        "action" in metadata &&
        (metadata as { action?: unknown }).action === "draft_saved"
          ? "Draft review disimpan"
          : "Review internal diperbarui";
    case "INTERNAL_DATA_PUBLISHED":
      return "Dipublikasikan ke data desa";
    case "INTERNAL_DOCUMENT_FAILED":
      return "Ditandai gagal";
    default:
      return eventType;
  }
}

export async function GET() {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json(await getIntakeHistoryViaSupabase());

    let submissions;
    try {
      submissions = await db.adminDesaDocument.findMany({
        where: { category: "intake_workbench" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          aiMappingStatus: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          failedReason: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          desa: { select: { id: true, nama: true, kabupaten: true } },
        },
      });
    } catch (error) {
      if (!isDatabaseConnectivityError(error)) throw error;
      return NextResponse.json(await getIntakeHistoryViaSupabase());
    }

    const submissionIds = submissions.map((item) => item.id);

    const persistedActivity = await listDesaDataAuditEventsForDocuments({
      documentIds: submissionIds,
      limit: 12,
    });
    const activity =
      persistedActivity.available && persistedActivity.events.length > 0
        ? persistedActivity.events.map((item) => ({
            id: item.id,
            entityId: item.sourceDocumentId,
            eventType: item.eventType,
            nextStatus: item.nextStatus,
            reasonText: item.note,
            metadata: item.metadata,
            createdAt: new Date(item.createdAt),
            label: item.eventLabel,
          }))
        : submissionIds.length
      ? await db.adminClaimAudit.findMany({
          where: {
            entityType: "AdminDesaDocument",
            entityId: { in: submissionIds },
            eventType: { in: [...HISTORY_EVENT_TYPES] },
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            entityId: true,
            eventType: true,
            nextStatus: true,
            reasonText: true,
            metadata: true,
            createdAt: true,
            desaId: true,
          },
        })
      : [];

    const titleById = new Map(submissions.map((item) => [item.id, item.title]));
    const desaById = new Map(submissions.map((item) => [item.id, item.desa.nama]));

    return NextResponse.json({
      storage: persistedActivity.available
        ? {
            mode: "dedicated",
            dedicatedTableActive: true,
            note: "Aktivitas intake dibaca dari tabel DesaDataAuditEvent yang sudah aktif.",
          }
        : {
            mode: "audit_fallback",
            dedicatedTableActive: false,
            note:
              "Tabel DesaDataAuditEvent belum aktif di database ini. Aktivitas intake masih dibaca dari AdminClaimAudit.",
          },
      submissions: submissions.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        publishedAt: item.publishedAt?.toISOString() ?? null,
      })),
      activity: activity.map((item) => ({
        id: item.id,
        documentId: item.entityId,
        title: item.entityId ? titleById.get(item.entityId) ?? "Dokumen intake" : "Dokumen intake",
        desaName: item.entityId ? desaById.get(item.entityId) ?? "Desa" : "Desa",
        eventType: item.eventType,
        label:
          "label" in item && typeof item.label === "string" && item.label
            ? item.label
            : describeEvent(item.eventType, item.metadata),
        nextStatus: item.nextStatus ?? null,
        reasonText: item.reasonText ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err, "GET /api/internal-admin/intake/history");
  }
}
