export default function InternalAdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat panel internal admin...</span>
      <div className="h-7 bg-slate-200 rounded w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-slate-100 h-36" />
        ))}
      </div>
    </div>
  );
}
