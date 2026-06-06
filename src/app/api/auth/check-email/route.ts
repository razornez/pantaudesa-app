import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

// POST /api/auth/check-email
// Returns whether email is registered and if profile is complete.
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email tidak boleh kosong" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where:  { email: email.toLowerCase().trim() },
      select: { id: true, username: true, pinHash: true },
    });

    return NextResponse.json({
      exists:      !!user,
      hasPin:      !!user?.pinHash,
      hasUsername: !!user?.username,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/check-email");
  }
}
