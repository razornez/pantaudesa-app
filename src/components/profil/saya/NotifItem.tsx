"use client";

import { NOTIF_CONFIG, type UserNotification } from "@/lib/user-profile";
import { relativeTime } from "@/lib/citizen-voice";

export function NotifItem({
  notif,
  onRead,
}: {
  notif: UserNotification;
  onRead: (id: string) => void;
}) {
  const config = NOTIF_CONFIG[notif.type];

  return (
    <button
      onClick={() => onRead(notif.id)}
      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-slate-50 ${
        !notif.isRead ? "bg-indigo-50/40" : ""
      }`}
    >
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border text-lg ${config.color}`}>
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
            {notif.message}
            {notif.isOfficial && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                Resmi
              </span>
            )}
          </p>
          {!notif.isRead && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">&quot;{notif.voiceText}&quot;</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{relativeTime(notif.createdAt)}</p>
      </div>
    </button>
  );
}
