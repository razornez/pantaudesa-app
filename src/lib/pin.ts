import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resend } from "@/lib/resend";

const MAX_ATTEMPTS = 5;
const FREEZE_1_MS  = 5  * 60 * 1000;  // 5 menit
const FREEZE_2_MS  = 60 * 60 * 1000;  // 1 jam
const FREEZE_PERM  = 99 * 365 * 24 * 60 * 60 * 1000; // ~permanen

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(userId: string, pin: string): Promise<{
  ok:            boolean;
  error?:        string;
  frozen?:       boolean;
  frozenUntil?:  Date;
  attemptsLeft?: number;
}> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { pinHash: true, pinAttempts: true, pinLockedUntil: true, email: true, nama: true },
  });

  if (!user || !user.pinHash) {
    return { ok: false, error: "Akun belum memiliki PIN. Silakan daftar ulang." };
  }

  // Cek freeze aktif
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    return {
      ok: false, frozen: true, frozenUntil: user.pinLockedUntil,
      error: `Akun dibekukan hingga ${user.pinLockedUntil.toLocaleTimeString("id-ID")}.`,
    };
  }

  const match = await bcrypt.compare(pin, user.pinHash);

  if (match) {
    await db.user.update({ where: { id: userId }, data: { pinAttempts: 0, pinLockedUntil: null } });
    return { ok: true };
  }

  // PIN salah — tambah counter
  const attempts = user.pinAttempts + 1;
  let lockUntil: Date | null = null;
  let isPermanent = false;

  if (attempts >= MAX_ATTEMPTS * 3) {
    lockUntil   = new Date(Date.now() + FREEZE_PERM);
    isPermanent = true;
  } else if (attempts >= MAX_ATTEMPTS * 2) {
    lockUntil = new Date(Date.now() + FREEZE_2_MS);
  } else if (attempts >= MAX_ATTEMPTS) {
    lockUntil = new Date(Date.now() + FREEZE_1_MS);
  }

  await db.user.update({
    where: { id: userId },
    data:  { pinAttempts: attempts, pinLockedUntil: lockUntil },
  });

  if (isPermanent) {
    // Kirim email pemulihan ke user (bukan admin)
    await sendUnfreezeEmail(userId, user.email, user.nama ?? "");
    return {
      ok: false, frozen: true, frozenUntil: lockUntil!,
      error: "Terlalu banyak percobaan gagal. Akun dibekukan. Cek emailmu untuk instruksi pemulihan.",
    };
  }

  if (lockUntil) {
    const mins = lockUntil.getTime() > Date.now() + FREEZE_1_MS + 1000 ? 60 : 5;
    return {
      ok: false, frozen: true, frozenUntil: lockUntil,
      error: `PIN salah ${attempts}x. Akun dibekukan selama ${mins} menit.`,
    };
  }

  const left = MAX_ATTEMPTS - attempts;
  return {
    ok: false,
    attemptsLeft: Math.max(0, left),
    error: left > 0
      ? `PIN salah. Sisa ${left} percobaan sebelum akun dibekukan.`
      : "PIN salah. Akun akan dibekukan percobaan berikutnya.",
  };
}

async function sendUnfreezeEmail(userId: string, email: string, nama: string): Promise<void> {
  try {
    const { createOtp } = await import("@/lib/otp");
    const { code }      = await createOtp(email, "UNFREEZE");
    if (!code) return; // throttled — OTP sudah terkirim sebelumnya

    const token   = Buffer.from(`${userId}:${code}`).toString("base64url");
    const link    = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL}/lupa-pin?email=${encodeURIComponent(email)}&token=${token}`;

    await resend.emails.send({
      from:    process.env.RESEND_FROM ?? "noreply@razornez.net",
      to:      email,
      subject: "⚠️ Akun PantauDesa kamu dibekukan — Pulihkan sekarang",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:20px;font-weight:900;color:#991b1b;margin:0 0 16px">
            ⚠️ Akun kamu dibekukan
          </h1>
          <p style="font-size:14px;color:#334155;line-height:1.6">
            Halo ${nama},<br><br>
            Ada terlalu banyak percobaan login yang gagal pada akunmu di PantauDesa.
            Untuk keamananmu, akunmu telah dibekukan sementara.
          </p>
          <p style="font-size:14px;color:#334155;margin-top:16px">
            Jika <strong>kamu sendiri</strong> yang mencoba login, klik tombol di bawah untuk memulihkan akun dan mengatur PIN baru:
          </p>
          <a href="${link}" style="display:inline-block;margin:20px 0;background:#4f46e5;color:white;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px">
            Pulihkan Akun Saya
          </a>
          <p style="font-size:12px;color:#94a3b8;margin-top:24px">
            Jika ini bukan kamu, abaikan email ini. Akun kamu tetap aman.<br>
            Link berlaku 10 menit.
          </p>
        </div>`,
    });
  } catch (err) {
    console.error("[pin] Failed to send unfreeze email:", err);
  }
}
