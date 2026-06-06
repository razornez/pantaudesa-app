import { db } from "@/lib/db";
import { perfLog, perfLogWithRows, perfQueryShape, perfStart } from "@/lib/perf";

export interface DesaAdminRow {
  id: string;
  userId: string;
  status: "LIMITED" | "VERIFIED" | "REVOKED" | "EXPIRED";
  role: "LIMITED_ADMIN" | "VERIFIED_ADMIN";
  joinedAt: string;
  invitedAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  user: {
    id: string;
    email: string;
    nama: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface PendingInviteRow {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export interface DesaAdminRoster {
  active: DesaAdminRow[];   // LIMITED + VERIFIED
  history: DesaAdminRow[];  // REVOKED + EXPIRED
  pendingInvites: PendingInviteRow[];
  verifiedCount: number;
  limitedCount: number;
}

function buildDesaAdminRoster(
  members: Array<{
    id: string;
    userId: string;
    status: string;
    role: string;
    joinedAt: Date;
    invitedAt: Date | null;
    acceptedAt: Date | null;
    revokedAt: Date | null;
    revokedReason: string | null;
    user: {
      id: string;
      email: string;
      nama: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
  }>,
  invites: Array<{
    id: string;
    email: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  }>,
): DesaAdminRoster {
  const rows: DesaAdminRow[] = members
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      status: m.status as DesaAdminRow["status"],
      role: m.role as DesaAdminRow["role"],
      joinedAt: m.joinedAt.toISOString(),
      invitedAt: m.invitedAt?.toISOString() ?? null,
      acceptedAt: m.acceptedAt?.toISOString() ?? null,
      revokedAt: m.revokedAt?.toISOString() ?? null,
      revokedReason: m.revokedReason,
      user: m.user,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

  const active = rows.filter((r) => r.status === "LIMITED" || r.status === "VERIFIED");
  const history = rows.filter((r) => r.status === "REVOKED" || r.status === "EXPIRED");

  const pendingInvites: PendingInviteRow[] = invites
    .map((i) => ({
      id: i.id,
      email: i.email,
      status: i.status as PendingInviteRow["status"],
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    active,
    history,
    pendingInvites,
    verifiedCount: active.filter((r) => r.status === "VERIFIED").length,
    limitedCount: active.filter((r) => r.status === "LIMITED").length,
  };
}

export async function getDesaAdminRoster(desaId: string): Promise<DesaAdminRoster> {
  if (!db) {
    return { active: [], history: [], pendingInvites: [], verifiedCount: 0, limitedCount: 0 };
  }

  perfQueryShape(
    "admin-desa.list-admin",
    "desaAdminMember.findMany",
    "where:desaId;select:rosterFields+user;sortInApp:statusAsc,joinedAtAsc",
  );
  perfQueryShape(
    "admin-desa.list-admin",
    "desaAdminInvite.findMany",
    "where:desaId,statusPending;take:20;sortInApp:createdAtDesc;select:inviteFields",
  );

  const tMembers = perfStart();
  const membersPromise = db.desaAdminMember
    .findMany({
      where: { desaId },
      select: {
        id: true,
        userId: true,
        status: true,
        role: true,
        joinedAt: true,
        invitedAt: true,
        acceptedAt: true,
        revokedAt: true,
        revokedReason: true,
        user: {
          select: {
            id: true,
            email: true,
            nama: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })
    .then((members) => {
      perfLogWithRows("admin-desa.list-admin", "desaAdminMember.findMany", members.length, tMembers);
      return members;
    });

  const tInvites = perfStart();
  const invitesPromise = db.desaAdminInvite
    .findMany({
      where: { desaId, status: "PENDING" },
      take: 20,
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    })
    .then((invites) => {
      perfLogWithRows("admin-desa.list-admin", "desaAdminInvite.findMany", invites.length, tInvites);
      return invites;
    });

  const t = perfStart();
  const [members, invites] = await Promise.all([
    membersPromise,
    invitesPromise,
  ]);
  perfLog("admin-desa.list-admin", "desaAdminMember+invite.findMany(parallel)", t);

  const tSerialize = perfStart();
  const roster = buildDesaAdminRoster(
    members,
    invites,
  );
  perfLog("admin-desa.list-admin", "serializeRoster", tSerialize);

  return roster;
}
