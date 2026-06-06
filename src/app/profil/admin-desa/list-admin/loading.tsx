// Admin Desa list-admin tab shimmer.
export default function AdminDesaListAdminLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat daftar admin...</span>
      <div className="h-7 bg-slate-200 rounded w-40" />
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 sm:p-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-200 h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-48" />
              </div>
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
