"use client";

import { BellOff } from "lucide-react";
import type { UserNotification } from "@/lib/user-profile";
import { NotifItem } from "./NotifItem";

export function SayaProfileNotificationsTab({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: UserNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600">{unreadCount} belum dibaca</p>
          <button onClick={onMarkAllRead} className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800">
            Tandai semua dibaca
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <BellOff size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Belum ada notifikasi.</p>
          <p className="mt-1 text-xs text-slate-400">Notifikasi akan muncul saat ada yang membalas atau vote suaramu.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {notifications.map((notification) => (
            <NotifItem key={notification.id} notif={notification} onRead={onMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}
