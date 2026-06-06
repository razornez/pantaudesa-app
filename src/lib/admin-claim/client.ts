export interface AdminClaimApiError {
  error?: string;
  message?: string;
  code?: string;
  reason?: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function getErrorMessage(payload: AdminClaimApiError, fallback: string) {
  return payload.error ?? payload.message ?? fallback;
}

export async function submitAdminClaim(input: {
  desaId: string;
  method: "OFFICIAL_EMAIL" | "WEBSITE_TOKEN";
  officialEmail?: string;
  websiteUrl?: string;
}) {
  const response = await fetch("/api/admin-claim/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{
    ok?: boolean;
    claimId?: string;
    status?: string;
    method?: string;
    error?: string;
    message?: string;
  }>(response);
  if (!response.ok || !payload.claimId) {
    throw new Error(getErrorMessage(payload, "Gagal mengirim klaim."));
  }
  return payload;
}

export async function sendAdminClaimEmailToken(input: {
  claimId: string;
  officialEmail: string;
}) {
  const response = await fetch("/api/admin-claim/generate-email-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{
    ok?: boolean;
    expiresAt?: string;
    code?: string;
    message?: string;
    error?: string;
  }>(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Gagal mengirim email verifikasi."));
  }
  return payload;
}

export async function generateAdminClaimWebsiteToken(input: {
  claimId: string;
  websiteUrl: string;
}) {
  const response = await fetch("/api/admin-claim/generate-website-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{
    ok?: boolean;
    rawToken?: string;
    tokenPayload?: string;
    instruction?: string;
    expiresAt?: string;
    error?: string;
    message?: string;
  }>(response);
  if (!response.ok || !payload.rawToken) {
    throw new Error(getErrorMessage(payload, "Gagal membuat token website."));
  }
  return payload;
}

export async function checkAdminClaimWebsiteToken(input: {
  claimId: string;
  rawToken: string;
}) {
  const response = await fetch("/api/admin-claim/check-website-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{
    ok?: boolean;
    found?: boolean;
    blocked?: boolean;
    reason?: string;
    error?: string;
  }>(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Gagal memeriksa token website."));
  }
  return payload;
}

export async function inviteAdminDesa(input: { desaId: string; email: string }) {
  const response = await fetch("/api/admin-claim/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{
    ok?: boolean;
    inviteId?: string;
    expiresAt?: string;
    emailSent?: boolean;
    error?: string;
    message?: string;
  }>(response);
  if (!response.ok || !payload.inviteId) {
    throw new Error(getErrorMessage(payload, "Gagal mengirim undangan admin."));
  }
  return payload;
}

export async function contactAdmin(input: {
  subject: string;
  description: string;
  evidence?: string;
  sourcePage?: string;
}) {
  const response = await fetch("/api/admin-claim/contact-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{ ok?: boolean; error?: string; message?: string }>(response);
  if (!response.ok || !payload.ok) {
    throw new Error(getErrorMessage(payload, "Gagal mengirim pesan ke admin."));
  }
  return payload;
}
