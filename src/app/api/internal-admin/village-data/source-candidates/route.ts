import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { createSourceBackedReviewDocument } from "@/lib/internal-admin/review-candidate-submission";
import {
  createTemplateFieldEngineSnapshot,
  resolveEffectiveTemplateFieldEngine,
} from "@/lib/village-data/field-engine";
import { sanitizeTemplateFieldValues } from "@/lib/village-data/field-submission";
import { ensureSourceRegistryEntry } from "@/lib/village-data/source-registry";
import type { SourceTypeCode } from "@/lib/village-data/source-policy";
import { buildSourceBackedReviewTitle } from "@/lib/internal-admin/source-review-title";

const ALLOWED_SOURCE_TYPES: SourceTypeCode[] = [
  "GOVERNMENT_SOURCE",
  "PROVINCE_PARTNER",
  "OFFICIAL_WEBSITE",
  "TRUSTED_GOVERNANCE_SOURCE",
  "SOURCE_INGESTION",
];

function isSourceTypeCode(input: string): input is SourceTypeCode {
  return (ALLOWED_SOURCE_TYPES as string[]).includes(input);
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }

    const desaId = typeof body.desaId === "string" ? body.desaId.trim() : "";
    const requestedTitle = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const title = requestedTitle || buildSourceBackedReviewTitle();
    const category =
      typeof body.category === "string" ? body.category.trim().slice(0, 80) : "internal_source_entry";
    const sourceTypeCode = typeof body.sourceTypeCode === "string" ? body.sourceTypeCode.trim() : "";
    const sourceName = typeof body.sourceName === "string" ? body.sourceName.trim().slice(0, 180) : "";
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim().slice(0, 500) : "";
    const evidenceNote = typeof body.evidenceNote === "string" ? body.evidenceNote.trim().slice(0, 2000) : "";

    if (!desaId || !sourceName || !sourceUrl || !isSourceTypeCode(sourceTypeCode)) {
      return NextResponse.json({
        error: "Desa, source type, source name, dan source URL wajib diisi.",
      }, { status: 400 });
    }

    const desa = await db.desa.findUnique({
      where: { id: desaId },
      select: { id: true, nama: true },
    });
    if (!desa) {
      return NextResponse.json({ error: "Desa target tidak ditemukan." }, { status: 404 });
    }

    const engine = await resolveEffectiveTemplateFieldEngine(desaId);
    const sanitized = sanitizeTemplateFieldValues({
      engine,
      rawValues: body.values,
    });

    if (sanitized.errors.length > 0) {
      return NextResponse.json({
        error: "Beberapa field belum valid.",
        details: sanitized.errors,
      }, { status: 400 });
    }
    const sourceRegistryId = await ensureSourceRegistryEntry({
      db,
      desaId,
      desaName: desa.nama,
      sourceTypeCode,
      sourceName,
      sourceUrl,
      sourceRegistryId:
        typeof body.sourceRegistryId === "string" ? body.sourceRegistryId.trim() : null,
    });

    const created = await createSourceBackedReviewDocument({
      db,
      desaId,
      actorUserId: session.userId,
      actorRole: "INTERNAL_ADMIN",
      title,
      category,
      status: "PROCESSING",
      inputMode: "INTERNAL_SOURCE_ENTRY",
      sourceTypeCode,
      sourceUrl,
      sourceRegistryId,
      sourceEvidenceJson: {
        sourceName,
        evidenceNote: evidenceNote || null,
        extractedMeta:
          typeof body.extractedMeta === "object" && body.extractedMeta !== null
            ? body.extractedMeta
            : null,
        templateSnapshot: createTemplateFieldEngineSnapshot(engine),
        sourceFetch: {
          status: "idle",
          attemptedAt: null,
          suggestedValues: {},
          extractedMeta: null,
          error: null,
        },
      },
      structuredValues: sanitized.values,
      sourceLabel: sourceName,
      auditLabel: "Source-backed candidate dikirim",
      auditType: AUDIT_EVENT.INTERNAL_SOURCE_CANDIDATE_SUBMITTED,
    });

    return NextResponse.json({
      ok: true,
      ...created,
      queueUrl: `/internal-admin/intake/${created.documentId}`,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/internal-admin/village-data/source-candidates");
  }
}
