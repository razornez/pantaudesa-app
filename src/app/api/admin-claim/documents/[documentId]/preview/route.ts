import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import {
  createDocumentSignedUrl,
  getStorageConfigurationErrorMessage,
  getStorageConfigurationStatus,
  StorageObjectNotFoundError,
} from "@/lib/storage/supabase-storage";
import { isInternalAdmin } from "@/lib/auth/internal-admin";

// GET /api/admin-claim/documents/:documentId/preview
// Server-side issues a short-lived signed URL for the private storage object.
// Authorized callers:
//   - active LIMITED/VERIFIED member of the document's desa
//   - INTERNAL_ADMIN
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    const storageStatus = getStorageConfigurationStatus();
    if (!storageStatus.configured) {
      return NextResponse.json({
        error: getStorageConfigurationErrorMessage(storageStatus),
        code: "STORAGE_NOT_CONFIGURED",
        bucket: storageStatus.bucket,
        missingEnvVars: storageStatus.missingEnvVars,
        invalidEnvVars: storageStatus.invalidEnvVars,
      }, { status: 503 });
    }

    const doc = await db.adminDesaDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        desaId: true,
        storageKey: true,
        fileType: true,
        fileName: true,
      },
    });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!doc.storageKey) {
      return NextResponse.json({
        error: "Dokumen ini tidak memiliki lampiran file untuk dipreview.",
      }, { status: 422 });
    }

    // Authorization: same-desa active admin OR internal admin
    const isAdminPlatform = await isInternalAdmin(userId);
    let authorized = isAdminPlatform;
    if (!authorized) {
      const member = await db.desaAdminMember.findFirst({
        where: {
          userId,
          desaId: doc.desaId,
          status: { in: ["LIMITED", "VERIFIED"] },
        },
        select: { id: true },
      });
      authorized = Boolean(member);
    }
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let signedUrl: string;
    try {
      signedUrl = await createDocumentSignedUrl(doc.storageKey);
    } catch (e) {
      if (e instanceof StorageObjectNotFoundError) {
        return NextResponse.json({
          error: "File dokumen ini tidak ditemukan di storage. Arsipnya tercatat di sistem, tetapi berkas fisiknya tidak tersedia. Silakan unggah ulang dokumen ini.",
          code: "STORAGE_OBJECT_MISSING",
        }, { status: 404 });
      }
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({
        error: `Gagal membuat tautan preview: ${msg}`,
        code: "PREVIEW_URL_FAILED",
      }, { status: 502 });
    }

    // Audit preview/access (non-blocking)
    await writeAuditEvent({
      eventType: AUDIT_EVENT.INTERNAL_DOCUMENT_REVIEWED,
      desaId: doc.desaId,
      actorUserId: userId,
      actorRole: isAdminPlatform ? "INTERNAL_ADMIN" : "ADMIN_DESA",
      entityType: "AdminDesaDocument",
      entityId: doc.id,
      metadata: {
        action: "preview-url-issued",
        fileName: doc.fileName,
        fileType: doc.fileType,
      },
    });

    return NextResponse.json({
      ok: true,
      signedUrl,
      fileName: doc.fileName,
      fileType: doc.fileType,
    });
  } catch (err) {
    return handleApiError(err, `GET /api/admin-claim/documents/${documentId}/preview`);
  }
}
