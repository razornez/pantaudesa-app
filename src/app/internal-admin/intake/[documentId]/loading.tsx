export default function IntakeReviewLoading() {
  return (
    <div className="space-y-4">
      <div className="lux-card h-24 animate-pulse bg-slate-100/80" />
      <div className="lux-card h-48 animate-pulse bg-slate-100/80" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lux-card h-40 animate-pulse bg-slate-100/80" />
        <div className="lux-card h-40 animate-pulse bg-slate-100/80" />
      </div>
    </div>
  );
}
