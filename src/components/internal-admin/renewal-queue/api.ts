interface ApiErrorPayload {
  error?: string;
}

function getErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return typeof payload.error === "string" ? payload.error : fallback;
}

export async function approveRenewal(memberId: string): Promise<void> {
  const response = await fetch(`/api/internal-admin/members/${memberId}/renewal/approve`, {
    method: "POST",
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Aksi belum berhasil diproses."));
  }
}

export async function rejectRenewal(
  memberId: string,
  input: { reason: string; suspicious: boolean },
): Promise<void> {
  const response = await fetch(`/api/internal-admin/members/${memberId}/renewal/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Aksi belum berhasil diproses."));
  }
}
