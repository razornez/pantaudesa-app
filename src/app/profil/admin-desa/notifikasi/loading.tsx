// Admin Desa notifikasi tab shimmer.
export default function AdminDesaNotifikasiLoading() {
  return (
    <div className="space-y-7 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat notifikasi...</span>
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-200 rounded w-8" />
        <div className="h-8 bg-slate-200 rounded w-36" />
        <div className="h-4 bg-slate-100 rounded w-72" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 sm:p-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-slate-200 h-9 w-9 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-16" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
