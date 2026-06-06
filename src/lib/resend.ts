import { Resend } from "resend";

// IMPORTANT: do NOT instantiate Resend at module load time.
// `new Resend(undefined)` throws synchronously, and Vercel's build phase
// evaluates every route module to "collect page data" — without RESEND_API_KEY
// at build-time the whole build fails.
//
// Lazy-init via Proxy keeps the existing import surface (`resend.emails.send(...)`)
// while deferring construction until the first real call.

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Email sending is unavailable.",
    );
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const client = getResend();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
