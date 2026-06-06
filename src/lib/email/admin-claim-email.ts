/**
 * Admin claim email service — separate from NextAuth login provider.
 * Uses existing RESEND_API_KEY, RESEND_FROM, AUTH_URL.
 * Does NOT reuse NextAuth signIn("resend").
 */

import { resend } from "@/lib/resend";

export type AdminClaimEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; code: "RESEND_ENV_MISSING" | "RESEND_SEND_FAILED" };

function getBaseUrl(): string {
  const raw = process.env.AUTH_URL ?? "";
  return raw.replace(/\/$/, "");
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendAdminClaimMagicLink({
  toEmail,
  desaName,
  rawToken,
  claimId,
}: {
  toEmail: string;
  desaName: string;
  rawToken: string;
  claimId: string;
}): Promise<AdminClaimEmailResult> {
  if (!isResendConfigured()) {
    return { ok: false, error: "Resend env missing", code: "RESEND_ENV_MISSING" };
  }

  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/api/admin-claim/verify-email?token=${rawToken}&claimId=${claimId}`;
  const from = process.env.RESEND_FROM!;

  try {
    const result = await resend.emails.send({
      from,
      to: toEmail,
      subject: `Verifikasi klaim admin desa: ${desaName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#3730a3;">Verifikasi Klaim Admin Desa</h2>
          <p>Kamu mengajukan klaim sebagai admin desa <strong>${desaName}</strong>.</p>
          <p>Klik tautan di bawah untuk memverifikasi klaim ini. Tautan berlaku selama <strong>24 jam</strong>.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Verifikasi Sekarang
          </a>
          <p style="color:#64748b;font-size:13px;">
            Jika kamu tidak mengajukan klaim ini, abaikan email ini.
          </p>
          <p style="color:#94a3b8;font-size:12px;">PantauDesa — transparansi anggaran desa</p>
        </div>
      `,
    });

    if (result.error) {
      return { ok: false, error: result.error.message, code: "RESEND_SEND_FAILED" };
    }

    return { ok: true, messageId: result.data?.id ?? "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg, code: "RESEND_SEND_FAILED" };
  }
}

export async function sendAdminInviteEmail({
  toEmail,
  desaName,
  rawToken,
  inviteId,
}: {
  toEmail: string;
  desaName: string;
  rawToken: string;
  inviteId: string;
}): Promise<AdminClaimEmailResult> {
  if (!isResendConfigured()) {
    return { ok: false, error: "Resend env missing", code: "RESEND_ENV_MISSING" };
  }

  const baseUrl = getBaseUrl();
  const acceptUrl = `${baseUrl}/api/admin-claim/accept-invite?token=${rawToken}&inviteId=${inviteId}`;
  const from = process.env.RESEND_FROM!;

  try {
    const result = await resend.emails.send({
      from,
      to: toEmail,
      subject: `Undangan admin desa: ${desaName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#3730a3;">Undangan Admin Desa</h2>
          <p>Kamu diundang bergabung sebagai admin desa <strong>${desaName}</strong>.</p>
          <p>Klik tautan di bawah untuk menerima undangan. Tautan berlaku selama <strong>7 hari</strong>.</p>
          <a href="${acceptUrl}"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Terima Undangan
          </a>
          <p style="color:#64748b;font-size:13px;">
            Jika kamu tidak mengenal pengirim undangan ini, abaikan email ini.
          </p>
          <p style="color:#94a3b8;font-size:12px;">PantauDesa — transparansi anggaran desa</p>
        </div>
      `,
    });

    if (result.error) {
      return { ok: false, error: result.error.message, code: "RESEND_SEND_FAILED" };
    }

    return { ok: true, messageId: result.data?.id ?? "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg, code: "RESEND_SEND_FAILED" };
  }
}

export async function sendDesaEmailOtp({
  toEmail,
  desaName,
  otpCode,
  expiresMinutes = 15,
}: {
  toEmail: string;
  desaName: string;
  otpCode: string;
  expiresMinutes?: number;
}): Promise<AdminClaimEmailResult> {
  if (!isResendConfigured()) {
    return { ok: false, error: "Resend env missing", code: "RESEND_ENV_MISSING" };
  }

  const from = process.env.RESEND_FROM!;

  try {
    const result = await resend.emails.send({
      from,
      to: toEmail,
      subject: `Kode OTP verifikasi Admin Desa: ${desaName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#3730a3;">Kode Verifikasi Email Admin Desa</h2>
          <p>Kamu meminta verifikasi email untuk klaim Admin Desa <strong>${desaName}</strong>.</p>
          <p>Masukkan kode berikut pada form verifikasi:</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:20px 32px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e1b4b;">${otpCode}</span>
          </div>
          <p style="color:#64748b;font-size:13px;">
            Kode berlaku selama <strong>${expiresMinutes} menit</strong>.
            Konfirmasi email hanya membawa klaim ke tahap review — bukan langsung VERIFIED.
          </p>
          <p style="color:#64748b;font-size:13px;">
            Jika kamu tidak meminta kode ini, abaikan email ini.
          </p>
          <p style="color:#94a3b8;font-size:12px;">PantauDesa — transparansi anggaran desa</p>
        </div>
      `,
    });

    if (result.error) {
      return { ok: false, error: result.error.message, code: "RESEND_SEND_FAILED" };
    }

    return { ok: true, messageId: result.data?.id ?? "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg, code: "RESEND_SEND_FAILED" };
  }
}

export async function sendRenewalReminderEmail({
  toEmail,
  desaName,
  renewalDueAt,
  daysRemaining,
}: {
  toEmail: string;
  desaName: string;
  renewalDueAt: Date;
  daysRemaining: number;
}): Promise<AdminClaimEmailResult> {
  if (!isResendConfigured()) {
    return { ok: false, error: "Resend env missing", code: "RESEND_ENV_MISSING" };
  }
  const from = process.env.RESEND_FROM!;
  const baseUrl = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
  const profileUrl = `${baseUrl}/profil/saya`;

  try {
    const result = await resend.emails.send({
      from,
      to: toEmail,
      subject: `Pengingat perpanjangan Admin Desa: ${desaName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#3730a3;">Perpanjangan Verifikasi Admin Desa</h2>
          <p>Verifikasi Admin Desa <strong>${desaName}</strong> akan habis dalam <strong>${daysRemaining} hari</strong>.</p>
          <p>Tanggal jatuh tempo: <strong>${renewalDueAt.toLocaleDateString("id-ID", { dateStyle: "long" })}</strong></p>
          <p>Lakukan perpanjangan melalui website token sebelum tanggal tersebut. Sukses verifikasi token tetap perlu review internal sebelum status VERIFIED kamu diperpanjang.</p>
          <a href="${profileUrl}"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Buka Profil Admin Desa
          </a>
          <p style="color:#64748b;font-size:13px;">
            Jika perpanjangan tidak dilakukan, akses Admin Desa kamu akan dicabut otomatis dan kamu harus mengajukan klaim baru.
          </p>
          <p style="color:#94a3b8;font-size:12px;">PantauDesa — transparansi anggaran desa</p>
        </div>
      `,
    });
    if (result.error) return { ok: false, error: result.error.message, code: "RESEND_SEND_FAILED" };
    return { ok: true, messageId: result.data?.id ?? "sent" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), code: "RESEND_SEND_FAILED" };
  }
}

export async function sendRenewalExpiredEmail({
  toEmail,
  desaName,
  reason,
}: {
  toEmail: string;
  desaName: string;
  reason?: string | null;
}): Promise<AdminClaimEmailResult> {
  if (!isResendConfigured()) {
    return { ok: false, error: "Resend env missing", code: "RESEND_ENV_MISSING" };
  }
  const from = process.env.RESEND_FROM!;
  const baseUrl = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
  const klaimUrl = `${baseUrl}/profil/klaim-admin-desa`;

  try {
    const result = await resend.emails.send({
      from,
      to: toEmail,
      subject: `Akses Admin Desa berakhir: ${desaName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#b91c1c;">Akses Admin Desa Berakhir</h2>
          <p>Status Admin Desa VERIFIED kamu untuk <strong>${desaName}</strong> berakhir karena verifikasi berkala belum diperbarui${reason ? ` (${reason})` : ""}.</p>
          <p>Akses admin telah dikembalikan ke user biasa. Jika kamu masih mengelola desa ini, ajukan verifikasi Admin Desa kembali.</p>
          <a href="${klaimUrl}"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Ajukan Klaim Admin Desa
          </a>
          <p style="color:#94a3b8;font-size:12px;">PantauDesa — transparansi anggaran desa</p>
        </div>
      `,
    });
    if (result.error) return { ok: false, error: result.error.message, code: "RESEND_SEND_FAILED" };
    return { ok: true, messageId: result.data?.id ?? "sent" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), code: "RESEND_SEND_FAILED" };
  }
}

export async function sendContactAdminEmail({
  subject,
  description,
  evidence,
  requesterEmail,
  sourcePage,
}: {
  subject: string;
  description: string;
  evidence?: string;
  requesterEmail?: string | null;
  sourcePage?: string | null;
}): Promise<AdminClaimEmailResult> {
  if (!isResendConfigured() || !process.env.CONTACT_EMAIL) {
    return { ok: false, error: "Contact admin env missing", code: "RESEND_ENV_MISSING" };
  }

  const from = process.env.RESEND_FROM!;

  try {
    const result = await resend.emails.send({
      from,
      to: process.env.CONTACT_EMAIL,
      replyTo: requesterEmail ?? undefined,
      subject: `[Hubungi Admin] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#0f172a;">Pesan Hubungi Admin</h2>
          <p><strong>Subjek:</strong> ${subject}</p>
          <p><strong>Pengirim:</strong> ${requesterEmail ?? "anonim / tidak tersedia"}</p>
          <p><strong>Halaman sumber:</strong> ${sourcePage ?? "-"}</p>
          <p><strong>Deskripsi:</strong></p>
          <div style="white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">${description}</div>
          <p style="margin-top:16px;"><strong>Bukti / catatan tambahan:</strong> ${evidence || "-"}</p>
        </div>
      `,
    });

    if (result.error) {
      return { ok: false, error: result.error.message, code: "RESEND_SEND_FAILED" };
    }

    return { ok: true, messageId: result.data?.id ?? "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg, code: "RESEND_SEND_FAILED" };
  }
}
