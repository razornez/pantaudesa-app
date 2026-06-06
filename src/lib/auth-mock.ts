/**
 * auth-mock.ts — simulasi autentikasi & session untuk demo.
 * Ganti dengan API calls nyata saat backend tersedia.
 */

export type UserRole = "DESA" | "ADMIN" | "WARGA";

export interface AuthUser {
  id:        string;
  nama:      string;
  username:  string;  // @handle, unik, tidak bisa diubah
  email:     string;
  role:      UserRole;
  avatarUrl?: string;
  bio?:       string;
  joinedAt:   Date;
  // Hanya untuk role "desa"
  desaId?:   string;
  desaNama?: string;
}

// ─── Mock accounts ────────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: Record<string, AuthUser> = {
  // Desa accounts
  "desa.sukamaju@gmail.com": {
    id: "u1", nama: "H. Asep Supriatna, S.H.", username: "kades_sukamaju",
    email: "desa.sukamaju@gmail.com", role: "DESA",
    desaId: "1", desaNama: "Desa Sukamaju",
    joinedAt: new Date("2024-01-15"),
  },
  "desa.harapanjaya@gmail.com": {
    id: "u2", nama: "Dadang Sutisna, A.Md.", username: "kades_harapanjaya",
    email: "desa.harapanjaya@gmail.com", role: "DESA",
    desaId: "2", desaNama: "Desa Harapan Jaya",
    joinedAt: new Date("2024-02-01"),
  },
  // Admin
  "admin@pantaudesa.id": {
    id: "a1", nama: "Admin PantauDesa", username: "admin_pantaudesa",
    email: "admin@pantaudesa.id", role: "ADMIN",
    joinedAt: new Date("2023-12-01"),
  },
  // Warga accounts (demo)
  "pak.muryanto@gmail.com": {
    id: "w1", nama: "Pak Muryanto", username: "muryanto87",
    email: "pak.muryanto@gmail.com", role: "WARGA",
    bio: "Warga Desa Maju Bersama. Peduli transparansi anggaran desa.",
    joinedAt: new Date("2024-03-10"),
  },
  "ibu.sumarni@gmail.com": {
    id: "w2", nama: "Ibu Sumarni", username: "sumarni_warga",
    email: "ibu.sumarni@gmail.com", role: "WARGA",
    bio: "Ibu rumah tangga yang ingin tahu anggaran desanya dipakai untuk apa.",
    joinedAt: new Date("2024-04-05"),
  },
};

// ─── OTP simulation ───────────────────────────────────────────────────────────

const OTP_STORE: Record<string, { code: string; expiresAt: number }> = {};

export function generateOTP(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  OTP_STORE[email] = { code, expiresAt: Date.now() + 5 * 60_000 };
  console.info(`[MOCK OTP] ${email} → ${code}`);
  return code;
}

export function verifyOTP(email: string, code: string): boolean {
  const entry = OTP_STORE[email];
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { delete OTP_STORE[email]; return false; }
  if (entry.code !== code) return false;
  delete OTP_STORE[email];
  return true;
}

export function getAccountByEmail(email: string): AuthUser | null {
  return MOCK_ACCOUNTS[email] ?? null;
}

// ─── Document status ──────────────────────────────────────────────────────────

export type DocStatus = "menunggu_review" | "disetujui" | "ditolak";

export interface UploadedDoc {
  id:          string;
  desaId:      string;
  desaNama:    string;
  jenis:       string;
  nama:        string;
  tahun:       number;
  fileUrl:     string;
  fileSize:    string;
  uploadedAt:  Date;
  uploadedBy:  string;
  status:      DocStatus;
  reviewNote?: string;
  reviewedAt?: Date;
}

export const MOCK_UPLOADS: UploadedDoc[] = [
  {
    id: "doc1", desaId: "1", desaNama: "Desa Sukamaju",
    jenis: "APBDes", nama: "APBDes Sukamaju 2024.pdf", tahun: 2024,
    fileUrl: "#", fileSize: "2.4 MB",
    uploadedAt: new Date(Date.now() - 3 * 86_400_000),
    uploadedBy: "H. Asep Supriatna",
    status: "disetujui", reviewedAt: new Date(Date.now() - 2 * 86_400_000),
  },
  {
    id: "doc2", desaId: "1", desaNama: "Desa Sukamaju",
    jenis: "LPPD", nama: "LPPD Sukamaju 2023.pdf", tahun: 2023,
    fileUrl: "#", fileSize: "1.8 MB",
    uploadedAt: new Date(Date.now() - 10 * 86_400_000),
    uploadedBy: "H. Asep Supriatna",
    status: "menunggu_review",
  },
  {
    id: "doc3", desaId: "2", desaNama: "Desa Harapan Jaya",
    jenis: "RKP", nama: "RKP Harapan Jaya 2024.pdf", tahun: 2024,
    fileUrl: "#", fileSize: "3.1 MB",
    uploadedAt: new Date(Date.now() - 1 * 86_400_000),
    uploadedBy: "Dadang Sutisna",
    status: "menunggu_review",
  },
  {
    id: "doc4", desaId: "2", desaNama: "Desa Harapan Jaya",
    jenis: "APBDes", nama: "APBDes Harapan Jaya 2024.pdf", tahun: 2024,
    fileUrl: "#", fileSize: "2.9 MB",
    uploadedAt: new Date(Date.now() - 15 * 86_400_000),
    uploadedBy: "Dadang Sutisna",
    status: "ditolak",
    reviewNote: "File tidak terbaca. Harap upload ulang dalam format PDF yang valid.",
    reviewedAt: new Date(Date.now() - 13 * 86_400_000),
  },
];
