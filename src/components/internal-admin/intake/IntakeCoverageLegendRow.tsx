"use client";

export function IntakeCoverageLegendRow({
  color,
  label,
  count,
  note,
}: {
  color: string;
  label: string;
  count: number;
  note: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-slate-900">{label}</span>
          <span className="text-[13px] font-semibold tabular-nums text-slate-900">{count}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{note}</p>
      </div>
    </div>
  );
}
