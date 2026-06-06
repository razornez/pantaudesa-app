import { resend } from "@/lib/resend";

const PURPOSE_LABEL: Record<string, string> = {
  REGISTER:  "verifikasi pendaftaran",
  RESET_PIN: "reset PIN",
  UNFREEZE:  "pemulihan akun",
};

export async function sendOtpEmail(email: string, code: string, purpose: string): Promise<void> {
  const label = PURPOSE_LABEL[purpose] ?? "verifikasi";

  await resend.emails.send({
    from:    process.env.RESEND_FROM ?? "noreply@razornez.net",
    to:      email,
    subject: `${code} — Kode ${label} PantauDesa`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <p style="font-size:14px;color:#64748b;margin:0 0 8px">PantauDesa</p>
        <h1 style="font-size:24px;font-weight:900;color:#0f172a;margin:0 0 24px">
          Kode ${label} kamu
        </h1>
        <div style="background:#eef2ff;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
          <p style="font-size:13px;color:#6366f1;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em">Kode OTP</p>
          <p style="font-size:48px;font-weight:900;color:#4f46e5;letter-spacing:0.2em;margin:0">${code}</p>
          <p style="font-size:12px;color:#818cf8;margin:8px 0 0">Berlaku 10 menit · Jangan bagikan ke siapapun</p>
        </div>
        <p style="font-size:13px;color:#64748b;line-height:1.6">
          Jika kamu tidak meminta kode ini, abaikan email ini.
          Akun kamu tetap aman.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="font-size:11px;color:#94a3b8">PantauDesa · Transparansi Anggaran Desa</p>
      </div>
    `,
  });
}
