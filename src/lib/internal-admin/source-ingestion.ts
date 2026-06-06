import { autoMapFromText } from "@/lib/intake/auto-mapping";

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const LOGIN_HINTS = ["login", "signin", "masuk", "auth", "oauth"];

function isPrivateIpv4(hostname: string) {
  return /^10\./.test(hostname) ||
    /^127\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    /^192\.168\./.test(hostname);
}

function extractHtmlText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateSourceUrlForIngestion(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false as const, error: "URL sumber tidak valid." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false as const, error: "Hanya URL http/https yang diizinkan." };
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || isPrivateIpv4(hostname)) {
    return { ok: false as const, error: "URL lokal/private tidak boleh dipakai untuk ingestion." };
  }

  if (LOGIN_HINTS.some((token) => url.pathname.toLowerCase().includes(token))) {
    return { ok: false as const, error: "Halaman login/protected tidak boleh dipakai untuk ingestion." };
  }

  return { ok: true as const, url };
}

export async function fetchSourceIngestionPreview(sourceUrl: string) {
  const validated = validateSourceUrlForIngestion(sourceUrl);
  if (!validated.ok) {
    return validated;
  }

  const response = await fetch(validated.url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "PantauDesaSourceIngestionBot/1.0 (+review-first; internal-admin)",
      Accept: "text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false as const,
      error: `Sumber merespons ${response.status}. Cek URL atau coba lagi nanti.`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "unknown";
  const rawBody = await response.text();
  const extractedText = contentType.includes("html")
    ? extractHtmlText(rawBody)
    : rawBody.replace(/\s+/g, " ").trim();

  if (!extractedText) {
    return { ok: false as const, error: "Konten sumber kosong atau belum bisa diekstrak." };
  }

  const suggestedValues = autoMapFromText(extractedText).fields;

  return {
    ok: true as const,
    sourceUrl: validated.url.toString(),
    contentType,
    extractedText,
    suggestedValues,
    extractedMeta: {
      contentType,
      fetchedAt: new Date().toISOString(),
      length: extractedText.length,
    },
  };
}
