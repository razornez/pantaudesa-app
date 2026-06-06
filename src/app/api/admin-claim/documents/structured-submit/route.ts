import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import { getUploadedDocumentInitialStatus } from "@/lib/admin-desa/policy";
import { isValidTemplateDocumentCategory } from "@/lib/admin-desa/document-categories";
import { createSourceBackedReviewDocument } from "@/lib/internal-admin/review-candidate-submission";
import {
  createTemplateFieldEngineSnapshot,
  resolveEffectiveTemplateFieldEngine,
} from "@/lib/village-data/field-engine";
import { sanitizeTemplateFieldValues } from "@/lib/village-data/field-submission";
import { ensureSourceRegistryEntry } from "@/lib/village-data/source-registry";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const category = typeof body.category === "string" ? body.category.trim().slice(0, 80) : "structured_submission";
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim().slice(0, 500) : "";
    const evidenceNote = typeof body.evidenceNote === "string" ? body.evidenceNote.trim().slice(0, 2000) : "";
    const responsibilityAck = body.responsibilityAck === true;
    const rawValues = body.values;

    if (!title) {
      return NextResponse.json({ error: "Judul submission wajib diisi." }, { status: 400 });
    }
    if (!responsibilityAck) {
      return NextResponse.json({
        error: "Pernyataan tanggung jawab wajib dicentang sebelum mengirim data terstruktur.",
      }, { status: 400 });
    }
    if (!isRecord(rawValues)) {
      return NextResponse.json({ error: "Field values wajib berupa object." }, { status: 400 });
    }

    const member = await db.desaAdminMember.findFirst({
      where: { userId: session.user.id, status: { in: ["LIMITED", "VERIFIED"] } },
      orderBy: { updatedAt: "desc" },
      select: {
        desaId: true,
        status: true,
        role: true,
        desa: { select: { nama: true } },
      },
    });

    if (!member) {
      return NextResponse.json({
        error: "Hanya Admin Desa aktif yang dapat mengirim data terstruktur.",
      }, { status: 403 });
    }

    const engine = await resolveEffectiveTemplateFieldEngine(member.desaId);
    if (
      !isValidTemplateDocumentCategory(category, {
        visibleComponents: engine.resolvedTemplate.visibleComponents,
      })
    ) {
      return NextResponse.json({
        error: "Kategori submission tidak tersedia di template aktif desa.",
        code: "INVALID_TEMPLATE_CATEGORY",
      }, { status: 400 });
    }
    const sanitized = sanitizeTemplateFieldValues({
      engine,
      rawValues,
    });

    if (sanitized.errors.length > 0) {
      return NextResponse.json({
        error: "Beberapa field belum valid.",
        details: sanitized.errors,
      }, { status: 400 });
    }

    if (Object.keys(sanitized.values).length === 0) {
      return NextResponse.json({
        error: "Isi minimal satu field aktif dari template sebelum submit.",
      }, { status: 400 });
    }

    const requiresEvidence = engine.fields.some(
      (field) =>
        Object.hasOwn(sanitized.values, field.fieldKey) && field.sourcePolicyResolved.requiresEvidence,
    );

    if (requiresEvidence && !sourceUrl && !evidenceNote) {
      return NextResponse.json({
        error: "Field sensitif butuh URL sumber atau catatan evidence sebelum dikirim.",
      }, { status: 400 });
    }

    const sourceRegistryId =
      sourceUrl || evidenceNote
        ? await ensureSourceRegistryEntry({
            db,
            desaId: member.desaId,
            desaName: member.desa.nama,
            sourceTypeCode: "ADMIN_DESA_SUBMISSION",
            sourceName: `Structured submission ${member.desa.nama}`,
            sourceUrl: sourceUrl || null,
          })
        : null;

    const memberStatus =
      member.status === "VERIFIED" || member.status === "LIMITED" ? member.status : null;
    if (!memberStatus) {
      return NextResponse.json({
        error: "Status keanggotaan admin desa tidak valid untuk structured submission.",
      }, { status: 403 });
    }

    const created = await createSourceBackedReviewDocument({
      db,
      desaId: member.desaId,
      actorUserId: session.user.id,
      actorRole: member.role,
      title,
      category,
      status: getUploadedDocumentInitialStatus(memberStatus),
      inputMode: "STRUCTURED_SUBMISSION",
      sourceTypeCode: "ADMIN_DESA_SUBMISSION",
      sourceUrl: sourceUrl || null,
      sourceRegistryId,
      sourceEvidenceJson: {
        evidenceNote: evidenceNote || null,
        submittedFrom: "admin_desa_structured_submission",
        uploaderRole: member.role,
        templateSnapshot: createTemplateFieldEngineSnapshot(engine),
      },
      structuredValues: sanitized.values,
      sourceLabel: "Admin Desa structured submission",
      auditLabel: "Structured submission dikirim",
      auditType: AUDIT_EVENT.ADMIN_DESA_STRUCTURED_SUBMITTED,
    });

    return NextResponse.json({
      ok: true,
      ...created,
      message:
        created.status === "PROCESSING"
          ? "Structured submission berhasil dikirim ke review internal."
          : "Structured submission berhasil dikirim dan menunggu persetujuan admin desa verified.",
    });
  } catch (error) {
    return handleApiError(error, "POST /api/admin-claim/documents/structured-submit");
  }
}
