// Profile shimmer — covers /profil resolver + sub-routes during server data fetch.
// Critical: do NOT show "memuat..." in a way that suggests user is logged out.
export default function ProfilLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat profil...</span>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="px-5 pb-5 -mt-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-200 ring-4 ring-white" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-100 h-32" />
      <div className="rounded-2xl bg-slate-100 h-48" />
    </div>
  );
}
