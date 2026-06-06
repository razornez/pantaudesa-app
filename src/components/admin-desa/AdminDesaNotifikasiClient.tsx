"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FileText,
  MailWarning,
  UserCog,
} from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { markAdminNotificationsRead } from "./api";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";

const COPY = BACK_OFFICE_COPY.adminDesa.notifications;
const COMMON_COPY = BACK_OFFICE_COPY.adminDesa.common;

interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  desaId: string | null;
}

function iconMeta(type: string) {
  if (type.includes("RENEWAL")) return { icon: Clock3, tone: "text-amber-700 bg-amber-50" };
  if (type.includes("DOCUMENT")) return { icon: FileText, tone: "text-indigo-700 bg-indigo-50" };
  if (type.includes("MEMBER")) return { icon: UserCog, tone: "text-emerald-700 bg-emerald-50" };
  if (type.includes("CLAIM")) return { icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" };
  return { icon: MailWarning, tone: "text-slate-700 bg-slate-100" };
}

export default function AdminDesaNotifikasiClient({
  initialNotifications,
  initialUnread,
}: {
  initialNotifications: NotifRow[];
  initialUnread: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [isPending, startTransition] = useTransition();
  const { toasts, toast, removeToast } = useToast();

  const summary = useMemo(() => ({
    total: notifications.length,
    unread,
    read: notifications.length - unread,
  }), [notifications.length, unread]);

  async function markAllRead() {
    try {
      await markAdminNotificationsRead();
      startTransition(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
        setUnread(0);
      });
      toast(COPY.messages.markAllReadSuccess, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : COMMON_COPY.connectionError, "error");
    }
  }

  async function markOneRead(id: string) {
    try {
      await markAdminNotificationsRead([id]);
      startTransition(() => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
        setUnread((c) => Math.max(0, c - 1));
      });
      toast(COPY.messages.markOneReadSuccess, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : COMMON_COPY.connectionError, "error");
    }
  }

  return (
    <div className="space-y-4" data-testid="notification-tab">
      {/* Compact summary + action */}
      <div className="flex flex-col gap-2 rounded-2xl bg-white/72 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] sm:inline-flex sm:flex-row sm:items-center sm:gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-slate-600 ring-1 ring-slate-200/70">
            {COPY.summary.total} <strong className="font-semibold text-slate-900">{summary.total}</strong>
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ring-1 ${summary.unread > 0 ? "bg-amber-50 text-amber-800 ring-amber-200/80" : "bg-emerald-50 text-emerald-800 ring-emerald-200/80"}`}>
            {COPY.summary.unread} <strong className="font-semibold">{summary.unread}</strong>
          </span>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08),0_10px_22px_-18px_rgba(15,23,42,0.35)] transition hover:bg-slate-50 disabled:opacity-60"
          >
            <CheckCheck size={12} aria-hidden /> {COPY.actions.markAllRead}
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="lux-card p-8 text-center space-y-2">
          <BellOff size={22} className="mx-auto text-slate-300" aria-hidden />
          <p className="text-sm text-slate-500">{COPY.empty}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const meta = iconMeta(n.type);
            const Icon = meta.icon;
            return (
              <li
                key={n.id}
                className={`t-spring rounded-xl px-4 py-3 flex items-start gap-3 ${
                  n.isRead
                    ? "bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05),0_8px_16px_-12px_rgba(15,23,42,0.1)]"
                    : "lux-panel"
                }`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${meta.tone}`}>
                  <Icon size={14} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-[13px] font-semibold leading-snug ${n.isRead ? "text-slate-800" : "text-indigo-950"}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="pill-info rounded-full px-2 py-0.5 text-[10px] font-semibold">{COPY.newBadge}</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[12px] text-slate-600 mt-1">{n.body}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markOneRead(n.id)}
                    disabled={isPending}
                    className="btn-lux btn-lux-ghost text-[11px] shrink-0"
                  >
                    {COPY.actions.markOneRead}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
