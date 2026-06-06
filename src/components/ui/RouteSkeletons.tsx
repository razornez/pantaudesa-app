function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export function DesaListSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-36" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-12 w-24" />
      </div>
      <SkeletonBlock className="h-20 w-full" />
      <SkeletonBlock className="h-24 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-4 w-full" />
            <SkeletonBlock className="mt-2 h-4 w-3/4" />
            <SkeletonBlock className="mt-4 h-2.5 w-full rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <SkeletonBlock className="h-14" />
              <SkeletonBlock className="h-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DesaDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-9 w-28" />
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 p-6 sm:p-7">
            <SkeletonBlock className="h-6 w-44 rounded-full" />
            <SkeletonBlock className="h-9 w-64" />
            <SkeletonBlock className="h-4 w-72" />
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-11 w-36" />
          </div>
          <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <SkeletonBlock className="h-5 w-44" />
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
      <SkeletonBlock className="h-16 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28" />
        ))}
      </div>
      <SkeletonBlock className="h-52 w-full" />
    </div>
  );
}

export function SuaraWargaSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-indigo-50 p-6 sm:p-8">
        <SkeletonBlock className="h-6 w-40 bg-indigo-100" />
        <SkeletonBlock className="mt-4 h-9 w-56 bg-indigo-100" />
        <SkeletonBlock className="mt-3 h-16 w-full bg-indigo-100" />
        <div className="mt-5 flex gap-4">
          <SkeletonBlock className="h-10 w-20 bg-indigo-100" />
          <SkeletonBlock className="h-10 w-20 bg-indigo-100" />
          <SkeletonBlock className="h-10 w-24 bg-indigo-100" />
        </div>
      </div>
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-28 w-full" />
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonBlock key={index} className="h-40 w-full" />
      ))}
    </div>
  );
}
