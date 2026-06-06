import { db } from "@/lib/db";
import { CLAIM_QUEUE_PAGE_SIZE } from "./constants";
import {
  parseClaimStatuses,
  type ClaimQueueStatus,
  type ClaimsPageInput,
} from "./page-params";

export interface ClaimQueueItem {
  id: string;
  status: ClaimQueueStatus;
  method: string | null;
  officialEmail: string | null;
  websiteUrl: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  rejectCategory: string | null;
  rejectReason: string | null;
  rejectInstructions: string | null;
  reapplyAllowedAt: string | null;
  fraudCooldownUntil: string | null;
  supportSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  desa: {
    id: string;
    nama: string;
    kecamatan: string;
    kabupaten: string;
    websiteUrl: string | null;
  };
  user: { id: string; nama: string | null; username: string | null; email: string };
}

export async function loadClaimsQueue(input: ClaimsPageInput): Promise<{
  claims: ClaimQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter: string;
}> {
  if (!db) {
    throw new Error("Database belum tersedia. Cek konfigurasi server sebelum membuka antrean pengajuan.");
  }

  const statuses = parseClaimStatuses(input.statusFilter);
  const where = {
    status: { in: [...statuses] },
    ...(input.desaId ? { desaId: input.desaId } : {}),
  };

  const [claims, total] = await Promise.all([
    db.desaAdminClaim.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip: (input.page - 1) * CLAIM_QUEUE_PAGE_SIZE,
      take: CLAIM_QUEUE_PAGE_SIZE,
      select: {
        id: true,
        status: true,
        method: true,
        officialEmail: true,
        websiteUrl: true,
        verifiedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        rejectCategory: true,
        rejectReason: true,
        rejectInstructions: true,
        reapplyAllowedAt: true,
        fraudCooldownUntil: true,
        supportSubmittedAt: true,
        createdAt: true,
        updatedAt: true,
        desa: {
          select: { id: true, nama: true, kecamatan: true, kabupaten: true, websiteUrl: true },
        },
        user: { select: { id: true, nama: true, username: true, email: true } },
      },
    }),
    db.desaAdminClaim.count({ where }),
  ]);

  return {
    claims: claims.map((claim) => ({
      ...claim,
      verifiedAt: claim.verifiedAt?.toISOString() ?? null,
      rejectedAt: claim.rejectedAt?.toISOString() ?? null,
      reapplyAllowedAt: claim.reapplyAllowedAt?.toISOString() ?? null,
      fraudCooldownUntil: claim.fraudCooldownUntil?.toISOString() ?? null,
      supportSubmittedAt: claim.supportSubmittedAt?.toISOString() ?? null,
      createdAt: claim.createdAt.toISOString(),
      updatedAt: claim.updatedAt.toISOString(),
    })),
    total,
    page: input.page,
    pageSize: CLAIM_QUEUE_PAGE_SIZE,
    statusFilter: input.statusFilter,
  };
}
