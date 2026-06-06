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
  isValidCategory,
} from "@/lib/storage/upload-validation";

/**
 * POST /api/public/contribute
 *
 * PUBLIC (no auth) document contribution to help complete a desa's data.
 *
 * This intentionally relaxes the "only Admin Desa may upload" rule — BUT the
 * contribution NEVER auto-publishes: it lands in the internal-admin review queue
 * as an AdminDesaDocument with status=PROCESSING and is clearly flagged as a
 * public contribution (sourceTypeCode=PUBLIC_CONTRIBUTION). An internal reviewer
 * must approve + map it before anything appears on the public profile.
 *
 * multipart/form-data fields:
 *   desaId               — target desa (Prisma id)
 *   category             — DocumentCategory (PROFIL_DESA, LAPORAN_PUBLIKASI, ...)
 *   title                — short description of what the document contains
 *   note                 — (optional) extra context from the contributor
 *   contributorName      — (optional) so reviewers can credit / follow up
 *   contributorContact   — (optional) email/phone for follow-up
 *   responsibilityAck    — "true" required: contributor affirms the file is genuine
 *   files                — 1..MAX files
 */

// Lightweight in-memory per-IP throttle. Best-effort abuse guard for a public
// write endpoint (per server instance; not a substitute for a real limiter).
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 5; // max submissions per IP per window
const rateBuckets = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Layanan penyimpanan belum siap" }, { status: 503 });
    }

    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        { error: "Terlalu banyak kiriman. Coba lagi beberapa menit lagi.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }

    const storageStatus = getStorageConfigurationStatus();
    if (!storageStatus.configured) {
      return NextResponse.json(
        {
          error: getStorageConfigurationErrorMessage(storageStatus),
          code: "STORAGE_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const desaId = str(form, "desaId");
    const category = str(form, "category");
    const title = str(form, "title");
    const note = str(form, "note").slice(0, 500);
    const contributorName = str(form, "contributorName").slice(0, 120);
    const contributorContact = str(form, "contributorContact").slice(0, 160);
    const ack = str(form, "responsibilityAck");

    if (!desaId) return NextResponse.json({ error: "desaId wajib diisi" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Judul/keterangan dokumen wajib diisi" }, { status: 400 });
    if (title.length > 200) return NextResponse.json({ error: "Judul terlalu panjang (maks 200 karakter)" }, { status: 400 });
    if (!category || !isValidCategory(category)) {
      return NextResponse.json({ error: "Kategori dokumen tidak valid" }, { status: 400 });
    }
    if (ack !== "true") {
      return NextResponse.json(
        { error: "Pernyataan keaslian dokumen wajib dicentang.", code: "RESPONSIBILITY_REQUIRED" },
        { status: 400 },
      );
    }

    // Resolve desa (accept id or slug for resilience).
    const desa = await db.desa.findFirst({
      where: { OR: [{ id: desaId }, { slug: desaId }] },
      select: { id: true, nama: true },
    });
    if (!desa) return NextResponse.json({ error: "Desa tidak ditemukan" }, { status: 404 });

    const rawFiles = form.getAll("files");
    const files = rawFiles.filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "Minimal satu file wajib dipilih." }, { status: 400 });
    }
    const maxFiles = getMaxFilesPerUpload();
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maksimal ${maxFiles} file per kiriman.`, code: "TOO_MANY_FILES" },
        { status: 400 },
      );
    }
    for (const file of files) {
      const validation = validateUpload(file);
      if (!validation.ok) {
        return NextResponse.json({ error: `${file.name}: ${validation.message}`, code: validation.code }, { status: 400 });
      }
    }

    // Optionally attribute to a logged-in (non-admin) user, but auth is NOT required.
    const session = await auth().catch(() => null);
    const uploadedById = session?.user?.id ?? null;

    const multi = files.length > 1;
    const uploaded: Array<{ id: string; title: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const normalizedFileType = normalizeUploadMimeType(file.name, file.type);
      const docTitle = multi ? `${title} (${i + 1}/${files.length})` : title;
      const documentId = `pub_${randomBytes(12).toString("hex")}`;
      const storageKey = buildDocumentStoragePath(desa.id, documentId, file.name);
      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        await uploadDocumentBuffer(storageKey, buffer, normalizedFileType);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[public-contribute] upload failed", { storageKey, desaId: desa.id, message: msg });
        return NextResponse.json(
          { error: `Gagal mengunggah "${file.name}". Coba lagi atau hubungi admin.`, code: "UPLOAD_FAILED", uploadedSoFar: uploaded.length },
          { status: 502 },
        );
      }

      const doc = await db.adminDesaDocument.create({
        data: {
          id: documentId,
          desaId: desa.id,
          uploadedById,
          title: docTitle,
          category,
          inputMode: "DOCUMENT_UPLOAD",
          storageKey,
          fileName: file.name.slice(0, 200),
          fileType: normalizedFileType,
          fileSize: file.size,
          // Enters the internal-admin review queue; never auto-published.
          status: "PROCESSING",
          sourceTypeCode: "PUBLIC_CONTRIBUTION",
          sourceEvidenceJson: {
            uploadChannel: "public_visitor",
            contributorName: contributorName || null,
            contributorContact: contributorContact || null,
            note: note || null,
            attributedUserId: uploadedById,
          } as unknown as Prisma.InputJsonObject,
          aiMappingStatus: null,
        },
        select: { id: true, title: true },
      });

      await writeAuditEvent({
        eventType: AUDIT_EVENT.INTERNAL_INTAKE_SUBMITTED,
        desaId: desa.id,
        actorUserId: uploadedById ?? undefined,
        actorRole: "PUBLIC_CONTRIBUTOR",
        entityType: "AdminDesaDocument",
        entityId: doc.id,
        nextStatus: "PROCESSING",
        metadata: {
          title: docTitle,
          category,
          fileName: file.name,
          fileSize: file.size,
          desaName: desa.nama,
          channel: "public_contribution",
          contributorName: contributorName || null,
        },
      });

      uploaded.push({ id: doc.id, title: doc.title });
    }

    return NextResponse.json({
      ok: true,
      count: uploaded.length,
      message:
        "Terima kasih! Dokumen kamu masuk antrian peninjauan tim PantauDesa dan tidak langsung tampil. " +
        "Setelah diverifikasi, datanya akan melengkapi profil desa ini.",
    });
  } catch (err) {
    return handleApiError(err, "POST /api/public/contribute");
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
