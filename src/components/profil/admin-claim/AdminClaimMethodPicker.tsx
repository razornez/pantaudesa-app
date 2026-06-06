import { Globe2, Mail } from "lucide-react";
import type { ClaimMethod } from "@/components/profil/admin-claim/adminClaimCopy";
import { METHOD_COPY } from "@/components/profil/admin-claim/adminClaimCopy";
import type { AdminClaimDesaOption } from "@/lib/data/admin-claim-read";

const METHOD_ICON = {
  OFFICIAL_EMAIL: Mail,
  WEBSITE_TOKEN: Globe2,
} as const;

export default function AdminClaimMethodPicker({
  selectedDesa,
  method,
  onSelectMethod,
  onBack,
  onContinue,
}: {
  selectedDesa: AdminClaimDesaOption | null;
  method: ClaimMethod;
  onSelectMethod: (method: ClaimMethod) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const methods = Object.keys(METHOD_COPY) as ClaimMethod[];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-950">Pilih cara verifikasi</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Pilih satu cara yang paling mungkin kamu pakai untuk desa {selectedDesa?.nama ?? "yang dipilih"}.
        </p>
      </div>

      {selectedDesa ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Desa yang dipilih</p>
          <p className="mt-1 text-sm font-black text-slate-900">{selectedDesa.nama}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {selectedDesa.kecamatan}, {selectedDesa.kabupaten}, {selectedDesa.provinsi}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {methods.map((item) => {
          const Icon = METHOD_ICON[item];
          const copy = METHOD_COPY[item];
          const active = method === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelectMethod(item)}
              className={`w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 ${
                active
                  ? "border-indigo-300 bg-indigo-50 shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900">{copy.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.body}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
        >
          Lanjut ke instruksi
        </button>
      </div>
    </div>
  );
}
