import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { getDesaVersionHistoryViaSupabase } from "@/lib/internal-admin/supabase-fallback";
import {
  getChangedVersionFields,
  normalizeVersionSnapshot,
} from "@/lib/versioning/desa-versioning";
import { listPublishedVillageDataVersions } from "@/lib/versioning/village-data-persistence";

function getVersionNumber(metadata: unknown, fallback: number) {
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "versionNumber" in metadata &&
    typeof (metadata as { versionNumber?: unknown }).versionNumber === "number"
  ) {
    return (metadata as { versionNumber: number }).versionNumber;
  }

  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const desaId = req.nextUrl.searchParams.get("desaId")?.trim();
    if (!desaId) {
      return NextResponse.json({ error: "desaId wajib diisi." }, { status: 400 });
    }

    if (!db) {
      const fallback = await getDesaVersionHistoryViaSupabase(desaId);
      if (!fallback) {
        return NextResponse.json({ error: "Desa tidak ditemukan." }, { status: 404 });
      }

      return NextResponse.json({
        storage: fallback.storage,
        desa: {
          ...fallback.desa,
          dataPublishedAt: fallback.desa.dataPublishedAt ?? null,
        },
        versions: fallback.audits.map((audit, index) => {
          const beforeSnapshot = normalizeVersionSnapshot(audit.beforeSnapshotJson);
          const afterSnapshot = normalizeVersionSnapshot(audit.afterSnapshotJson);
          const changedFields = getChangedVersionFields({
            before: beforeSnapshot,
            after: afterSnapshot,
          });

          return {
            id: audit.id,
            documentId: audit.entityId ?? null,
            versionNumber: getVersionNumber(audit.metadata, fallback.audits.length - index),
            reasonText: audit.reasonText ?? null,
            createdAt: audit.createdAt,
            changedFields,
            beforeSnapshot,
            afterSnapshot,
            title:
              typeof audit.metadata === "object" &&
              audit.metadata !== null &&
              "title" in audit.metadata &&
              typeof (audit.metadata as { title?: unknown }).title === "string"
                ? (audit.metadata as { title: string }).title
                : "Publikasi data desa",
          };
        }),
      });
    }

    let desa;
    try {
      desa = await db.desa.findUnique({
        where: { id: desaId },
        select: {
          id: true,
          nama: true,
          kabupaten: true,
          dataPublishedAt: true,
          dataSourceLabel: true,
        },
      });
    } catch (error) {
      if (!isDatabaseConnectivityError(error)) throw error;
      const fallback = await getDesaVersionHistoryViaSupabase(desaId);
      if (!fallback) {
        return NextResponse.json({ error: "Desa tidak ditemukan." }, { status: 404 });
      }

      return NextResponse.json({
        storage: fallback.storage,
        desa: {
          ...fallback.desa,
          dataPublishedAt: fallback.desa.dataPublishedAt ?? null,
        },
        versions: fallback.audits.map((audit, index) => {
          const beforeSnapshot = normalizeVersionSnapshot(audit.beforeSnapshotJson);
          const afterSnapshot = normalizeVersionSnapshot(audit.afterSnapshotJson);
          const changedFields = getChangedVersionFields({
            before: beforeSnapshot,
            after: afterSnapshot,
          });

          return {
            id: audit.id,
            documentId: audit.entityId ?? null,
            versionNumber: getVersionNumber(audit.metadata, fallback.audits.length - index),
            reasonText: audit.reasonText ?? null,
            createdAt: audit.createdAt,
            changedFields,
            beforeSnapshot,
            afterSnapshot,
            title:
              typeof audit.metadata === "object" &&
              audit.metadata !== null &&
              "title" in audit.metadata &&
              typeof (audit.metadata as { title?: unknown }).title === "string"
                ? (audit.metadata as { title: string }).title
                : "Publikasi data desa",
          };
        }),
      });
    }

    if (!desa) {
      return NextResponse.json({ error: "Desa tidak ditemukan." }, { status: 404 });
    }

    const persistedVersions = await listPublishedVillageDataVersions({ desaId, limit: 10 });
    if (persistedVersions.available && persistedVersions.versions.length > 0) {
      return NextResponse.json({
        storage: {
          mode: "dedicated",
          dedicatedTableActive: true,
          note: "Riwayat versi dibaca dari tabel VillageDataVersion yang sudah aktif.",
        },
        desa: {
          ...desa,
          dataPublishedAt: desa.dataPublishedAt?.toISOString() ?? null,
        },
        versions: persistedVersions.versions.map((version) => ({
          id: version.id,
          documentId: version.sourceDocumentId,
          versionNumber: version.versionNumber,
          reasonText: version.reviewNote,
          createdAt: version.publishedAt ?? version.createdAt,
          changedFields: version.changedFields,
          beforeSnapshot: version.beforeSnapshot,
          afterSnapshot:
            Object.keys(version.publishedSnapshot).length > 0
              ? version.publishedSnapshot
              : version.proposedSnapshot,
          title: version.title,
        })),
      });
    }

    const audits = await db.adminClaimAudit.findMany({
      where: {
        desaId,
        eventType: "INTERNAL_DATA_PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        entityId: true,
        actorUserId: true,
        eventType: true,
        reasonText: true,
        beforeSnapshotJson: true,
        afterSnapshotJson: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      storage: {
        mode: "audit_fallback",
        dedicatedTableActive: false,
        note:
          "Tabel VillageDataVersion belum aktif di database ini. Riwayat versi masih dibaca dari snapshot audit publish yang lama.",
      },
      desa: {
        ...desa,
        dataPublishedAt: desa.dataPublishedAt?.toISOString() ?? null,
      },
      versions: audits.map((audit, index) => {
        const beforeSnapshot = normalizeVersionSnapshot(audit.beforeSnapshotJson);
        const afterSnapshot = normalizeVersionSnapshot(audit.afterSnapshotJson);
        const changedFields = getChangedVersionFields({
          before: beforeSnapshot,
          after: afterSnapshot,
        });

        return {
          id: audit.id,
          documentId: audit.entityId ?? null,
          versionNumber: getVersionNumber(audit.metadata, audits.length - index),
          reasonText: audit.reasonText ?? null,
          createdAt: audit.createdAt.toISOString(),
          changedFields,
          beforeSnapshot,
          afterSnapshot,
          title:
            typeof audit.metadata === "object" &&
            audit.metadata !== null &&
            "title" in audit.metadata &&
            typeof (audit.metadata as { title?: unknown }).title === "string"
              ? (audit.metadata as { title: string }).title
              : "Publikasi data desa",
        };
      }),
    });
  } catch (err) {
    return handleApiError(err, "GET /api/internal-admin/desa-version-history");
  }
}
