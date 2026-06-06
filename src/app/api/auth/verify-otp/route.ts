import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { handleApiError } from "@/lib/api-error";

// POST /api/auth/verify-otp
// Verifies OTP for REGISTER purpose, marks email as verified.
export async function POST(req: Request) {
  try {
    const { email, code, purpose } = await req.json();

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const result = await verifyOtp(email.toLowerCase().trim(), code, purpose);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Mark email as verified
    if (purpose === "REGISTER") {
      await db.user.update({
        where: { email: email.toLowerCase().trim() },
        data:  { emailVerified: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/verify-otp");
  }
}
