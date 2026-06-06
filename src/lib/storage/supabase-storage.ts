import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client for storage operations.
// Uses service role key — NEVER import this file from a client component.

let _client: SupabaseClient | null = null;
let _bucket: string | null = null;

export const ADMIN_DESA_DOCUMENTS_BUCKET_DEFAULT = "admin-desa-documents";
export const SIGNED_URL_TTL_SECONDS_DEFAULT = 900; // 15 minutes

export interface StorageConfigurationStatus {
  configured: boolean;
  bucket: string;
  missingEnvVars: string[];
  invalidEnvVars: string[];
}

function getConfiguredBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET_ADMIN_DESA_DOCUMENTS ?? ADMIN_DESA_DOCUMENTS_BUCKET_DEFAULT;
}

export function getStorageConfigurationStatus(): StorageConfigurationStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const missingEnvVars: string[] = [];
  const invalidEnvVars: string[] = [];
  const looksLikeJwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(serviceRoleKey);
  const looksLikeSecretKey = serviceRoleKey.startsWith("sb_secret_");

  if (!url) missingEnvVars.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");
  if (url && !/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)) {
    invalidEnvVars.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (serviceRoleKey && !looksLikeJwt && !looksLikeSecretKey) {
    invalidEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    configured: missingEnvVars.length === 0 && invalidEnvVars.length === 0,
    bucket: getConfiguredBucketName(),
    missingEnvVars,
    invalidEnvVars,
  };
}

export function getStorageConfigurationErrorMessage(
  status = getStorageConfigurationStatus(),
): string {
  if (status.missingEnvVars.length > 0) {
    return `Storage belum terkonfigurasi. Env yang belum diisi: ${status.missingEnvVars.join(", ")}.`;
  }
  if (status.invalidEnvVars.length > 0) {
    return `Storage belum terkonfigurasi. Env ini formatnya tidak valid: ${status.invalidEnvVars.join(", ")}.`;
  }
  return "Storage belum terkonfigurasi. Hubungi admin PantauDesa.";
}

function getStorageClient(): { client: SupabaseClient; bucket: string } {
  if (_client && _bucket) return { client: _client, bucket: _bucket };

  const status = getStorageConfigurationStatus();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = status.bucket;

  if (!status.configured || !url || !serviceRoleKey) {
    throw new StorageNotConfiguredError(getStorageConfigurationErrorMessage(status));
  }

  _client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  _bucket = bucket;
  return { client: _client, bucket: _bucket };
}

export class StorageNotConfiguredError extends Error {
  code = "STORAGE_NOT_CONFIGURED" as const;
  constructor(message: string) {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

export class StorageOperationError extends Error {
  code: "STORAGE_OPERATION_FAILED" | "STORAGE_OBJECT_NOT_FOUND" = "STORAGE_OPERATION_FAILED";
  constructor(message: string) {
    super(message);
    this.name = "StorageOperationError";
  }
}

export class StorageObjectNotFoundError extends StorageOperationError {
  code = "STORAGE_OBJECT_NOT_FOUND" as const;
  constructor(message = "Object not found") {
    super(message);
    this.name = "StorageObjectNotFoundError";
  }
}

export function isStorageConfigured(): boolean {
  return getStorageConfigurationStatus().configured;
}

export function getSignedUrlTtl(): number {
  const raw = process.env.SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : SIGNED_URL_TTL_SECONDS_DEFAULT;
}

export interface UploadResult {
  storageKey: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload a buffer to the private bucket. The storageKey is the path within the
 * bucket — never expose this directly; always render via createSignedUrl.
 */
export async function uploadDocumentBuffer(
  storageKey: string,
  buffer: Buffer | Uint8Array,
  mimeType: string,
): Promise<UploadResult> {
  const { client, bucket } = getStorageClient();
  const { error } = await client.storage.from(bucket).upload(storageKey, buffer, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    throw new StorageOperationError(`Upload failed: ${error.message}`);
  }
  return { storageKey, fileSize: buffer.byteLength, mimeType };
}

/**
 * Create a short-lived signed URL for previewing a private object.
 * Default TTL: 15 minutes (configurable via SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS).
 */
export async function createDocumentSignedUrl(
  storageKey: string,
  ttlSeconds = getSignedUrlTtl(),
): Promise<string> {
  const { client, bucket } = getStorageClient();
  const { error: infoError } = await client.storage.from(bucket).info(storageKey);
  if (infoError) {
    if (/object not found/i.test(infoError.message)) {
      throw new StorageObjectNotFoundError();
    }
    throw new StorageOperationError(`Object info failed: ${infoError.message}`);
  }
  const { data, error } = await client.storage.from(bucket).createSignedUrl(storageKey, ttlSeconds);
  if (error || !data?.signedUrl) {
    if (error && /object not found/i.test(error.message)) {
      throw new StorageObjectNotFoundError();
    }
    throw new StorageOperationError(`Signed URL failed: ${error?.message ?? "no signedUrl returned"}`);
  }
  return data.signedUrl;
}

export async function downloadDocumentBuffer(storageKey: string): Promise<Buffer> {
  const { client, bucket } = getStorageClient();
  const { data, error } = await client.storage.from(bucket).download(storageKey);

  if (error || !data) {
    if (error && /object not found/i.test(error.message)) {
      throw new StorageObjectNotFoundError();
    }
    throw new StorageOperationError(`Download failed: ${error?.message ?? "no data returned"}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function deleteDocumentObject(storageKey: string): Promise<void> {
  const { client, bucket } = getStorageClient();
  const { error } = await client.storage.from(bucket).remove([storageKey]);
  if (error) {
    throw new StorageOperationError(`Delete failed: ${error.message}`);
  }
}

/**
 * Build a safe storage path: admin-desa/{desaId}/{yyyy}/{mm}/{documentId}-{safeFileName}
 */
export function buildDocumentStoragePath(desaId: string, documentId: string, fileName: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = sanitizeFileName(fileName);
  return `admin-desa/${desaId}/${yyyy}/${mm}/${documentId}-${safeName}`;
}

function sanitizeFileName(name: string): string {
  // Strip directory traversal, trim, allow only [A-Za-z0-9._-], collapse spaces, max 80 chars.
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}
