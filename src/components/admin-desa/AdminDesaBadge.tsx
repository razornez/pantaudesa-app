"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, BadgeCheck, AlertTriangle } from "lucide-react";
import type { RenewalState } from "@/lib/admin-claim/renewal";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";

const COPY = BACK_OFFICE_COPY.adminDesa.badge;

interface Props {
  status: "LIMITED" | "VERIFIED" | "REVOKED" | "EXPIRED";
  role: "LIMITED_ADMIN" | "VERIFIED_ADMIN";
  desaName: string;
  renewalDueAt: string | null;
  renewalState: RenewalState;
  daysUntilRenewal: number | null;
  avatarUrl: string | null;
  displayName: string;
}

function renewalLabel(state: RenewalState) {
  if (state === "OVERDUE") return COPY.renewal.overdue;
  if (state === "URGENT") return COPY.renewal.urgent;
  if (state === "DUE_SOON") return COPY.renewal.dueSoon;
  return COPY.renewal.scheduled;
}

function renewalTone(state: RenewalState) {
  if (state === "OVERDUE") return "bg-red-50 border border-red-200 text-red-800";
  if (state === "URGENT") return "bg-orange-50 border border-orange-200 text-orange-800";
  if (state === "DUE_SOON") return "bg-amber-50 border border-amber-200 text-amber-800";
  return "bg-slate-50 border border-slate-200 text-slate-600";
}

export default function AdminDesaBadge({
  status,
  desaName,
  renewalDueAt,
  renewalState,
  daysUntilRenewal,
  avatarUrl,
  displayName,
}: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isVerified = status === "VERIFIED";
  const statusLabel = isVerified ? COPY.status.verified : COPY.status.limited;
  const badgeColor = isVerified ? "bg-emerald-500" : "bg-amber-500";
  const badgeIcon = isVerified ? <ShieldCheck size={11} className="text-white" /> : <BadgeCheck size={11} className="text-white" />;

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={COPY.ariaLabel(statusLabel)}
        className="relative w-12 h-12 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none focus-visible:ring-offset-2 rounded-full"
      >
        <span className="absolute inset-0 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-black/5 bg-white z-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-semibold text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <span className={`absolute -bottom-1 -right-1 z-10 w-[22px] h-[22px] rounded-full ${badgeColor} flex items-center justify-center border-2 border-white shadow-[0_6px_14px_rgba(15,23,42,0.22)] ring-1 ring-black/5`} aria-hidden="true">
          {badgeIcon}
        </span>
      </button>

      {open && (
        <div ref={popoverRef} role="dialog" aria-label={COPY.dialogLabel} className="absolute left-0 sm:left-auto sm:right-0 top-full mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
          <div className="flex items-start gap-3">
            <span className={`${badgeColor} text-white rounded-full p-1.5 shrink-0`}>
              {isVerified ? <ShieldCheck size={16} /> : <BadgeCheck size={16} />}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{statusLabel}</p>
              <p className="text-xs text-slate-500 truncate">{desaName}</p>
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            {(isVerified ? COPY.verifiedItems : COPY.limitedItems).map((item) => <li key={item}>{item}</li>)}
          </ul>

          {isVerified && renewalDueAt && (
            <div className={`text-xs rounded-lg px-3 py-2 flex items-start gap-2 ${renewalTone(renewalState)}`}>
              {renewalState !== "OK" && <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="font-medium">{renewalLabel(renewalState)}</p>
                <p className="opacity-90">
                  {new Date(renewalDueAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                  {daysUntilRenewal !== null && (
                    <> ({daysUntilRenewal >= 0 ? COPY.renewal.daysLeft(daysUntilRenewal) : COPY.renewal.daysLate(daysUntilRenewal)})</>
                  )}
                </p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">{COPY.note}</p>
        </div>
      )}
    </div>
  );
}
