interface ApiErrorPayload {
  error?: string;
}

function getErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return typeof payload.error === "string" ? payload.error : fallback;
}

export async function approveClaim(claimId: string): Promise<void> {
  const response = await fetch(`/api/internal-admin/claims/${claimId}/approve`, {
    method: "POST",
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Persetujuan pengajuan belum berhasil."));
  }
}

export async function rejectClaim(
  claimId: string,
  input: {
    reasonCategory: string;
    reasonText: string;
    fixInstructions: string;
    isFraud: boolean;
  },
): Promise<void> {
  const response = await fetch(`/api/internal-admin/claims/${claimId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Penolakan pengajuan belum berhasil disimpan."));
  }
}
