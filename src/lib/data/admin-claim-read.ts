import { cache } from "react";
import { db } from "@/lib/db";
import {
  getAdminClaimEligibility,
  isActiveClaimStatus,
  isActiveMemberStatus,
  type AdminClaimEligibility,
} from "@/lib/admin-claim/eligibility";
import { perfLogWithRows, perfQueryShape, perfStart } from "@/lib/perf";

export type AdminClaimDataStatus = "demo" | "source-found" | "needs-review";
export type AdminClaimStatus =
  | "none"
  | "pending"
  | "limited"
  | "verified"
  | "rejected"
  | "suspended"
  | "platform";
export type AdminClaimMethod = "OFFICIAL_EMAIL" | "WEBSITE_TOKEN" | "SUPPORT_REVIEW" | "INVITE";
export type AdminClaimRole = "WARGA" | "DESA" | "ADMIN";

export interface AdminClaimDesaOption {
  id: string;
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  websiteUrl: string | null;
  dataStatus: AdminClaimDataStatus;
  sourceLabel: string;
  officialEmailLabel: string;
}

export interface AdminClaimStateCard {
  key: string;
  title: string;
  status: AdminClaimStatus;
  subtitle: string;
  note: string;
  desaName: string;
  roleLabel: string;
  userName: string;
  methodLabel?: string;
  dataStatus: AdminClaimDataStatus;
  sourceLabel: string;
  isDemo: boolean;
}

