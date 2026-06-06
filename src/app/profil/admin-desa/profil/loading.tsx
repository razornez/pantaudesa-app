// Admin Desa profil tab shimmer — mirrors the page layout for fast perceived load.
export default function AdminDesaProfilLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat profil Admin Desa...</span>
      {/* heading skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-8 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-100 rounded w-64" />
        </div>
        <div className="h-9 bg-slate-200 rounded w-32" />
      </div>
      {/* membership card */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="h-8 bg-slate-200 rounded w-36" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
            <div className="rounded-xl bg-slate-100 h-16" />
            <div className="rounded-xl bg-slate-100 h-16" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 h-16" />
          <div className="rounded-xl bg-slate-50 h-16" />
          <div className="rounded-xl bg-slate-50 h-16" />
          <div className="rounded-xl bg-slate-50 h-16" />
        </div>
      </div>
      {/* access + limits cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-indigo-50 h-10 w-10" />
            <div className="space-y-1">
              <div className="h-2 bg-slate-200 rounded w-12" />
              <div className="h-4 bg-slate-200 rounded w-24" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${70 + i * 8}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-amber-50 h-10 w-10" />
            <div className="space-y-1">
              <div className="h-2 bg-slate-200 rounded w-12" />
              <div className="h-4 bg-slate-200 rounded w-24" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${60 + i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
