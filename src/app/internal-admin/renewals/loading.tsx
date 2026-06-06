// Internal Admin renewals queue shimmer.
export default function InternalAdminRenewalsLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat antrean perpanjangan...</span>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="flex gap-2">
          {["Semua", "Mendekati", "Terlambat"].map((lbl) => (
            <div key={lbl} className="h-8 bg-slate-200 rounded-full w-20" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 sm:p-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="rounded-full bg-slate-200 h-10 w-10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-4 bg-slate-200 rounded w-40" />
                    <div className="h-5 bg-slate-100 rounded-full w-20" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-56" />
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
