import { db } from "@/lib/db";
import AdminDesaNotifikasiClient from "@/components/admin-desa/AdminDesaNotifikasiClient";
import { requireAdminDesaContext } from "@/lib/admin-desa/require-context";
import { perfLog, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

export default async function AdminDesaNotifikasiPage() {
  const ctx = await requireAdminDesaContext("admin-desa.notifikasi");

  const tNotif = perfStart();
  const notifications = db
    ? await db.adminDesaNotification.findMany({
        where: { userId: ctx.user.id, channel: "in_app" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          desaId: true,
        },
      })
    : [];
  perfLog("admin-desa.notifikasi", "adminDesaNotification.findMany", tNotif);

  const serialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt?.toISOString() ?? null,
  }));

  const unreadCount = serialized.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-7">
      <header className="space-y-1.5">
        <p className="eyebrow text-[10px]">Tab</p>
        <h1 className="display text-[28px] sm:text-[32px] font-semibold text-slate-900 tracking-tight leading-tight">Notifikasi</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
          Aktivitas dan pengingat terkait Admin Desa untuk {ctx.desa.nama}.
        </p>
      </header>

      <AdminDesaNotifikasiClient
        initialNotifications={serialized}
        initialUnread={unreadCount}
      />
    </div>
  );
}
