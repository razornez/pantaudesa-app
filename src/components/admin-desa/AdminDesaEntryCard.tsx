import Link from "next/link";
import { ShieldCheck, BadgeCheck, ChevronRight, AlertTriangle } from "lucide-react";
import type { RenewalState } from "@/lib/admin-claim/renewal";

interface Props {
  status: "LIMITED" | "VERIFIED";
  desaName: string;
  renewalState: RenewalState;
  daysUntilRenewal: number | null;
}

/**
 * Compact entry card to embed in `/profil/saya` (or any profile area) so
 * eligible users can jump into the Admin Desa shell. Renders nothing if the
 * user is not LIMITED/VERIFIED — that gate is the caller's responsibility.
 */
export default function AdminDesaEntryCard({
  status,
  desaName,
  renewalState,
  daysUntilRenewal,
}: Props) {
  const isVerified = status === "VERIFIED";
  const showRenewalWarning = isVerified && (renewalState === "URGENT" || renewalState === "OVERDUE");

  return (
    <Link
      href="/profil/admin-desa/profil"
      className="block bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}>
          {isVerified ? <ShieldCheck size={20} /> : <BadgeCheck size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Admin Desa {status}
          </p>
          <p className="text-xs text-slate-500 truncate">{desaName}</p>
          {showRenewalWarning && (
            <p className={`mt-1 text-xs flex items-center gap-1 ${
              renewalState === "OVERDUE" ? "text-red-700" : "text-orange-700"
            }`}>
              <AlertTriangle size={11} />
              {renewalState === "OVERDUE"
                ? `Perpanjangan terlambat ${daysUntilRenewal !== null ? Math.abs(daysUntilRenewal) + " hari" : ""}`
                : `Perpanjangan dalam ${daysUntilRenewal ?? "?"} hari`}
            </p>
          )}
        </div>
        <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
