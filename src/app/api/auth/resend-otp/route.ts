import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/send-otp";
import { handleApiError } from "@/lib/api-error";

// POST /api/auth/resend-otp
// Resend OTP for any purpose. Throttled by createOtp (60s cooldown).
export async function POST(req: Request) {
  try {
    const { email, purpose } = await req.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const user       = await db.user.findUnique({ where: { email: emailLower }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "Email tidak terdaftar." }, { status: 404 });
    }

    const { code, canResendAt } = await createOtp(emailLower, purpose);
    if (code) await sendOtpEmail(emailLower, code, purpose);

    return NextResponse.json({ canResendAt });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/resend-otp");
  }
}
