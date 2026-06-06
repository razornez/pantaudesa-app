import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { sendContactAdminEmail } from "@/lib/email/admin-claim-email";

const MAX_SUBJECT_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_EVIDENCE_LENGTH = 400;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    let body: {
      subject?: string;
      description?: string;
      evidence?: string;
      sourcePage?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const subject = body.subject?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const evidence = body.evidence?.trim() ?? "";
    const sourcePage = body.sourcePage?.trim() ?? "";

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json({ error: "Subject too long" }, { status: 400 });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json({ error: "Description too long" }, { status: 400 });
    }
    if (evidence.length > MAX_EVIDENCE_LENGTH) {
      return NextResponse.json({ error: "Evidence text too long" }, { status: 400 });
    }

    const emailResult = await sendContactAdminEmail({
      subject,
      description,
      evidence: evidence || undefined,
      requesterEmail: session?.user?.email ?? null,
      sourcePage: sourcePage || "/profil/klaim-admin-desa",
    });

    if (!emailResult.ok && emailResult.code === "RESEND_ENV_MISSING") {
      return NextResponse.json({
        error: "CONTACT_EMAIL atau layanan email belum dikonfigurasi.",
      }, { status: 503 });
    }

    if (!emailResult.ok) {
      return NextResponse.json({
        error: "Pesan gagal dikirim ke admin. Coba lagi sebentar lagi.",
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/contact-admin");
  }
}
