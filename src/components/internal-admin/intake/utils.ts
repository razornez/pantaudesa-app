/**
 * Utility functions for Intake Workbench
 * Formatters and helpers
 */

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date time to Indonesian locale
 */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Format diff value for display
 */
export function formatDiffValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Belum ada nilai";
  }
  return String(value);
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================================================
// API Response Helpers
// ============================================================================

export interface PayloadError {
  error: string;
}

export function getPayloadError(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as PayloadError).error === "string"
  ) {
    return (payload as PayloadError).error;
  }
  return fallback;
}

export async function readJsonLikeResponse<T>(
  res: Response
): Promise<T | PayloadError> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as T | PayloadError;
  }

  const raw = await res.text();
  if (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html")) {
    return {
      error:
        res.status === 401 || res.status === 403
          ? "Sesi login berakhir atau akses internal admin ditolak. Silakan masuk ulang."
          : "Server mengembalikan halaman HTML, bukan JSON. Coba muat ulang lalu login ulang.",
    };
  }

  return {
    error: raw.trim() || "Respons server tidak valid.",
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if result has any errors
 */
export function hasErrors(result: { validation?: { issues?: Array<{ severity: string }> } }): boolean {
  return result.validation?.issues?.some((issue) => issue.severity === "error") ?? false;
}

/**
 * Check if result has any warnings
 */
export function hasWarnings(result: { validation?: { issues?: Array<{ severity: string }> } }): boolean {
  return result.validation?.issues?.some((issue) => issue.severity === "warning") ?? false;
}

// ============================================================================
// Counter Helpers
// ============================================================================

/**
 * Count items in array that match condition
 */
export function countWhere<T>(arr: T[], predicate: (item: T) => boolean): number {
  return arr.filter(predicate).length;
}

/**
 * Get count summary for diff
 */
export function getDiffCountSummary(diff: { addedCount: number; updatedCount: number; removedCount: number } | null): string {
  if (!diff) return "0";
  return String(diff.addedCount + diff.updatedCount + diff.removedCount);
}
