import { db } from "@/lib/db";
import {
  getDatabaseUnavailableMessage,
  isDatabaseConnectivityError,
} from "@/lib/db-connectivity";
import { listInternalDocumentsViaSupabase } from "@/lib/internal-admin/supabase-fallback";
import {
  INTERNAL_DOCUMENT_QUEUE_PAGE_SIZE,
} from "./constants";
import type { InternalDocumentStatus } from "./page-params";

export interface InternalDocumentQueueItem {
  id: string;
  title: string;
  category: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: InternalDocumentStatus;
  approvedAt: string | null;
  publishedAt: string | null;
  failedReason: string | null;
  rejectedReason: string | null;
  aiMappingStatus: string | null;
  aiMappingResult?: unknown;
  /** "PUBLIC_CONTRIBUTION" marks an upload from a public visitor (not an Admin Desa). */
  sourceTypeCode?: string | null;
  createdAt: string;
  updatedAt: string;
  desa: { id: string; nama: string; kecamatan: string; kabupaten: string };
  uploadedBy: { id: string; nama: string | null; username: string | null; email: string } | null;
}

export async function loadInternalDocumentQueue(
  filter: InternalDocumentStatus | null,
): Promise<
  | { kind: "data"; documents: InternalDocumentQueueItem[] }
  | { kind: "unavailable"; message: string }
> {
  if (!db) {
    try {
      return {
        kind: "data",
        documents: await listInternalDocumentsViaSupabase(filter),
      };
    } catch {
      return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
    }
  }

  try {
    const docs = await db.adminDesaDocument.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: INTERNAL_DOCUMENT_QUEUE_PAGE_SIZE,
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
        aiMappingStatus: true,
        aiMappingResult: true,
        sourceTypeCode: true,
        createdAt: true,
        updatedAt: true,
        desa: { select: { id: true, nama: true, kecamatan: true, kabupaten: true } },
        uploadedBy: { select: { id: true, nama: true, username: true, email: true } },
      },
    });

    return {
      kind: "data",
      documents: docs.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        approvedAt: document.approvedAt?.toISOString() ?? null,
        publishedAt: document.publishedAt?.toISOString() ?? null,
      })),
    };
  } catch (error) {
    if (!isDatabaseConnectivityError(error)) throw error;

    try {
      return {
        kind: "data",
        documents: await listInternalDocumentsViaSupabase(filter),
      };
    } catch {
      return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
    }
  }
}
