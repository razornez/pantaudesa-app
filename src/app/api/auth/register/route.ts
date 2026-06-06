import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPin } from "@/lib/pin";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/send-otp";
import { handleApiError } from "@/lib/api-error";

// POST /api/auth/register
// Validates fields, creates unverified user, sends OTP.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, username, email, pin, confirmPin } = body;

    // ── Validate ───────────────────────────────────────────────────────────
    if (!nama?.trim())     return NextResponse.json({ field: "nama",     error: "Nama tidak boleh kosong." }, { status: 400 });
    if (!username?.trim()) return NextResponse.json({ field: "username", error: "Username tidak boleh kosong." }, { status: 400 });
    if (!/^[a-z0-9_]{3,20}$/.test(username))
      return NextResponse.json({ field: "username", error: "Username hanya huruf kecil, angka, underscore (3–20 karakter)." }, { status: 400 });
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ field: "email", error: "Format email tidak valid." }, { status: 400 });
    if (!pin || !/^\d{6}$/.test(pin))
      return NextResponse.json({ field: "pin", error: "PIN harus 6 digit angka." }, { status: 400 });
    if (pin !== confirmPin)
      return NextResponse.json({ field: "confirmPin", error: "Konfirmasi PIN tidak cocok." }, { status: 400 });

    const emailLower = email.toLowerCase().trim();

    // ── Check duplicates ───────────────────────────────────────────────────
    const existing = await db.user.findFirst({
      where: { OR: [{ email: emailLower }, { username }] },
      select: { email: true, username: true },
    });

    if (existing?.email === emailLower)
      return NextResponse.json({ field: "email", error: "Email sudah terdaftar.", redirect: "/login" }, { status: 409 });
    if (existing?.username === username)
      return NextResponse.json({ field: "username", error: "Username sudah dipakai. Coba yang lain." }, { status: 409 });

    const pinHash = await hashPin(pin);

    // Upsert — in case user started registration but didn't finish OTP
    await db.user.upsert({
      where:  { email: emailLower },
      update: { nama: nama.trim(), username, pinHash, emailVerified: null },
      create: { email: emailLower, nama: nama.trim(), name: nama.trim(), username, pinHash },
    });

    // Send OTP
    const { code, canResendAt } = await createOtp(emailLower, "REGISTER");
    if (code) await sendOtpEmail(emailLower, code, "REGISTER");

    return NextResponse.json({ canResendAt });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/register");
  }
}
