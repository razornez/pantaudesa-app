// Admin Desa dokumen tab shimmer.
export default function AdminDesaDokumenLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat dokumen...</span>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded w-28" />
          <div className="h-4 bg-slate-100 rounded w-56" />
        </div>
        <div className="h-10 bg-slate-200 rounded w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-5 bg-slate-100 rounded-full w-16" />
              <div className="h-5 bg-slate-100 rounded-full w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
