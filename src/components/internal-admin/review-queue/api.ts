import type {
  PublishApiPayload,
  TemplateRibbonInfo,
} from "./types";

interface PreviewPayload {
  signedUrl?: string;
  error?: string;
}

interface ApiErrorPayload {
  error?: string;
}

interface TemplateInfoPayload {
  templateName?: string;
  templateKey?: string;
  source?: string;
  visibleComponents?: unknown[];
  hiddenComponents?: unknown[];
}

function getErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : fallback;
}

export async function fetchDocumentPreviewUrl(documentId: string): Promise<string> {
  const response = await fetch(`/api/admin-claim/documents/${documentId}/preview`);
  const data = (await response.json()) as PreviewPayload;
  if (!response.ok || !data.signedUrl) {
    throw new Error(getErrorMessage(data, "Preview dokumen belum bisa dibuka."));
  }
  return data.signedUrl;
}

export async function publishDocumentReview(
  documentId: string,
  input: { fields: Record<string, unknown>; note?: string },
): Promise<PublishApiPayload> {
  const response = await fetch(`/api/internal-admin/documents/${documentId}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as PublishApiPayload | ApiErrorPayload;
  if (!response.ok || !("ok" in data) || !data.ok) {
    throw new Error(getErrorMessage(data, "Dokumen belum berhasil dipublikasikan."));
  }
  return data;
}

export async function markDocumentFailed(documentId: string, reason: string): Promise<void> {
  const response = await fetch(`/api/internal-admin/documents/${documentId}/mark-failed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Dokumen belum berhasil ditandai gagal."));
  }
}

export async function fetchTemplateRibbonInfo(desaId: string): Promise<TemplateRibbonInfo> {
  const response = await fetch(
    `/api/internal-admin/village-data/field-standards?desaId=${encodeURIComponent(desaId)}`,
  );
  if (!response.ok) {
    throw new Error("Gagal memuat info template.");
  }
  const data = (await response.json()) as TemplateInfoPayload;
  return {
    templateName: data.templateName ?? "-",
    templateKey: data.templateKey ?? "-",
    source: data.source ?? "fallback",
    visibleCount: Array.isArray(data.visibleComponents) ? data.visibleComponents.length : 0,
    hiddenCount: Array.isArray(data.hiddenComponents) ? data.hiddenComponents.length : 0,
  };
}

export async function refreshDocumentSourceSnapshot(documentId: string): Promise<void> {
  const response = await fetch(`/api/internal-admin/documents/${documentId}/refresh-source`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Snapshot sumber belum berhasil diperbarui."));
  }
}
