import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueLoginTicket } from "@/lib/login-ticket";
import { verifyPin } from "@/lib/pin";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/send-otp";
import { handleApiError } from "@/lib/api-error";

// POST /api/auth/login
// Step 1 { email }            → { exists, hasPin } or { exists: false }
// Step 2 { email, pin }       → { ok: true } PIN verified, client calls signIn("pin")
// Step 2 { email, resendOtp } → { canResendAt } send temp OTP to email
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, pin, resendOtp } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email tidak boleh kosong." }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where:  { email: emailLower },
      select: { id: true, pinHash: true, emailVerified: true, pinAttempts: true, pinLockedUntil: true },
    });

    // ── Step 1: email check only ───────────────────────────────────────────
    if (!pin && !resendOtp) {
      if (!user)                 return NextResponse.json({ exists: false });
      if (!user.emailVerified)   return NextResponse.json({ exists: false, unverified: true });
      return NextResponse.json({ exists: true, hasPin: !!user.pinHash });
    }

    // ── Resend temporary OTP to email ──────────────────────────────────────
    if (resendOtp) {
      if (!user) return NextResponse.json({ error: "Email tidak terdaftar." }, { status: 404 });
      const { code, canResendAt } = await createOtp(emailLower, "RESET_PIN");
      if (code) await sendOtpEmail(emailLower, code, "RESET_PIN");
      return NextResponse.json({ canResendAt });
    }

    // ── Step 2: verify PIN ─────────────────────────────────────────────────
    if (!user)                return NextResponse.json({ error: "Email tidak terdaftar." }, { status: 404 });
    if (!user.emailVerified)  return NextResponse.json({ error: "Email belum diverifikasi. Cek inbox kamu." }, { status: 403 });

    const result = await verifyPin(user.id, pin);
    if (!result.ok) {
      return NextResponse.json({
        error:        result.error,
        frozen:       result.frozen ?? false,
        frozenUntil:  result.frozenUntil,
        attemptsLeft: result.attemptsLeft,
      }, { status: result.frozen ? 423 : 401 });
    }

    // PIN correct — return ok. Client will call NextAuth signIn("pin") next.
    return NextResponse.json({ ok: true, loginToken: issueLoginTicket(user.id, emailLower) });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/login");
  }
}
