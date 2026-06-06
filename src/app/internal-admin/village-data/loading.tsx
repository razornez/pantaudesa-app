export default function VillageDataLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Tab bar skeleton */}
      <div className="h-10 rounded-2xl bg-slate-100 w-72" />
      {/* Content skeleton */}
      <div className="rounded-3xl bg-white p-7 space-y-4"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
        <div className="h-3 rounded-full bg-slate-100 w-24" />
        <div className="h-6 rounded-full bg-slate-100 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
