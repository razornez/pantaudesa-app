import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { ensurePersistedSourceFetchSnapshot } from "@/lib/internal-admin/source-review-fetch";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;
    if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    const document = await db.adminDesaDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        inputMode: true,
        sourceUrl: true,
        sourceEvidenceJson: true,
        normalizedSourceText: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    if (
      document.inputMode !== "INTERNAL_SOURCE_ENTRY" &&
      document.inputMode !== "SOURCE_INGESTION"
    ) {
      return NextResponse.json(
        { error: "Dokumen ini tidak memakai mode sumber resmi." },
        { status: 400 },
      );
    }

    if (!document.sourceUrl) {
      return NextResponse.json({ error: "Dokumen ini belum memiliki source URL." }, { status: 400 });
    }

    await ensurePersistedSourceFetchSnapshot({
      db,
      document,
      force: true,
    });

    return NextResponse.json({ ok: true, documentId });
  } catch (error) {
    return handleApiError(error, `POST /api/internal-admin/documents/${documentId}/refresh-source`);
  }
}
