interface ApiErrorPayload {
  error?: string;
  detail?: string;
}

interface UploadDocumentPayload {
  documents?: unknown[];
  error?: string;
  detail?: string;
}

interface PreviewDocumentPayload {
  signedUrl?: string;
  error?: string;
}

function getErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return typeof payload.error === "string" ? payload.error : fallback;
}

export async function inviteAdminDesa(input: {
  desaId: string;
  email: string;
}): Promise<void> {
  const response = await fetch("/api/admin-claim/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Undangan admin belum berhasil dikirim."));
  }
}

export async function revokeAdminDesaMember(
  memberId: string,
  input: { reason?: string },
): Promise<void> {
  const response = await fetch(`/api/admin-claim/revoke-member/${memberId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Akses admin belum berhasil dicabut."));
  }
}

export async function updateVoiceStatus(
  voiceId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
): Promise<void> {
  const response = await fetch(`/api/voices/${voiceId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Status suara belum berhasil diperbarui."));
  }
}

export async function markAdminNotificationsRead(ids?: string[]): Promise<void> {
  const response = await fetch("/api/admin-claim/notifications/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids ? { ids } : {}),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Notifikasi belum berhasil diperbarui."));
  }
}

export async function uploadAdminDesaDocuments(formData: FormData): Promise<number> {
  const response = await fetch("/api/admin-claim/documents/upload", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as UploadDocumentPayload;
  if (!response.ok) {
    const detail = data.detail ? ` (${data.detail})` : "";
    throw new Error(`${data.error ?? "Upload dokumen gagal."}${detail}`);
  }
  const persisted = Array.isArray(data.documents) ? data.documents.length : 0;
  if (persisted === 0) {
    throw new Error("Server belum mengonfirmasi dokumen yang tersimpan.");
  }
  return persisted;
}

export async function submitAdminDesaStructuredData(input: {
  title: string;
  category: string;
  sourceUrl?: string;
  evidenceNote?: string;
  responsibilityAck: boolean;
  values: Record<string, string>;
}): Promise<{ documentId: string; status: string }> {
  const response = await fetch("/api/admin-claim/documents/structured-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as ApiErrorPayload & {
    documentId?: string;
    status?: string;
  };
  if (!response.ok || !data.documentId || !data.status) {
    throw new Error(getErrorMessage(data, "Structured submission belum berhasil dikirim."));
  }
  return {
    documentId: data.documentId,
    status: data.status,
  };
}

export async function approveAdminDesaDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/admin-claim/documents/${documentId}/approve`, {
    method: "POST",
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Dokumen belum berhasil diteruskan."));
  }
}

export async function rejectAdminDesaDocument(documentId: string, reason: string): Promise<void> {
  const response = await fetch(`/api/admin-claim/documents/${documentId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Dokumen belum berhasil ditolak."));
  }
}

export async function fetchAdminDesaDocumentPreviewUrl(documentId: string): Promise<string> {
  const response = await fetch(`/api/admin-claim/documents/${documentId}/preview`);
  const data = (await response.json()) as PreviewDocumentPayload;
  if (!response.ok || !data.signedUrl) {
    throw new Error(getErrorMessage(data, "Preview dokumen belum bisa dibuka."));
  }
  return data.signedUrl;
}
