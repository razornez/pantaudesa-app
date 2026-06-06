/**
 * alert.ts — kirim email notifikasi error ke tim via Resend.
 * Dipanggil dari auth logger dan API error handler.
 * Tidak throw — gagal kirim alert tidak boleh mengganggu request utama.
 */

import { resend } from "@/lib/resend";

interface AlertOptions {
  subject:  string;
  title:    string;
  body:     string;
  metadata?: Record<string, string | number | undefined>;
}

export async function sendErrorAlert(opts: AlertOptions): Promise<void> {
  const to = process.env.ALERT_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  // Throttle: don't send more than 1 alert per error type per 5 minutes.
  // Simple in-memory dedup — good enough for serverless cold starts.
  const key = opts.subject;
  const now  = Date.now();
  if (recentAlerts.has(key) && now - recentAlerts.get(key)! < 5 * 60_000) return;
  recentAlerts.set(key, now);

  const metaRows = opts.metadata
    ? Object.entries(opts.metadata)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:12px">${k}</td><td style="padding:4px 0;font-size:12px;color:#0f172a">${v}</td></tr>`)
        .join("")
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <div style="background:#fee2e2;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0;font-size:14px;font-weight:700;color:#991b1b">⚠️ PantauDesa Error Alert</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#7f1d1d">${opts.title}</p>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.6;white-space:pre-wrap">${opts.body}</p>
      ${metaRows ? `
      <table style="margin-top:16px;width:100%;border-top:1px solid #e2e8f0;padding-top:12px">
        ${metaRows}
      </table>` : ""}
      <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
      <p style="font-size:11px;color:#94a3b8">
        ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB ·
        Env: ${process.env.NODE_ENV} ·
        <a href="https://pantaudesa.vercel.app" style="color:#6366f1">pantaudesa.vercel.app</a>
      </p>
    </div>`;

  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM ?? "noreply@razornez.net",
      to,
      subject: `[PantauDesa] ${opts.subject}`,
      html,
    });
  } catch {
    // Alert failing must never break the app
    console.error("[alert] Failed to send error alert email");
  }
}

// In-memory dedup store
const recentAlerts = new Map<string, number>();
