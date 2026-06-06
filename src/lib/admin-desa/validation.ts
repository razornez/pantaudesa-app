const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAdminDesaInviteBody(input: {
  desaId?: unknown;
  email?: unknown;
  inviterEmail?: string | null;
}) {
  const desaId = typeof input.desaId === "string" ? input.desaId.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const inviterEmail = input.inviterEmail?.trim().toLowerCase() ?? "";

  if (!desaId || !email) {
    return { ok: false as const, error: "desaId and email are required", status: 400 };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false as const, error: "Invalid email format", status: 400 };
  }
  if (email === inviterEmail) {
    return {
      ok: false as const,
      error: "Kamu tidak bisa mengundang email akunmu sendiri.",
      status: 400,
    };
  }

  return {
    ok: true as const,
    value: { desaId, email },
  };
}

export function parseAdminDesaRevokeBody(input: { reason?: unknown }) {
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  return {
    reason: reason ? reason : null,
  };
}

export function parseAdminDesaUploadFields(input: FormData) {
  const title = String(input.get("title") ?? "").trim();
  const category = String(input.get("category") ?? "").trim();
  const responsibilityAck = String(input.get("responsibilityAck") ?? "");

  return {
    title,
    category,
    responsibilityAck,
  };
}
