import { CopyCheck } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { METHOD_COPY, type ClaimMethod } from "@/components/profil/admin-claim/adminClaimCopy";
import type { AdminClaimActiveClaim, AdminClaimDesaOption } from "@/lib/data/admin-claim-read";
import type { AdminClaimEligibility } from "@/lib/admin-claim/eligibility";
import type { AdminClaimFlowState } from "@/hooks/use-admin-claim-flow";

export default function AdminClaimInstruction({
  method,
  selectedDesa,
  currentClaim,
  eligibility,
  flow,
  onBack,
  onContinue,
}: {
  method: ClaimMethod;
  selectedDesa: AdminClaimDesaOption | null;
  currentClaim: AdminClaimActiveClaim | null;
  eligibility: AdminClaimEligibility | null;
  flow: AdminClaimFlowState;
  onBack: () => void;
  onContinue: () => void;
}) {
  const copy = METHOD_COPY[method];
  const rawTokenLost = method === "WEBSITE_TOKEN" && currentClaim?.method === "WEBSITE_TOKEN" && currentClaim.hasActiveToken && !flow.rawToken;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-950">Ikuti instruksi</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Lanjutkan klaim yang sedang aktif atau kirim klaim baru untuk desa yang kamu pilih.
        </p>
      </div>

      <div className="notice-card notice-info">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Cara yang dipilih</p>
        <p className="mt-1 text-sm font-black text-slate-900">{copy.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.instruction}</p>
        {method === "WEBSITE_TOKEN" ? (
          <p className="mt-2 text-xs leading-relaxed text-indigo-800">
            Verifikasi website perlu diperbarui setiap 6 bulan agar hubungan dengan website resmi desa tetap aktif.
          </p>
        ) : null}
      </div>

      {selectedDesa ? (
        <div className="lux-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ringkasan desa</p>
              <p className="mt-1 text-sm font-black text-slate-900">{selectedDesa.nama}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {selectedDesa.kecamatan}, {selectedDesa.kabupaten}, {selectedDesa.provinsi}
              </p>
            </div>
            <DataStatusBadge status={selectedDesa.dataStatus} size="xs" />
          </div>

          <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <p>Sumber yang tercatat: {selectedDesa.sourceLabel}</p>
            <p>Email resmi: {selectedDesa.officialEmailLabel}</p>
            <p>Website resmi: {selectedDesa.websiteUrl ?? "Belum tercatat"}</p>
          </div>

          {eligibility && !eligibility.canStartNewClaim ? (
            <div className="mt-3 notice-card notice-warn text-xs leading-relaxed">
              {eligibility.message}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="lux-card p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <CopyCheck size={16} />
          </span>
          <div>
            <p className="text-sm font-black text-slate-900">{copy.cta}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.note}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDesa && !currentClaim ? (
            <button
              type="button"
              onClick={flow.submitClaimOnly}
              disabled={flow.busy || !selectedDesa}
              className="btn-lux btn-lux-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {flow.busy ? "Memproses..." : "Kirim klaim"}
            </button>
          ) : currentClaim ? (
            <div className="notice-card notice-ok text-xs leading-relaxed">
              Klaim aktif untuk <strong>{currentClaim.desaName}</strong> sudah tercatat. Kamu tidak bisa membuat klaim baru sampai klaim aktif ini selesai diproses.
            </div>
          ) : null}

          {method === "OFFICIAL_EMAIL" ? (
            <>
              <input
                type="email"
                value={flow.officialEmail}
                onChange={(event) => flow.setOfficialEmail(event.target.value)}
                placeholder="email resmi desa, contoh: admin@desakita.go.id"
                className="field-lux"
              />
              <button
                type="button"
                disabled={flow.busy || !flow.officialEmail.trim()}
                onClick={flow.sendEmailToken}
                className="btn-lux btn-lux-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {flow.busy ? "Mengirim..." : currentClaim?.method === "OFFICIAL_EMAIL" ? "Kirim ulang email verifikasi" : "Kirim email verifikasi"}
              </button>
              <p className="text-[10px] text-slate-400">
                Buka email dari inbox dan klik tautan verifikasi. Jika email belum masuk, kamu bisa kirim ulang dari halaman ini.
              </p>
            </>
          ) : null}

          {method === "WEBSITE_TOKEN" ? (
            <>
              <input
                type="url"
                value={flow.websiteUrl}
                onChange={(event) => flow.setWebsiteUrl(event.target.value)}
                placeholder="https://desa.go.id"
                className="field-lux"
              />
              <button
                type="button"
                disabled={flow.busy || !flow.websiteUrl.trim()}
                onClick={flow.generateWebsiteToken}
                className="btn-lux btn-lux-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {flow.busy ? "Membuat token..." : currentClaim?.method === "WEBSITE_TOKEN" ? "Generate ulang token website" : "Generate token website"}
              </button>
              {flow.websiteInstruction ? (
                <div className="notice-card notice-info text-xs leading-relaxed">
                  {flow.websiteInstruction}
                </div>
              ) : null}
              {flow.rawToken ? (
                <div className="notice-card notice-info text-xs leading-relaxed">
                  <p className="font-bold mb-1">Token sesi aktif (hanya tampil sekali):</p>
                  <code className="break-all font-mono text-[11px]">{flow.rawToken}</code>
                </div>
              ) : null}
              {rawTokenLost ? (
                <div className="notice-card notice-warn text-xs leading-relaxed">
                  Token dari sesi sebelumnya tidak lagi tersedia karena halaman sempat dimuat ulang. Buat token baru, pasang di website, lalu cek lagi dari sini.
                </div>
              ) : null}
              <button
                type="button"
                disabled={flow.busy || !flow.rawToken}
                onClick={flow.checkWebsiteToken}
                className="btn-lux btn-lux-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {flow.busy ? "Mengecek..." : "Cek token di website"}
              </button>
              <p className="text-[10px] text-slate-400">
                Cek token hanya dilakukan setelah token dipasang di website resmi desa.
              </p>
            </>
          ) : null}

          {flow.feedback ? (
            <div className="notice-card notice-ok text-xs leading-relaxed">{flow.feedback}</div>
          ) : null}
          {flow.error ? (
            <div className="notice-card notice-danger text-xs leading-relaxed">{flow.error}</div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onBack} className="btn-lux btn-lux-secondary">
          Kembali
        </button>
        <button type="button" onClick={onContinue} className="btn-lux btn-lux-primary flex-1">
          Lanjut ke status
        </button>
      </div>
    </div>
  );
}
