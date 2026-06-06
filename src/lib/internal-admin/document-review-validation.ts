import type { NextRequest } from "next/server";

export interface DraftMappingPatchBody {
  fields?: unknown;
  notes?: unknown;
}

export interface PublishReviewBody {
  fields?: unknown;
  note: string | null;
}

export async function readOptionalJson<T>(request: NextRequest, fallback: T) {
  try {
    return (await request.json()) as T;
  } catch {
    return fallback;
  }
}

export function parseDraftMappingPatchBody(body: DraftMappingPatchBody) {
  return {
    fields: body.fields,
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : undefined,
  };
}

export function parsePublishReviewBody(body: { fields?: unknown; note?: unknown }): PublishReviewBody {
  return {
    fields: body.fields,
    note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : null,
  };
}

export function parseFailedReason(body: { reason?: unknown }) {
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return { ok: false as const, error: "reason is required", status: 400 };
  }
  if (reason.length > 1000) {
    return { ok: false as const, error: "reason too long (max 1000 chars)", status: 400 };
  }
  return { ok: true as const, reason };
}
