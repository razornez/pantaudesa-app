// Centralized constants and validation for Admin Desa document uploads.

export const DEFAULT_MAX_FILE_SIZE_MB = 10;
export const DEFAULT_MAX_FILES_PER_UPLOAD = 5;
const MIME_EXTENSION_MAP = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls", ".xlsx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

const EXTENSION_MIME_MAP = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
} as const;

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DOCUMENT_CATEGORIES = [
  { value: "PROFIL_DESA",          label: "Profil Desa" },
  { value: "STRUKTUR_PERANGKAT",   label: "Struktur Perangkat" },
  { value: "KONTAK_RESMI",         label: "Kontak Resmi" },
  { value: "REGULASI_PERDES",      label: "Regulasi/Perdes" },
  { value: "LAPORAN_PUBLIKASI",    label: "Laporan/Publikasi" },
  { value: "LAINNYA",              label: "Lainnya" },
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]["value"];

export function getMaxFileSizeBytes(): number {
  const raw = process.env.ADMIN_DESA_DOCUMENT_MAX_FILE_SIZE_MB;
  const mb = raw ? parseInt(raw, 10) : DEFAULT_MAX_FILE_SIZE_MB;
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024;
}

export function getMaxFilesPerUpload(): number {
  const raw = process.env.ADMIN_DESA_DOCUMENT_MAX_FILES_PER_UPLOAD;
  const n = raw ? parseInt(raw, 10) : DEFAULT_MAX_FILES_PER_UPLOAD;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_FILES_PER_UPLOAD;
}

export function getAllowedMimeTypes(): string[] {
  const raw = process.env.ADMIN_DESA_DOCUMENT_ALLOWED_MIME_TYPES;
  if (!raw) return [...DEFAULT_ALLOWED_MIME_TYPES];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getAllowedFileExtensions(allowedMimeTypes = getAllowedMimeTypes()): string[] {
  const extensions = new Set<string>();
  for (const mime of allowedMimeTypes) {
    const mapped = MIME_EXTENSION_MAP[mime as keyof typeof MIME_EXTENSION_MAP] ?? [];
    for (const extension of mapped) {
      extensions.add(extension);
    }
  }
  return [...extensions];
}

export function getAcceptedFileInputValue(allowedMimeTypes = getAllowedMimeTypes()): string {
  return [...new Set([...allowedMimeTypes, ...getAllowedFileExtensions(allowedMimeTypes)])].join(",");
}

export function getAllowedFormatLabels(allowedMimeTypes = getAllowedMimeTypes()): string[] {
  const labels = new Set<string>();
  for (const extension of getAllowedFileExtensions(allowedMimeTypes)) {
    labels.add(extension.replace(".", "").toUpperCase());
  }
  return [...labels];
}

export function normalizeUploadMimeType(fileName: string, mimeType: string): string {
  const normalizedMime = mimeType.trim().toLowerCase();
  if (normalizedMime) return normalizedMime;

  const lowerName = fileName.trim().toLowerCase();
  const match = Object.entries(EXTENSION_MIME_MAP).find(([extension]) => lowerName.endsWith(extension));
  return match?.[1] ?? mimeType;
}

export function isValidCategory(category: string): category is DocumentCategory {
  return DOCUMENT_CATEGORIES.some((c) => c.value === category);
}

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; code: "FILE_TOO_LARGE" | "MIME_NOT_ALLOWED" | "EMPTY_FILE"; message: string };

function hasAllowedExtension(fileName: string, allowedExtensions: string[]): boolean {
  const lowerName = fileName.trim().toLowerCase();
  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}

export function validateUpload(file: { size: number; type: string; name?: string }): UploadValidationResult {
  if (file.size <= 0) {
    return { ok: false, code: "EMPTY_FILE", message: "File kosong tidak dapat diunggah." };
  }
  const maxBytes = getMaxFileSizeBytes();
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, code: "FILE_TOO_LARGE", message: `Ukuran file melebihi batas ${mb} MB.` };
  }
  const allowed = getAllowedMimeTypes();
  const normalizedType = file.name ? normalizeUploadMimeType(file.name, file.type) : file.type;
  const typeAllowed = normalizedType ? allowed.includes(normalizedType) : false;
  const allowedExtensions = getAllowedFileExtensions(allowed);
  const extensionAllowed = file.name ? hasAllowedExtension(file.name, allowedExtensions) : false;
  if (!typeAllowed && !extensionAllowed) {
    const formatList = getAllowedFormatLabels(allowed).join(", ");
    const currentType = normalizedType || "unknown";
    return { ok: false, code: "MIME_NOT_ALLOWED", message: `Tipe file ${currentType} tidak diizinkan. Format yang diizinkan: ${formatList}.` };
  }
  return { ok: true };
}
