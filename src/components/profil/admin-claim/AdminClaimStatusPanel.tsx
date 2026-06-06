import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import ClaimStatusBadge from "@/components/profil/admin-claim/ClaimStatusBadge";
import { getCurrentStatusTone } from "@/components/profil/admin-claim/adminClaimCopy";
import type {
  AdminClaimActiveClaim,
  AdminClaimActiveMember,
  AdminClaimStateCard,
} from "@/lib/data/admin-claim-read";

export default function AdminClaimStatusPanel({
  currentState,
  currentClaim,
  currentMember,
  showDemoLabel,
  selectedDesaName,
  onBack,
  onRestart,
}: {
  currentState: AdminClaimStateCard | null;
  currentClaim: AdminClaimActiveClaim | null;
  currentMember: AdminClaimActiveMember | null;
  showDemoLabel: boolean;
  selectedDesaName: string | null;
  onBack: () => void;
  onRestart: () => void;
}) {
  const tone = currentState ? getCurrentStatusTone(currentState.status) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-950">Lihat status</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Baca status klaimmu dengan tenang. Halaman ini hanya menampilkan status akun yang sedang tercatat.
        </p>
      </div>

      {currentState ? (
        <div className="lux-card p-5 sm:p-6" data-testid="claim-status-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status akun</p>
              <p className="mt-1 text-lg font-black text-slate-950">{tone?.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{tone?.note}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ClaimStatusBadge status={currentState.status} />
              {showDemoLabel ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  Data contoh
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="pill-info rounded-full px-2.5 py-1 text-[10px] font-semibold">
              {currentState.desaName}
            </span>
            <span className="pill-info rounded-full px-2.5 py-1 text-[10px] font-semibold">
              {currentState.roleLabel}
            </span>
            {currentState.methodLabel ? (
              <span className="pill-info rounded-full px-2.5 py-1 text-[10px] font-semibold">
                {currentState.methodLabel}
              </span>
            ) : null}
            <DataStatusBadge status={currentState.dataStatus} size="xs" />
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Catatan</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{currentState.note}</p>
            {currentClaim?.status === "PENDING" ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Klaim aktif: {currentClaim.desaName}. Lanjutkan verifikasi dari langkah instruksi jika email belum masuk atau token website belum dicek.
              </p>
            ) : null}
            {currentMember?.status === "VERIFIED" ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Hanya status admin desa yang terverifikasi. Data publik desa tetap mengikuti workflow review tersendiri.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="notice-card notice-warn text-sm">
          Status akun belum bisa dimuat saat ini.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="btn-lux btn-lux-secondary"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="btn-lux btn-lux-primary"
        >
          <RefreshCcw size={14} />
          Ubah pilihan desa
        </button>
        <Link
          href="/hubungi-admin?source=%2Fprofil%2Fklaim-admin-desa"
          className="btn-lux btn-lux-ghost"
        >
          Hubungi Admin
        </Link>
      </div>

      <div className="lux-card p-5">
        <p className="text-sm font-black text-slate-900">Butuh lihat profil lagi?</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Kamu bisa kembali ke profil untuk mengecek identitas akun atau status akses yang ringkas.
        </p>
        {currentState?.status === "verified" && selectedDesaName ? (
          <p className="mt-2 text-xs leading-relaxed text-emerald-700">
            Status untuk {selectedDesaName} sudah siap dipakai untuk alur admin desa lanjutan, termasuk undang admin bila kamu sudah menjadi admin utama desa.
          </p>
        ) : null}
        <Link
          href="/profil/saya"
          className="btn-lux btn-lux-secondary mt-3"
        >
          Kembali ke profil saya
        </Link>
      </div>
    </div>
  );
}
