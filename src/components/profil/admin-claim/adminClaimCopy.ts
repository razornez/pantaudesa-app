import type {
  AdminClaimActiveClaim,
  AdminClaimDataStatus,
  AdminClaimDesaOption,
  AdminClaimProfileSummaryData,
  AdminClaimStateCard,
} from "@/lib/data/admin-claim-read";
import type { AdminClaimPageNotice } from "@/lib/admin-claim/eligibility";
import type { AdminClaimProfileSnapshot } from "@/lib/admin-claim/profile-cache";

export type ClaimStep = 1 | 2 | 3 | 4;
export type ClaimMethod = "OFFICIAL_EMAIL" | "WEBSITE_TOKEN";

export const CLAIM_STEP_LABELS: Array<{ step: ClaimStep; label: string }> = [
  { step: 1, label: "Pilih desa" },
  { step: 2, label: "Cara verifikasi" },
  { step: 3, label: "Instruksi" },
  { step: 4, label: "Status" },
];

export const CLAIM_STATUS_BADGE_TEXT: Record<AdminClaimStateCard["status"], { short: string; full: string }> = {
  none: { short: "Belum klaim", full: "Belum mengajukan" },
  pending: { short: "Pending", full: "Menunggu verifikasi" },
  limited: { short: "Terbatas", full: "Akses terbatas" },
  verified: { short: "Terverifikasi", full: "Admin Desa Terverifikasi" },
  rejected: { short: "Belum diterima", full: "Pengajuan belum bisa diterima" },
  suspended: { short: "Ditinjau", full: "Akses sedang ditinjau" },
  platform: { short: "Platform", full: "Admin Platform" },
};

export const CLAIM_STATUS_COPY: Record<AdminClaimStateCard["status"], {
  title: string;
  note: string;
  tone: string;
}> = {
  none: {
    title: "Belum mengajukan",
    note: "Kamu belum punya klaim admin desa yang tercatat.",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
  },
  pending: {
    title: "Menunggu verifikasi",
    note: "Kami masih perlu memastikan klaim ini melalui kanal resmi desa.",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  limited: {
    title: "Akses terbatas",
    note: "Kamu bisa menyiapkan dokumen atau klarifikasi, tetapi belum tampil sebagai Admin Desa Terverifikasi.",
    tone: "border-sky-200 bg-sky-50 text-sky-800",
  },
  verified: {
    title: "Admin Desa Terverifikasi",
    note: "Akun ini sudah terhubung dengan kanal resmi desa.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  rejected: {
    title: "Pengajuan belum bisa diterima",
    note: "Klaim ini belum memenuhi bukti yang dibutuhkan.",
    tone: "border-rose-200 bg-rose-50 text-rose-800",
  },
  suspended: {
    title: "Akses sedang ditinjau",
    note: "Ada laporan atau perubahan yang perlu dicek ulang.",
    tone: "border-orange-200 bg-orange-50 text-orange-800",
  },
  platform: {
    title: "Admin Platform",
    note: "Akun ini mengelola ruang pantau lintas desa, bukan verifikasi desa.",
    tone: "border-violet-200 bg-violet-50 text-violet-800",
  },
};

export const METHOD_COPY: Record<ClaimMethod, {
  title: string;
  body: string;
  cta: string;
  instruction: string;
  note: string;
}> = {
  OFFICIAL_EMAIL: {
    title: "Email resmi",
    body: "Pilih ini jika kamu punya akses ke email resmi desa atau email yang tercantum di sumber resmi.",
    cta: "Pakai email resmi",
    instruction: "Masukkan email resmi desa lalu kirim tautan verifikasi. Buka tautan dari inbox untuk melanjutkan verifikasi.",
    note: "Jika tautan kedaluwarsa atau tidak masuk, kamu bisa kirim ulang.",
  },
  WEBSITE_TOKEN: {
    title: "Website resmi",
    body: "Pilih ini jika kamu bisa menaruh kode verifikasi di website resmi desa.",
    cta: "Pakai website resmi",
    instruction: "Generate token website, pasang token di website resmi desa, lalu cek token dari halaman ini.",
    note: "Token mentah hanya tampil di sesi aktif dan tidak disimpan di browser.",
  },
};

export function isDemoSession(
  data: AdminClaimProfileSnapshot | AdminClaimProfileSummaryData | null,
) {
  const email = data?.currentUser?.email?.toLowerCase() ?? "";
  return email.endsWith("@pantaudesa.local");
}

export function getSelectedDesa(
  desaOptions: AdminClaimDesaOption[],
  selectedDesaId: string | null,
) {
  return desaOptions.find((desa) => desa.id === selectedDesaId) ?? desaOptions[0] ?? null;
}

export function getCurrentStatusTone(status: AdminClaimStateCard["status"]) {
  return CLAIM_STATUS_COPY[status];
}

export function getCurrentDataStatus(
  data: AdminClaimProfileSnapshot | AdminClaimProfileSummaryData | null,
): AdminClaimDataStatus {
  return data?.currentState?.dataStatus ?? "demo";
}

export function getStepForCurrentFlow(claim: AdminClaimActiveClaim | null, status: AdminClaimStateCard["status"]): ClaimStep {
  if (claim?.status === "PENDING") return 3;
  if (status === "limited" || status === "verified" || status === "rejected" || status === "suspended") return 4;
  return 1;
}

export function getInitialMethod(claim: AdminClaimActiveClaim | null): ClaimMethod {
  return claim?.method === "WEBSITE_TOKEN" ? "WEBSITE_TOKEN" : "OFFICIAL_EMAIL";
}

export function getNoticeToneStyles(tone: NonNullable<AdminClaimPageNotice>["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-sky-200 bg-sky-50 text-sky-800";
  }
}
