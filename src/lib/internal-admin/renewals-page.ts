import {
  RENEWAL_REMINDER_DAYS,
  daysUntilRenewal,
  getRenewalState,
} from "@/lib/admin-claim/renewal";
import { db } from "@/lib/db";
import { INTERNAL_RENEWAL_QUEUE_PAGE_SIZE } from "./constants";
import type { RenewalStateFilter } from "./page-params";

export interface RenewalQueueItem {
  id: string;
  userId: string;
  desaId: string;
  status: string;
  renewalDueAt: string | null;
  joinedAt: string;
  renewalState: "OK" | "DUE_SOON" | "URGENT" | "OVERDUE" | "NO_DUE_DATE";
  daysUntilRenewal: number | null;
  desa: { id: string; nama: string; kecamatan: string; kabupaten: string };
  user: { id: string; nama: string | null; username: string | null; email: string };
}

export async function loadRenewalQueue(state: RenewalStateFilter): Promise<{
  members: RenewalQueueItem[];
  stateFilter: RenewalStateFilter;
}> {
  if (!db) {
    throw new Error("Database belum tersedia. Cek konfigurasi server sebelum melanjutkan review perpanjangan.");
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + RENEWAL_REMINDER_DAYS * 86_400_000);
  const where = state === "OVERDUE"
    ? { status: "VERIFIED" as const, renewalDueAt: { lt: now } }
    : state === "DUE_SOON"
      ? { status: "VERIFIED" as const, renewalDueAt: { gte: now, lte: horizon } }
      : { status: "VERIFIED" as const, renewalDueAt: { not: null, lte: horizon } };

  const members = await db.desaAdminMember.findMany({
    where,
    orderBy: { renewalDueAt: "asc" },
    take: INTERNAL_RENEWAL_QUEUE_PAGE_SIZE,
    select: {
      id: true,
      userId: true,
      desaId: true,
      status: true,
      renewalDueAt: true,
      joinedAt: true,
      desa: { select: { id: true, nama: true, kecamatan: true, kabupaten: true } },
      user: { select: { id: true, nama: true, username: true, email: true } },
    },
  });

  return {
    members: members.map((member) => ({
      ...member,
      renewalDueAt: member.renewalDueAt?.toISOString() ?? null,
      joinedAt: member.joinedAt.toISOString(),
      renewalState: getRenewalState(member.renewalDueAt, now),
      daysUntilRenewal: daysUntilRenewal(member.renewalDueAt, now),
    })),
    stateFilter: state,
  };
}
