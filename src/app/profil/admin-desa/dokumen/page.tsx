import { db } from "@/lib/db";
import AdminDesaDokumenClient from "@/components/admin-desa/AdminDesaDokumenClient";
import { requireAdminDesaContext } from "@/lib/admin-desa/require-context";
import { buildTemplateFieldEngineViewModel } from "@/lib/village-data/template-engine-view";
import {
  getDatabaseSchemaMismatchMessage,
  isDatabaseSchemaMismatchError,
} from "@/lib/db-connectivity";
import {
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_MAX_FILES_PER_UPLOAD,
  DEFAULT_ALLOWED_MIME_TYPES,
  getMaxFileSizeBytes,
  getMaxFilesPerUpload,
  getAllowedMimeTypes,
} from "@/lib/storage/upload-validation";
import { buildTemplateDocumentCategories } from "@/lib/admin-desa/document-categories";
import { getStorageConfigurationStatus } from "@/lib/storage/supabase-storage";
import { perfLog, perfLogWithRows, perfQueryShape, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

export default async function AdminDesaDokumenPage() {
  const ctx = await requireAdminDesaContext("admin-desa.dokumen");

  perfQueryShape(
    "admin-desa.dokumen",
    "adminDesaDocument.findMany",
    "where:desaId;orderBy:statusAsc,createdAtDesc;take:100;join:uploadedBy;select:listFields",
  );
  const tDocs = perfStart();
  const docResult = db
    ? await db.adminDesaDocument
        .findMany({
          where: { desaId: ctx.desa.id },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 100,
          select: {
            id: true,
            title: true,
            category: true,
            inputMode: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            sourceTypeCode: true,
            sourceUrl: true,
            structuredValuesJson: true,
            status: true,
            approvedAt: true,
            publishedAt: true,
            failedReason: true,
            rejectedReason: true,
            createdAt: true,
            uploadedById: true,
            uploadedBy: {
              select: { id: true, nama: true, username: true, email: true },
            },
          },
        })
        .then((docs) => ({ docs, schemaBlockedMessage: null as string | null }))
        .catch(async (error) => {
          if (!isDatabaseSchemaMismatchError(error)) throw error;

          const docs = await db.adminDesaDocument.findMany({
            where: { desaId: ctx.desa.id },
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
              uploadedById: true,
              uploadedBy: {
                select: { id: true, nama: true, username: true, email: true },
              },
            },
          });

          return {
            docs,
            schemaBlockedMessage: getDatabaseSchemaMismatchMessage("dokumen Admin Desa"),
          };
        })
    : { docs: [], schemaBlockedMessage: null };
  const { docs, schemaBlockedMessage } = docResult;
  // Sprint 04-008H: timing label is "dbQuery" — the timer includes the full Prisma call
  // (connection + query + response), not just DB execution.
  perfLogWithRows("admin-desa.dokumen", "dbQuery", docs.length, tDocs);

  const tSerialize = perfStart();
  const serialized = docs.map((d) => ({
    ...d,
    inputMode: "inputMode" in d && typeof d.inputMode === "string" ? d.inputMode : "DOCUMENT_UPLOAD",
    sourceTypeCode:
      "sourceTypeCode" in d && typeof d.sourceTypeCode === "string" ? d.sourceTypeCode : null,
    sourceUrl: "sourceUrl" in d && typeof d.sourceUrl === "string" ? d.sourceUrl : null,
    structuredValuesJson:
      "structuredValuesJson" in d &&
      typeof d.structuredValuesJson === "object" &&
      d.structuredValuesJson !== null &&
      !Array.isArray(d.structuredValuesJson)
        ? (d.structuredValuesJson as Record<string, unknown>)
        : null,
    createdAt: d.createdAt.toISOString(),
    approvedAt: d.approvedAt?.toISOString() ?? null,
    publishedAt: d.publishedAt?.toISOString() ?? null,
  }));
  perfLog("admin-desa.dokumen", "serializeRows", tSerialize);

  const storage = getStorageConfigurationStatus();
  const structuredTemplate = await buildTemplateFieldEngineViewModel(ctx.desa.id);
  const storageOk = storage.configured;
  const maxBytes = storageOk ? getMaxFileSizeBytes() : DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024;
  const maxFiles = storageOk ? getMaxFilesPerUpload() : DEFAULT_MAX_FILES_PER_UPLOAD;
  const allowedMime = storageOk ? getAllowedMimeTypes() : [...DEFAULT_ALLOWED_MIME_TYPES];
  const categories = buildTemplateDocumentCategories(structuredTemplate);

  return (
    <AdminDesaDokumenClient
      currentUserId={ctx.user.id}
      memberStatus={ctx.member.status}
      memberRole={ctx.member.role}
      documents={serialized}
      categories={categories}
      maxFileSizeMB={Math.round(maxBytes / (1024 * 1024))}
      maxFilesPerUpload={maxFiles}
      allowedMimeTypes={allowedMime}
      storageStatus={storage}
      structuredTemplate={structuredTemplate}
      schemaBlockedMessage={schemaBlockedMessage}
    />
  );
}
