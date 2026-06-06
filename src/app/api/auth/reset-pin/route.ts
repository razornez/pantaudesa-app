import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPin } from "@/lib/pin";
import { verifyOtp, createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/send-otp";
import { handleApiError } from "@/lib/api-error";

// POST /api/auth/reset-pin
// Body { email }             → send OTP
// Body { email, otp, pin }   → verify OTP + set new PIN
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, pin, confirmPin } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email tidak boleh kosong." }, { status: 400 });
    }
    const emailLower = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where:  { email: emailLower },
      select: { id: true, emailVerified: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Email tidak terdaftar." }, { status: 404 });
    }

    // ── Send OTP only ──────────────────────────────────────────────────────
    if (!otp) {
      const { code, canResendAt } = await createOtp(emailLower, "RESET_PIN");
      if (code) await sendOtpEmail(emailLower, code, "RESET_PIN");
      return NextResponse.json({ canResendAt });
    }

    // ── Verify OTP + set new PIN ───────────────────────────────────────────
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ field: "pin", error: "PIN harus 6 digit angka." }, { status: 400 });
    }
    if (pin !== confirmPin) {
      return NextResponse.json({ field: "confirmPin", error: "Konfirmasi PIN tidak cocok." }, { status: 400 });
    }

    const result = await verifyOtp(emailLower, otp, "RESET_PIN");
    if (!result.ok) {
      return NextResponse.json({ field: "otp", error: result.error }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data:  {
        pinHash:        await hashPin(pin),
        pinAttempts:    0,
        pinLockedUntil: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/reset-pin");
  }
}
