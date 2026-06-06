// Admin Desa profile shimmer — fast feedback while getAdminDesaContext + tab data load.
// Owner reported "profile load lambat" → without this the user saw a frozen blank screen
// while the server fetched membership + renewal + tab-specific data.
export default function AdminDesaProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="h-4 bg-slate-200 rounded w-48" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 animate-pulse" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-24 bg-slate-100 rounded-full" />
          ))}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 animate-pulse" aria-busy="true" aria-live="polite">
        <span className="sr-only">Memuat halaman Admin Desa...</span>
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
