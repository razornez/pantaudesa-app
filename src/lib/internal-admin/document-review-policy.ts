type DocumentReviewStatus =
  | "WAITING_VERIFIED_APPROVAL"
  | "PROCESSING"
  | "PUBLISHED"
  | "REJECTED"
  | "FAILED";

interface PolicyError {
  status: number;
  error: string;
}

function requireReviewableStatus(
  status: DocumentReviewStatus,
  message: (status: DocumentReviewStatus) => string,
): PolicyError | null {
  if (status === "PROCESSING" || status === "WAITING_VERIFIED_APPROVAL") return null;
  return {
    status: 422,
    error: message(status),
  };
}

export function validateDraftGenerationStatus(
  status: DocumentReviewStatus,
): PolicyError | null {
  return requireReviewableStatus(
    status,
    (current) =>
      `AI mapping hanya berlaku untuk dokumen yang masih bisa direview. Status saat ini: ${current}.`,
  );
}

export function validateDraftSaveStatus(status: DocumentReviewStatus): PolicyError | null {
  return requireReviewableStatus(
    status,
    (current) =>
      `Draft review hanya berlaku untuk dokumen yang masih bisa direview. Status saat ini: ${current}.`,
  );
}

export function validatePublishStatus(status: DocumentReviewStatus): PolicyError | null {
  return requireReviewableStatus(
    status,
    (current) =>
      `Hanya dokumen yang masih bisa direview yang dapat dipublikasikan. Status saat ini: ${current}.`,
  );
}

export function validateFailStatus(status: DocumentReviewStatus): PolicyError | null {
  if (status === "PUBLISHED" || status === "FAILED" || status === "REJECTED") {
    return {
      status: 422,
      error: `Dokumen sudah dalam status final: ${status}.`,
    };
  }
  return null;
}
