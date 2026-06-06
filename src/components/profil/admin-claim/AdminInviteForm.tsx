import type { InviteState } from "@/hooks/use-admin-claim-flow";

export default function AdminInviteForm({
  canInvite,
  disabledReason,
  invite,
  onEmailChange,
  onSubmit,
}: {
  canInvite: boolean;
  disabledReason: string;
  invite: InviteState;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="lux-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[10px]">Undang admin desa</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">Tambahkan rekan kerja bila memang perlu</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Hanya admin utama desa yang boleh mengundang. Admin baru akan masuk sebagai admin terbatas, maksimal 5 admin per desa.
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${canInvite ? "pill-ok" : "pill-info"}`}>
          {canInvite ? "Bisa undang" : "Belum tersedia"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <input
            type="email"
            value={invite.email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="email calon admin"
            disabled={invite.loading}
            className="field-lux disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          {!canInvite ? (
            <p className="mt-1.5 text-[10px] text-amber-700 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-amber-500" />
              {disabledReason}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={invite.loading || !invite.email.trim() || !canInvite}
          className="btn-lux btn-lux-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {invite.loading ? "Mengirim..." : "Kirim undangan admin"}
        </button>
        {invite.success ? (
          <div className="notice-card notice-ok text-xs leading-relaxed">{invite.success}</div>
        ) : invite.error ? (
          <div className="notice-card notice-danger text-xs leading-relaxed">{invite.error}</div>
        ) : null}
      </div>
    </div>
  );
}
