"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface ToastProps {
  message:   string;
  type?:     ToastType;
  duration?: number;
  onClose:   () => void;
}

const ICONS = {
  success: <CheckCircle2 size={15} className="flex-shrink-0" />,
  error:   <XCircle      size={15} className="flex-shrink-0" />,
  warning: <AlertTriangle size={15} className="flex-shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: "bg-slate-900",
  error:   "bg-rose-600",
  warning: "bg-amber-500",
};

export function Toast({ message, type = "success", duration = 3500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [duration, onClose]);

  const dismiss = () => { setVisible(false); setTimeout(onClose, 300); };

  return (
    <div
      role="alert"
      onClick={dismiss}
      className={`flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-2xl shadow-2xl shadow-black/20 text-white text-sm font-semibold cursor-pointer select-none transition-all duration-300 ${BG[type]} ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"
      }`}
    >
      {ICONS[type]}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        className="ml-1 p-1 rounded-xl hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Tutup"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Toast container — fixed bottom-center ────────────────────────────────────

interface ToastItem { id: string; message: string; type: ToastType }

interface ToastContainerProps { toasts: ToastItem[]; onRemove: (id: string) => void }

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-8 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full max-w-xs">
          <Toast message={t.message} type={t.type} onClose={() => onRemove(t.id)} />
        </div>
      ))}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = (message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return { toasts, toast: add, removeToast: remove };
}
