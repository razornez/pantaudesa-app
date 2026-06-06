// Home shimmer — renders while the home page server component loads.
// Keeps the layout stable so the user doesn't see a blank white flash.
export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat beranda...</span>
      {/* Hero shimmer */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 h-48" />
      {/* Stat strip shimmer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-slate-100 h-24" />
        ))}
      </div>
      {/* Feature card shimmer */}
      <div className="rounded-3xl bg-slate-100 h-64" />
    </div>
  );
}
