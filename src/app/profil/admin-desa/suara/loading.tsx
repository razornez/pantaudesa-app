// Admin Desa suara tab shimmer.
export default function AdminDesaSuaraLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat suara warga...</span>
      {/* heading */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-8 bg-slate-200 rounded w-44" />
          <div className="h-4 bg-slate-100 rounded w-64" />
        </div>
        <div className="h-9 bg-slate-200 rounded w-36" />
      </div>
      {/* metric cards */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white px-3 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_10px_22px_-18px_rgba(15,23,42,0.3)] sm:px-4 sm:py-4">
            <div className="h-2 bg-slate-200 rounded w-12 mb-2" />
            <div className="h-7 bg-slate-200 rounded w-10 mb-1" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
      {/* notice card */}
      <div className="rounded-2xl bg-indigo-50 p-4">
        <div className="h-4 bg-indigo-200 rounded w-40 mb-2" />
        <div className="h-3 bg-indigo-100 rounded w-72" />
      </div>
      {/* voice list */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 sm:p-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_-4px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                  <div className="h-6 bg-slate-100 rounded-full w-16" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:min-w-[168px]">
                <div className="rounded-xl bg-slate-50 h-10" />
                <div className="rounded-xl bg-slate-50 h-10" />
                <div className="rounded-xl bg-slate-50 h-10" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
