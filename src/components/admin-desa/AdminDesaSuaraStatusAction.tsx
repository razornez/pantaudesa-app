"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { updateVoiceStatus } from "./api";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";

const COPY = BACK_OFFICE_COPY.adminDesa.suara.statusAction;

type VoiceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

interface Props {
  voiceId: string;
  currentStatus: VoiceStatus;
}

const STATUS_CLS: Record<VoiceStatus, string> = {
  OPEN: "pill-info",
  IN_PROGRESS: "pill-warn",
  RESOLVED: "pill-ok",
};

export default function AdminDesaSuaraStatusAction({ voiceId, currentStatus }: Props) {
  const [status, setStatus] = useState<VoiceStatus>(currentStatus);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const options: VoiceStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

  async function handleSelect(next: VoiceStatus) {
    if (next === status || isPending) return;
    setOpen(false);
    setError(null);
    setSuccess(false);
    try {
      await updateVoiceStatus(voiceId, next);
      startTransition(() => setStatus(next));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (error) {
      setError(error instanceof Error ? error.message : COPY.failed);
    }
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          disabled={isPending}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[status]} cursor-pointer hover:opacity-80 t-spring disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1`}
        >
          {COPY.options[status]}
          <ChevronDown size={10} aria-hidden />
        </button>
        {success && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
            <CheckCircle2 size={11} aria-hidden /> {COPY.success}
          </span>
        )}
      </div>

      {error && <p className="text-[10px] text-rose-600">{error}</p>}

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute top-8 left-0 z-40 min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lux-2 py-1 overflow-hidden"
          >
            {options.map(opt => (
              <li key={opt} role="option" aria-selected={opt === status}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors hover:bg-slate-50 ${opt === status ? "text-indigo-700 font-semibold" : "text-slate-700"}`}
                >
                  {COPY.options[opt]}
                  {opt === status && <span className="ml-1 text-indigo-500">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {status === "RESOLVED" && (
        <p className="text-[10px] text-slate-500 leading-relaxed">{COPY.consequence}</p>
      )}
    </div>
  );
}
