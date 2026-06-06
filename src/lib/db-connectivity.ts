export function getErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }

  return "";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isDatabaseConnectivityError(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P2024" ||
    code === "P2028" ||
    /Can't reach database server/i.test(message) ||
    /connect ETIMEDOUT/i.test(message) ||
    /ECONNRESET/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /EHOSTUNREACH/i.test(message) ||
    /Timed out fetching a new connection/i.test(message) ||
    /Timed out waiting for a connection from the pool/i.test(message) ||
    /Connection terminated unexpectedly/i.test(message) ||
    /connection refused/i.test(message) ||
    /Transaction not found/i.test(message) ||
    /Transaction already closed/i.test(message) ||
    /A query cannot be executed on an expired transaction/i.test(message)
  );
}

export function isDatabaseSchemaMismatchError(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  return (
    code === "P2022" ||
    /does not exist in the current database/i.test(message) ||
    /column .* does not exist/i.test(message)
  );
}

export function getDatabaseUnavailableMessage(): string {
  return "Koneksi database Supabase dari runtime lokal sedang tidak tersedia. Coba lagi setelah jalur koneksi Postgres pulih.";
}

export function getDatabaseSchemaMismatchMessage(featureLabel: string): string {
  return `Skema database lokal untuk ${featureLabel} belum aktif. Jalankan migration Batch 4 dulu agar kolom dan tabel source-backed submission tersedia.`;
}
