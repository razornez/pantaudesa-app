import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import {
  uploadDocumentBuffer,
  buildDocumentStoragePath,
  getStorageConfigurationErrorMessage,
  getStorageConfigurationStatus,
} from "@/lib/storage/supabase-storage";
import {
  validateUpload,
  getMaxFilesPerUpload,
  normalizeUploadMimeType,
} from "@/lib/storage/upload-validation";
import { isValidTemplateDocumentCategory } from "@/lib/admin-desa/document-categories";
import { createNotifications, NOTIF_TYPE } from "@/lib/notifications/create-notification";
import {
  getUploadedDocumentInitialStatus,
} from "@/lib/admin-desa/policy";
import { parseAdminDesaUploadFields } from "@/lib/admin-desa/validation";
import { buildDocumentPipelineSnapshotFromBuffer } from "@/lib/internal-admin/document-pipeline-snapshot";
import {
  createTemplateFieldEngineSnapshot,
  resolveEffectiveTemplateFieldEngine,
} from "@/lib/village-data/field-engine";

// POST /api/admin-claim/documents/upload
// multipart/form-data fields:
//   files: File[]     — 1 to MAX_FILES_PER_UPLOAD files (env: ADMIN_DESA_DOCUMENT_MAX_FILES_PER_UPLOAD, default 5)
//   title: string     — shared title prefix; each file gets " (N/M)" appended when N > 1
//   category: DocumentCategory
//   responsibilityAck: "true" — required acknowledgment
//
// Status flow:
//   uploader is LIMITED  → AdminDesaDocument.status = WAITING_VERIFIED_APPROVAL
//   uploader is VERIFIED → AdminDesaDocument.status = PROCESSING
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

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const { title, category, responsibilityAck: ack } = parseAdminDesaUploadFields(form);

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (title.length > 200) return NextResponse.json({ error: "title too long (max 200 chars)" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });
    if (ack !== "true") {
      return NextResponse.json({
        error: "Pernyataan tanggung jawab wajib dicentang sebelum unggah.",
        code: "RESPONSIBILITY_REQUIRED",
      }, { status: 400 });
    }

    // Collect all files from `files` field (multi-value) plus legacy single `file` field.
    const rawFiles = form.getAll("files");
    const legacyFile = form.get("file");
    if (legacyFile instanceof File && !rawFiles.includes(legacyFile)) rawFiles.push(legacyFile);
    const files = rawFiles.filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "Minimal satu file wajib dipilih." }, { status: 400 });
    }

    const maxFiles = getMaxFilesPerUpload();
    if (files.length > maxFiles) {
      return NextResponse.json({
        error: `Maksimal ${maxFiles} file per unggah. Kamu memilih ${files.length} file.`,
        code: "TOO_MANY_FILES",
      }, { status: 400 });
    }

    // Validate each file before touching storage.
    for (const file of files) {
      const validation = validateUpload(file);
      if (!validation.ok) {
        return NextResponse.json({
          error: `${file.name}: ${validation.message}`,
          code: validation.code,
        }, { status: 400 });
      }
    }

    // Caller must be an active LIMITED or VERIFIED member of some desa.
    const member = await db.desaAdminMember.findFirst({
      where: { userId, status: { in: ["LIMITED", "VERIFIED"] } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        desaId: true,
        status: true,
        role: true,
        desa: { select: { nama: true } },
      },
    });

    if (!member) {
      return NextResponse.json({
        error: "Hanya Admin Desa yang dapat mengunggah dokumen.",
        code: "NOT_ADMIN_DESA",
      }, { status: 403 });
    }

    const status = getUploadedDocumentInitialStatus(
      member.status as "LIMITED" | "VERIFIED",
    );
    const templateEngine = await resolveEffectiveTemplateFieldEngine(member.desaId);
    if (
      !isValidTemplateDocumentCategory(category, {
        visibleComponents: templateEngine.resolvedTemplate.visibleComponents,
      })
    ) {
      return NextResponse.json({
        error: "Kategori dokumen tidak tersedia di template aktif desa.",
        code: "INVALID_TEMPLATE_CATEGORY",
      }, { status: 400 });
    }
    const multi = files.length > 1;
    const uploaded: Array<{ id: string; title: string; status: string; createdAt: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const normalizedFileType = normalizeUploadMimeType(file.name, file.type);
      const docTitle = multi ? `${title} (${i + 1}/${files.length})` : title;
      const documentId = `doc_${randomBytes(12).toString("hex")}`;
      const storageKey = buildDocumentStoragePath(member.desaId, documentId, file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      const snapshot = await buildDocumentPipelineSnapshotFromBuffer({
        desaId: member.desaId,
        fileName: file.name,
        fileType: normalizedFileType,
        fileSize: file.size,
        buffer,
      });

      try {
        await uploadDocumentBuffer(storageKey, buffer, normalizedFileType);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Safe server-side log: no env values, just enough to debug.
        console.error("[upload] Supabase upload failed", {
          storageKey,
          fileName: file.name,
          fileType: normalizedFileType,
          fileSize: file.size,
          desaId: member.desaId,
          message: msg,
        });
        // If this is a config error, return the proper code so the UI can show
        // the "storage tidak terkonfigurasi" message instead of a generic failure.
        const code = msg.includes("not set") || msg.includes("not configured")
          ? "STORAGE_NOT_CONFIGURED"
          : "UPLOAD_FAILED";
        const status = code === "STORAGE_NOT_CONFIGURED" ? 503 : 502;
        const userMsg = code === "STORAGE_NOT_CONFIGURED"
          ? "Storage tidak terkonfigurasi. Hubungi admin PantauDesa."
          : `Gagal mengunggah file "${file.name}" ke storage. Pastikan konfigurasi storage sudah aktif atau hubungi admin PantauDesa.`;
        return NextResponse.json({
          error: userMsg,
          detail: msg,
          code,
          uploadedSoFar: uploaded.length,
        }, { status });
      }

      const doc = await db.adminDesaDocument.create({
        data: {
          id: documentId,
          desaId: member.desaId,
          uploadedById: userId,
          title: docTitle,
          category,
          inputMode: "DOCUMENT_UPLOAD",
          storageKey,
          fileName: file.name.slice(0, 200),
          fileType: normalizedFileType,
          fileSize: file.size,
          status,
          sourceTypeCode: "DOCUMENT_UPLOAD",
          sourceEvidenceJson: {
            uploadChannel: "admin_desa_document_upload",
            uploaderRole: member.role,
            templateSnapshot: createTemplateFieldEngineSnapshot(templateEngine),
          } as unknown as Prisma.InputJsonObject,
          aiMappingStatus: snapshot.aiMappingStatus,
          aiMappingResult: snapshot.pipelineJson,
        },
        select: { id: true, status: true, createdAt: true, title: true },
      });

      await writeAuditEvent({
        eventType: AUDIT_EVENT.DOCUMENT_APPROVED_BY_VERIFIED,
        desaId: member.desaId,
        actorUserId: userId,
        actorRole: member.role,
        entityType: "AdminDesaDocument",
        entityId: doc.id,
        nextStatus: status,
        metadata: {
          title: docTitle,
          category,
          fileName: file.name,
          fileSize: file.size,
          fileType: normalizedFileType,
          desaName: member.desa.nama,
          action: "uploaded",
          batchIndex: i + 1,
          batchTotal: files.length,
        },
      });

      uploaded.push({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
      });
    }

    // Notify VERIFIED admins of this desa when LIMITED uploads (needs their approval).
    if (status === "WAITING_VERIFIED_APPROVAL" && db) {
      const verifiedAdmins = await db.desaAdminMember.findMany({
        where: { desaId: member.desaId, status: "VERIFIED", role: "VERIFIED_ADMIN" },
        select: { userId: true },
      });
      const fileLabel = files.length > 1 ? `${files.length} dokumen baru` : `"${title}"`;
      await createNotifications(
        verifiedAdmins.map((a) => ({
          userId: a.userId,
          type: NOTIF_TYPE.DOCUMENT_UPLOADED_WAITING,
          title: "Dokumen baru menunggu persetujuan",
          body: `${fileLabel} telah diunggah oleh Admin LIMITED dan membutuhkan persetujuan kamu sebelum diproses.`,
          desaId: member.desaId,
          metadata: { uploadedById: userId, fileCount: files.length },
        })),
      );
    }

    return NextResponse.json({
      ok: true,
      documents: uploaded,
      message: status === "PROCESSING"
        ? `${files.length} dokumen berhasil diunggah dan masuk ke tahap PROCESSING.`
        : `${files.length} dokumen berhasil diunggah dan menunggu persetujuan Admin Desa VERIFIED.`,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/documents/upload");
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
