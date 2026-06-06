export default function InternalDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat dashboard internal...</span>
      <div className="rounded-[2rem] bg-slate-100 h-44" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] bg-slate-100 h-36" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] bg-slate-100 h-[28rem]" />
        <div className="rounded-[1.75rem] bg-slate-100 h-[28rem]" />
      </div>
      <div className="rounded-[1.75rem] bg-slate-100 h-[24rem]" />
    </div>
  );
}
