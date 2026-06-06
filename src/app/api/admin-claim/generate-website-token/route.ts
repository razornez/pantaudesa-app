import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { generateRawToken, hashToken, tokenExpiresAt, WEBSITE_TOKEN_TTL_MS } from "@/lib/admin-claim/token";
import { makeWebsiteTokenPayload } from "@/lib/admin-claim/website-token";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";

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

    let body: { claimId: string; websiteUrl: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { claimId, websiteUrl } = body;
    if (!claimId || !websiteUrl) {
      return NextResponse.json({ error: "claimId and websiteUrl are required" }, { status: 400 });
    }

    // Basic URL validation
    let parsed: URL;
    try {
      parsed = new URL(websiteUrl);
    } catch {
      return NextResponse.json({ error: "Invalid websiteUrl" }, { status: 400 });
    }
    if (!["https:", "http:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "websiteUrl must use http or https" }, { status: 400 });
    }

    // Verify claim belongs to this user
    const claim = await db.desaAdminClaim.findUnique({
      where: { id: claimId },
      select: { id: true, userId: true, desaId: true },
    });
    if (!claim || claim.userId !== userId) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Generate token — store hash only, return raw once
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = tokenExpiresAt(WEBSITE_TOKEN_TTL_MS);

    await db.desaAdminClaim.update({
      where: { id: claimId },
      data: {
        websiteUrl,
        tokenHash,
        tokenExpiresAt: expiresAt,
        method: "WEBSITE_TOKEN",
      },
    });

    await writeAuditEvent({
      eventType: AUDIT_EVENT.WEBSITE_TOKEN_GENERATED,
      desaId: claim.desaId,
      actorUserId: userId,
      claimId,
      method: "WEBSITE_TOKEN",
      evidenceType: "website",
      evidenceUrl: websiteUrl,
      metadata: { expiresAt: expiresAt.toISOString() },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      // Raw token shown once — instruct user to place on website
      rawToken,
      tokenPayload: makeWebsiteTokenPayload(rawToken),
      instruction: `Tambahkan teks berikut ke halaman utama website desa sebagai meta tag atau konten tersembunyi: <meta name="pantaudesa-verification" content="${rawToken}">`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin-claim/generate-website-token");
  }
}