export interface AdminClaimActiveClaim {
  id: string;
  desaId: string;
  desaName: string;
  status: string;
  method: AdminClaimMethod | null;
  officialEmail: string | null;
  websiteUrl: string | null;
  tokenExpiresAt: string | null;
  hasActiveToken: boolean;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export interface AdminClaimActiveMember {
  id: string;
  desaId: string;
  desaName: string;
  status: string;
  role: string;
  joinedAt: string;
}

interface AdminClaimProfileBaseData {
  source: "database" | "fallback";
  currentUser: {
    id: string;
    nama: string;
    username: string;
    email: string;
    role: AdminClaimRole;
  } | null;
  currentState: AdminClaimStateCard;
  currentClaim: AdminClaimActiveClaim | null;
  currentMember: AdminClaimActiveMember | null;
}

export interface AdminClaimProfileSummaryData extends AdminClaimProfileBaseData {
  detail: "summary";
}

export interface AdminClaimProfileData extends AdminClaimProfileBaseData {
  detail: "full";
  selectedDesaId: string | null;
  eligibility: AdminClaimEligibility;
  desaOptions: AdminClaimDesaOption[];
}

type DesaSourceRow = {
  sourceName: string;
  accessStatus: string;
  dataStatus: string;
};

type DesaRow = {
  id: string;
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  websiteUrl: string | null;
  dataSources: DesaSourceRow[];
};

type ClaimRow = {
  id: string;
  status: string;
  method: string | null;
  officialEmail: string | null;
  websiteUrl: string | null;
  tokenHash: string | null;
  tokenExpiresAt: Date | null;
  verifiedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  desa: {
    id: string;
    nama: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    websiteUrl: string | null;
    dataSources: DesaSourceRow[];
  };
  user: {
    id: string;
    nama: string | null;
    username: string | null;
    email: string;
    role: AdminClaimRole;
  };
};

type MemberRow = {
  id: string;
  role: string;
  status: string;
  joinedAt: Date;
  desa: {
    id: string;
    nama: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    websiteUrl: string | null;
    dataSources: DesaSourceRow[];
  };
  user: {
    id: string;
    nama: string | null;
    username: string | null;
    email: string;
    role: AdminClaimRole;
  };
};

const FALLBACK_DESA_OPTIONS: AdminClaimDesaOption[] = [
  {
    id: "1",
    nama: "Desa Sukamaju",
    kecamatan: "Ciawi",
    kabupaten: "Bogor",
    provinsi: "Jawa Barat",
    websiteUrl: "https://sukamaju.desa.id",
    dataStatus: "source-found",
    sourceLabel: "Website publik desa",
    officialEmailLabel: "Belum tercatat",
  },
  {
    id: "4",
    nama: "Desa Sumber Rejeki",
    kecamatan: "Mlati",
    kabupaten: "Sleman",
    provinsi: "D.I. Yogyakarta",
    websiteUrl: "https://sumberrejeki.desa.id",
    dataStatus: "source-found",
    sourceLabel: "Website publik desa",
    officialEmailLabel: "Belum tercatat",
  },
  {
    id: "9",
    nama: "Desa Pura Harapan",
    kecamatan: "Taman",
    kabupaten: "Sidoarjo",
    provinsi: "Jawa Timur",
    websiteUrl: null,
    dataStatus: "needs-review",
    sourceLabel: "Sumber publik perlu dicek ulang",
    officialEmailLabel: "Belum tercatat",
  },
  {
    id: "ancolmekar",
    nama: "Desa Ancolmekar",
    kecamatan: "Arjasari",
    kabupaten: "Bandung",
    provinsi: "Jawa Barat",
    websiteUrl: "https://ancolmekar.desa.id/",
    dataStatus: "source-found",
    sourceLabel: "Website resmi desa",
    officialEmailLabel: "Belum tercatat",
  },
];

const FALLBACK_DEMO_STATES: AdminClaimStateCard[] = [
  {
    key: "warga-demo",
    title: "Warga Demo",
    status: "none",
    subtitle: "Belum mengajukan",
    note: "Akun warga biasa belum memiliki klaim admin desa.",
    desaName: "Belum dipilih",
    roleLabel: "Warga",
    userName: "Warga Demo",
    dataStatus: "demo",
    sourceLabel: "Data demo",
    isDemo: true,
  },
  {
    key: "pending-demo",
    title: "Pengaju Admin Desa",
    status: "pending",
    subtitle: "Menunggu verifikasi",
    note: "Klaim sedang menunggu pengecekan kanal resmi desa.",
    desaName: "Desa Sumber Rejeki",
    roleLabel: "Warga",
    userName: "Pengaju Admin Demo",
    methodLabel: "Email resmi",
    dataStatus: "source-found",
    sourceLabel: "Website publik desa",
    isDemo: true,
  },
  {
    key: "limited-demo",
    title: "Admin Desa Limited",
    status: "limited",
    subtitle: "Akses terbatas",
    note: "Bisa menyiapkan klarifikasi, tetapi belum tampil sebagai admin terverifikasi.",
    desaName: "Desa Sumber Rejeki",
    roleLabel: "Perwakilan desa",
    userName: "Admin Desa Limited",
    methodLabel: "Undangan demo",
    dataStatus: "source-found",
    sourceLabel: "Sumber publik ditemukan",
    isDemo: true,
  },
  {
    key: "verified-demo",
    title: "Admin Desa Terverifikasi",
    status: "verified",
    subtitle: "Tercatat terhubung",
    note: "Contoh tampilan untuk status yang sudah lolos kanal resmi desa.",
    desaName: "Desa Sumber Rejeki",
    roleLabel: "Perwakilan desa",
    userName: "Admin Desa Verified",
    methodLabel: "Website token",
    dataStatus: "source-found",
    sourceLabel: "Sumber publik ditemukan",
    isDemo: true,
  },
  {
    key: "rejected-demo",
    title: "Pengajuan belum bisa diterima",
    status: "rejected",
    subtitle: "Klaim belum cukup bukti",
    note: "Contoh ketika data pendukung belum lengkap atau belum cocok dengan kanal resmi.",
    desaName: "Desa Pura Harapan",
    roleLabel: "Warga",
    userName: "Admin Desa Rejected",
    methodLabel: "Support review",
    dataStatus: "needs-review",
    sourceLabel: "Perlu review",
    isDemo: true,
  },
  {
    key: "suspended-demo",
    title: "Akses sedang ditinjau",
    status: "suspended",
    subtitle: "Perlu dicek ulang",
    note: "Contoh ketika ada perubahan yang perlu ditinjau ulang sebelum akses dibuka lagi.",
    desaName: "Desa Sukamaju",
    roleLabel: "Perwakilan desa",
    userName: "Admin Desa Suspended",
    methodLabel: "Audit demo",
    dataStatus: "needs-review",
    sourceLabel: "Perlu review",
    isDemo: true,
  },
  {
    key: "platform-demo",
    title: "Platform Admin Demo",
    status: "platform",
    subtitle: "Admin platform",
    note: "Akun lintas desa untuk pengelolaan sistem, bukan tanda verifikasi desa.",
    desaName: "Lintas desa",
    roleLabel: "Admin platform",
    userName: "Platform Admin Demo",
    methodLabel: "Role platform",
    dataStatus: "demo",
    sourceLabel: "Data demo",
    isDemo: true,
  },
];

function getDataStatusKind(desa: DesaRow): AdminClaimDataStatus {
  const hasReviewFlag = desa.dataSources.some((source) => source.dataStatus === "needs_review" || source.accessStatus === "requires_review");
  if (hasReviewFlag) return "needs-review";
  if (desa.dataSources.length > 0 || desa.websiteUrl) return "source-found";
  return "demo";
}

function getSourceLabel(desa: DesaRow) {
  const primarySource = desa.dataSources[0]?.sourceName;
  if (primarySource) return primarySource;
  if (desa.websiteUrl) return "Website publik desa";
  return "Data demo";
}

function buildDesaOption(desa: DesaRow): AdminClaimDesaOption {
  return {
    id: desa.id,
    nama: desa.nama,
    kecamatan: desa.kecamatan,
    kabupaten: desa.kabupaten,
    provinsi: desa.provinsi,
    websiteUrl: desa.websiteUrl,
    dataStatus: getDataStatusKind(desa),
    sourceLabel: getSourceLabel(desa),
    officialEmailLabel: "Belum tercatat",
  };
}

function statusCopy(status: AdminClaimStatus) {
  switch (status) {
    case "pending":
      return {
        title: "Menunggu verifikasi",
        subtitle: "Kami masih perlu memastikan klaim ini melalui kanal resmi desa.",
      };
    case "limited":
      return {
        title: "Akses terbatas",
        subtitle: "Kamu bisa menyiapkan dokumen atau klarifikasi, tetapi belum tampil sebagai Admin Desa Terverifikasi.",
      };
    case "verified":
      return {
        title: "Admin Desa Terverifikasi",
        subtitle: "Akun ini sudah terhubung dengan kanal resmi desa.",
      };
    case "rejected":
      return {
        title: "Pengajuan belum bisa diterima",
        subtitle: "Klaim ini belum memenuhi bukti yang dibutuhkan.",
      };
    case "suspended":
      return {
        title: "Akses sedang ditinjau",
        subtitle: "Ada laporan atau perubahan yang perlu dicek ulang.",
      };
    case "platform":
      return {
        title: "Admin Platform",
        subtitle: "Akun ini mengelola ruang pantau lintas desa, bukan verifikasi desa.",
      };
    case "none":
    default:
      return {
        title: "Belum mengajukan",
        subtitle: "Kamu belum punya klaim admin desa yang tercatat.",
      };
  }
}

function roleLabel(role: AdminClaimRole) {
  if (role === "ADMIN") return "Admin platform";
  if (role === "DESA") return "Perwakilan desa";
  return "Warga";
}

function adminClaimMethodLabel(method: string | null | undefined) {
  switch (method) {
    case "OFFICIAL_EMAIL":
      return "Email resmi";
    case "WEBSITE_TOKEN":
      return "Website token";
    case "SUPPORT_REVIEW":
      return "Support review";
    case "INVITE":
      return "Undangan";
    default:
      return "Belum memilih metode";
  }
}

function buildCurrentCard(
  user: AdminClaimProfileData["currentUser"],
  claim: ClaimRow | null,
  member: MemberRow | null,
  desaOptions: AdminClaimDesaOption[],
): AdminClaimStateCard {
  if (member?.status === "VERIFIED" && member.role === "VERIFIED_ADMIN") {
    const detail = statusCopy("verified");
    return {
      key: "current-verified",
      title: detail.title,
      status: "verified",
      subtitle: detail.subtitle,
      note: "Status ini dibaca dari membership desa yang tercatat di database.",
      desaName: member.desa.nama,
      roleLabel: roleLabel(member.user.role),
      userName: member.user.nama ?? member.user.username ?? member.user.email,
      methodLabel: claim?.method ? adminClaimMethodLabel(claim.method) : "Status membership terverifikasi",
      dataStatus: getDataStatusKind(member.desa),
      sourceLabel: getSourceLabel(member.desa),
      isDemo: false,
    };
  }

  if (member?.status === "LIMITED") {
    const detail = statusCopy("limited");
    return {
      key: "current-limited",
      title: detail.title,
      status: "limited",
      subtitle: detail.subtitle,
      note: "User role alone tidak cukup untuk jadi Admin Desa Terverifikasi.",
      desaName: member.desa.nama,
      roleLabel: roleLabel(member.user.role),
      userName: member.user.nama ?? member.user.username ?? member.user.email,
      methodLabel: claim?.method ? adminClaimMethodLabel(claim.method) : "Invite demo",
      dataStatus: getDataStatusKind(member.desa),
      sourceLabel: getSourceLabel(member.desa),
      isDemo: false,
    };
  }

  if (member?.status === "REVOKED" || member?.status === "EXPIRED") {
    const detail = statusCopy("suspended");
    const desa = member?.desa ?? claim?.desa ?? null;
    return {
      key: "current-suspended",
      title: detail.title,
      status: "suspended",
      subtitle: detail.subtitle,
      note: "Akses dibekukan sementara sampai ada peninjauan ulang.",
      desaName: desa?.nama ?? "Belum dipilih",
      roleLabel: roleLabel(user?.role ?? "WARGA"),
      userName: user?.nama ?? user?.username ?? user?.email ?? "Akun saya",
      methodLabel: claim?.method ? adminClaimMethodLabel(claim.method) : "Review demo",
      dataStatus: desa ? getDataStatusKind(desa) : "demo",
      sourceLabel: desa ? getSourceLabel(desa) : "Data demo",
      isDemo: false,
    };
  }

  if (claim?.status === "PENDING" || claim?.status === "IN_REVIEW") {
    const detail = statusCopy("pending");
    return {
      key: "current-pending",
      title: detail.title,
      status: "pending",
      subtitle: detail.subtitle,
      note: "Tahap ini masih menunggu pengecekan kanal resmi desa.",
      desaName: claim.desa.nama,
      roleLabel: roleLabel(user?.role ?? "WARGA"),
      userName: user?.nama ?? user?.username ?? user?.email ?? "Akun saya",
      methodLabel: adminClaimMethodLabel(claim.method),
      dataStatus: getDataStatusKind(claim.desa),
      sourceLabel: getSourceLabel(claim.desa),
      isDemo: false,
    };
  }

  if (claim?.status === "APPROVED") {
    // APPROVED claim → membership should be VERIFIED; handled above via member check
    // Fallthrough to none if somehow member hasn't been created yet
  }

  if (claim?.status === "REJECTED") {
    const detail = statusCopy("rejected");
    return {
      key: "current-rejected",
      title: detail.title,
      status: "rejected",
      subtitle: detail.subtitle,
      note: claim.rejectionReason ?? "Klaim ini belum memenuhi bukti yang dibutuhkan.",
      desaName: claim.desa.nama,
      roleLabel: roleLabel(user?.role ?? "WARGA"),
      userName: user?.nama ?? user?.username ?? user?.email ?? "Akun saya",
      methodLabel: adminClaimMethodLabel(claim.method),
      dataStatus: getDataStatusKind(claim.desa),
      sourceLabel: getSourceLabel(claim.desa),
      isDemo: false,
    };
  }

  if (user?.role === "ADMIN") {
    const detail = statusCopy("platform");
    return {
      key: "current-platform",
      title: detail.title,
      status: "platform",
      subtitle: detail.subtitle,
      note: "Role platform tidak otomatis membuat akun menjadi Admin Desa.",
      desaName: "Lintas desa",
      roleLabel: roleLabel(user.role),
      userName: user.nama || user.username || user.email,
      dataStatus: "demo",
      sourceLabel: "Data demo",
      isDemo: false,
    };
  }

  const detail = statusCopy("none");
  const fallbackDesa = desaOptions[0] ?? FALLBACK_DESA_OPTIONS[0];
  return {
    key: "current-none",
    title: detail.title,
    status: "none",
    subtitle: detail.subtitle,
    note:
      user?.role === "DESA"
        ? "Role aplikasi DESA belum otomatis menjadi Admin Desa. Tetap perlu relasi claim/member yang tercatat."
        : "Mulai dari memilih desa dan kanal verifikasi yang resmi.",
    desaName: fallbackDesa?.nama ?? "Belum dipilih",
    roleLabel: roleLabel(user?.role ?? "WARGA"),
    userName: user?.nama ?? user?.username ?? user?.email ?? "Akun saya",
    dataStatus: fallbackDesa?.dataStatus ?? "demo",
    sourceLabel: fallbackDesa?.sourceLabel ?? "Data demo",
    isDemo: true,
  };
}

function fallbackSummaryData(): AdminClaimProfileSummaryData {
  return {
    detail: "summary",
    source: "fallback",
    currentUser: null,
    currentState: FALLBACK_DEMO_STATES[0],
    currentClaim: null,
    currentMember: null,
  };
}

function fallbackProfileData(): AdminClaimProfileData {
  return {
    ...fallbackSummaryData(),
    detail: "full",
    selectedDesaId: FALLBACK_DESA_OPTIONS[1]?.id ?? FALLBACK_DESA_OPTIONS[0]?.id ?? null,
    eligibility: getAdminClaimEligibility({}),
    desaOptions: FALLBACK_DESA_OPTIONS,
  };
}

const currentUserSelect = {
  id: true,
  nama: true,
  username: true,
  email: true,
  role: true,
  desaAdminClaims: {
    orderBy: { updatedAt: "desc" },
    take: 1,
    select: {
      id: true,
      status: true,
      method: true,
      officialEmail: true,
      websiteUrl: true,
      tokenHash: true,
      tokenExpiresAt: true,
      verifiedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      desa: {
        select: {
          id: true,
          nama: true,
          kecamatan: true,
          kabupaten: true,
          provinsi: true,
          websiteUrl: true,
          dataSources: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              sourceName: true,
              accessStatus: true,
              dataStatus: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          nama: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  },
  desaAdminMembers: {
    orderBy: { updatedAt: "desc" },
    take: 1,
    select: {
      id: true,
      role: true,
      status: true,
      joinedAt: true,
      desa: {
        select: {
          id: true,
          nama: true,
          kecamatan: true,
          kabupaten: true,
          provinsi: true,
          websiteUrl: true,
          dataSources: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              sourceName: true,
              accessStatus: true,
              dataStatus: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          nama: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  },
} as const;

async function fetchCurrentUser(userId: string | null | undefined) {
  if (!userId) return null;
  return db?.user.findUnique({
    where: { id: userId },
    select: currentUserSelect,
  }) ?? null;
}

function serializeCurrentUser(
  currentUser: Awaited<ReturnType<typeof fetchCurrentUser>>,
): AdminClaimProfileSummaryData["currentUser"] {
  if (!currentUser) return null;
  return {
    id: currentUser.id,
    nama: currentUser.nama ?? currentUser.username ?? currentUser.email,
    username: currentUser.username ?? "",
    email: currentUser.email,
    role: currentUser.role as AdminClaimRole,
  };
}

function serializeActiveClaim(currentClaim: ClaimRow | null): AdminClaimProfileSummaryData["currentClaim"] {
  if (!currentClaim || !isActiveClaimStatus(currentClaim.status)) return null;
  return {
    id: currentClaim.id,
    desaId: currentClaim.desa.id,
    desaName: currentClaim.desa.nama,
    status: currentClaim.status,
    method: (currentClaim.method as AdminClaimMethod | null) ?? null,
    officialEmail: currentClaim.officialEmail,
    websiteUrl: currentClaim.websiteUrl,
    tokenExpiresAt: currentClaim.tokenExpiresAt?.toISOString() ?? null,
    hasActiveToken: Boolean(currentClaim.tokenHash && currentClaim.tokenExpiresAt),
    verifiedAt: currentClaim.verifiedAt?.toISOString() ?? null,
    rejectedAt: currentClaim.rejectedAt?.toISOString() ?? null,
    rejectionReason: currentClaim.rejectionReason,
  };
}

function serializeActiveMember(currentMember: MemberRow | null): AdminClaimProfileSummaryData["currentMember"] {
  if (!currentMember || !isActiveMemberStatus(currentMember.status)) return null;
  return {
    id: currentMember.id,
    desaId: currentMember.desa.id,
    desaName: currentMember.desa.nama,
    status: currentMember.status,
    role: currentMember.role,
    joinedAt: currentMember.joinedAt.toISOString(),
  };
}

async function readAdminClaimProfile(
  userId: string | null | undefined,
  detail: "summary" | "full",
): Promise<AdminClaimProfileSummaryData | AdminClaimProfileData> {
  if (!db) return detail === "full" ? fallbackProfileData() : fallbackSummaryData();

  const routeLabel = detail === "full" ? "admin-claim.profile.full" : "admin-claim.profile.summary";
  const desaTake = detail === "full" ? 12 : 1;

  perfQueryShape(routeLabel, "desa.findMany", `orderBy:namaAsc;take:${desaTake};select:desaOptionFields+latestSource`);
  perfQueryShape(routeLabel, "user.findUnique", "where:id;select:currentUserClaimAndMember");

  try {
    const tQuery = perfStart();
    const [desaRows, currentUser] = await Promise.all([
      db.desa.findMany({
        orderBy: [{ nama: "asc" }],
        take: desaTake,
        select: {
          id: true,
          nama: true,
          kecamatan: true,
          kabupaten: true,
          provinsi: true,
          websiteUrl: true,
          dataSources: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              sourceName: true,
              accessStatus: true,
              dataStatus: true,
            },
          },
        },
      }),
      fetchCurrentUser(userId),
    ]);
    perfLogWithRows(routeLabel, "dbQuery", desaRows.length + (currentUser ? 1 : 0), tQuery);

    const desaOptions = desaRows.map(buildDesaOption);
    const fallbackOptions = desaOptions.length > 0 ? desaOptions : FALLBACK_DESA_OPTIONS;
    const normalizedUser = serializeCurrentUser(currentUser);
    const currentClaim = currentUser?.desaAdminClaims[0]
      ? currentUser.desaAdminClaims[0] as ClaimRow
      : null;
    const currentMember = currentUser?.desaAdminMembers[0]
      ? currentUser.desaAdminMembers[0] as MemberRow
      : null;
    const activeClaim = serializeActiveClaim(currentClaim);
    const activeMember = serializeActiveMember(currentMember);
    const currentState = buildCurrentCard(
      normalizedUser,
      currentClaim,
      currentMember,
      fallbackOptions,
    );

    const summary: AdminClaimProfileSummaryData = {
      detail: "summary",
      source: "database",
      currentUser: normalizedUser,
      currentState,
      currentClaim: activeClaim,
      currentMember: activeMember,
    };

    if (detail === "summary") {
      return summary;
    }

    const selectedDesaId = currentClaim?.desa.id ?? currentMember?.desa.id ?? desaOptions[0]?.id ?? null;
    const eligibility = getAdminClaimEligibility({
      activeClaim: activeClaim
        ? {
            desaId: activeClaim.desaId,
            desaName: activeClaim.desaName,
            status: activeClaim.status,
            source: "claim",
          }
        : null,
      activeMember: activeMember
        ? {
            desaId: activeMember.desaId,
            desaName: activeMember.desaName,
            status: activeMember.status,
            source: "member",
          }
        : null,
      targetDesaId: selectedDesaId,
    });

    return {
      ...summary,
      detail: "full",
      selectedDesaId,
      eligibility,
      desaOptions,
    };
  } catch (error) {
    console.error("[admin-claim-read] falling back to profile defaults:", error);
    return detail === "full" ? fallbackProfileData() : fallbackSummaryData();
  }
}

export const getAdminClaimProfileSummaryData = cache(async function getAdminClaimProfileSummaryData(
  userId: string | null | undefined,
): Promise<AdminClaimProfileSummaryData> {
  const data = await readAdminClaimProfile(userId, "summary");
  return data as AdminClaimProfileSummaryData;
});

export const getAdminClaimProfileData = cache(async function getAdminClaimProfileData(
  userId: string | null | undefined,
): Promise<AdminClaimProfileData> {
  const data = await readAdminClaimProfile(userId, "full");
  return data as AdminClaimProfileData;
});

export { FALLBACK_DEMO_STATES, FALLBACK_DESA_OPTIONS };
