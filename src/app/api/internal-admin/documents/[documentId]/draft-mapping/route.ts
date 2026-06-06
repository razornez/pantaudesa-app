import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import {
  getRequestActorMeta,
} from "@/lib/internal-admin/document-review";
import {
  createDocumentDraftMapping,
  saveDocumentDraftMapping,
} from "@/lib/internal-admin/document-review-service";
import {
  parseDraftMappingPatchBody,
  readOptionalJson,
} from "@/lib/internal-admin/document-review-validation";

// POST /api/internal-admin/documents/:documentId/draft-mapping
// Generates an empty manual mapping draft for a PROCESSING document.
// Internal admin reads the document and fills the fields in the publish modal.
// AI provider not yet configured — mapping is manual until owner integrates one.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    const result = await createDocumentDraftMapping({
      db,
      documentId,
      actor: {
        userId: session.userId,
        requestMeta: getRequestActorMeta(req),
      },
    });
    return NextResponse.json(result.ok ? { ok: true, ...result.data } : result.body, {
      status: result.ok ? 200 : result.status,
    });
  } catch (err) {
    return handleApiError(err, `POST /api/internal-admin/documents/${documentId}/draft-mapping`);
  }
}

// PATCH /api/internal-admin/documents/:documentId/draft-mapping
// Saves the internal review draft without publishing anything.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    const body = await readOptionalJson<{
      fields?: unknown;
      notes?: unknown;
    }>(req, {});
    const result = await saveDocumentDraftMapping({
      db,
      documentId,
      body: parseDraftMappingPatchBody(body),
      actor: {
        userId: session.userId,
        requestMeta: getRequestActorMeta(req),
      },
    });
    return NextResponse.json(result.ok ? { ok: true, ...result.data } : result.body, {
      status: result.ok ? 200 : result.status,
    });
  } catch (err) {
    return handleApiError(err, `PATCH /api/internal-admin/documents/${documentId}/draft-mapping`);
  }
}
