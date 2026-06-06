import type { ContactAdminFormState } from "@/components/support/contact-admin-types";

const MAX_SUBJECT = 160;
const MAX_DESC    = 2000;
const MAX_EVIDENCE = 400;

export default function ContactAdminForm({
  state,
  onChange,
  onSubmit,
}: {
  state: ContactAdminFormState;
  onChange: (field: "subject" | "description" | "evidence", value: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = !state.loading && state.subject.trim().length > 0 && state.description.trim().length > 0;

  return (
    <section id="hubungi-admin" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-black text-slate-900">Hubungi Admin</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Gunakan form ini untuk minta bantuan, laporkan masalah, atau sampaikan klarifikasi. Pesan dikirim langsung ke tim PantauDesa dan tidak akan memposting laporan secara publik.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Subjek pesan <span className="text-rose-500">*</span></label>
          <input
            type="text"
            value={state.subject}
            onChange={(e) => onChange("subject", e.target.value.slice(0, MAX_SUBJECT))}
            placeholder="Tidak bisa akses dokumendesa"
            disabled={state.loading}
            maxLength={MAX_SUBJECT}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <p className="mt-0.5 text-[10px] text-slate-400 text-right">{state.subject.length}/{MAX_SUBJECT}</p>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Isi pesan <span className="text-rose-500">*</span></label>
          <textarea
            value={state.description}
            onChange={(e) => onChange("description", e.target.value.slice(0, MAX_DESC))}
            placeholder="Jelaskan kendala atau laporanmu secara lengkap"
            disabled={state.loading}
            rows={4}
            maxLength={MAX_DESC}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <p className="mt-0.5 text-[10px] text-slate-400 text-right">{state.description.length}/{MAX_DESC}</p>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Bukti atau tautan pendukung <span className="text-slate-400 font-normal">(opsional)</span></label>
          <input
            type="text"
            value={state.evidence}
            onChange={(e) => onChange("evidence", e.target.value.slice(0, MAX_EVIDENCE))}
            placeholder="Tautan atau keterangan bukti pendukung"
            disabled={state.loading}
            maxLength={MAX_EVIDENCE}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {!canSubmit && !state.loading && (state.subject.trim() || state.description.trim()) ? (
          <p className="text-[10px] text-amber-700 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-amber-500" />
            Subjek dan isi pesan wajib diisi sebelum mengirim.
          </p>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.loading ? "Mengirim pesan..." : "Kirim pesan"}
        </button>

        {state.success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
            ✓ {state.success}
          </div>
        ) : state.error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800">
            ✗ {state.error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
