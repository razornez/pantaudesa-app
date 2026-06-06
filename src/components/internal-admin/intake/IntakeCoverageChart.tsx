"use client";

interface IntakeCoverageChartProps {
  publishable: number;
  detected: number;
  missing: number;
  total: number;
}

export function IntakeCoverageChart({
  publishable,
  detected,
  missing,
  total,
}: IntakeCoverageChartProps) {
  const size = 120;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const publishablePct = total > 0 ? publishable / total : 0;
  const detectedPct = total > 0 ? detected / total : 0;
  const missingPct = total > 0 ? missing / total : 0;
  const displayedPct = total > 0 ? Math.round((publishable / total) * 100) : 0;

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Cakupan field: ${displayedPct}% terbaca (${publishable} siap direview, ${detected} terdeteksi, ${missing} tidak terbaca)`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(15,23,42,0.05)" strokeWidth={16} />
          {publishablePct > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth={16}
              strokeDasharray={`${circumference * publishablePct} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
            />
          )}
          {detectedPct > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#D97706"
              strokeWidth={16}
              strokeDasharray={`${circumference * detectedPct} ${circumference}`}
              strokeDashoffset={-circumference * publishablePct}
              strokeLinecap="butt"
            />
          )}
          {missingPct > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth={16}
              strokeDasharray={`${circumference * missingPct} ${circumference}`}
              strokeDashoffset={-(circumference * publishablePct + circumference * detectedPct)}
              strokeLinecap="butt"
            />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[34px] font-semibold leading-none text-slate-900" style={{ letterSpacing: "-0.028em" }}>
            {displayedPct}
            <span className="text-[18px] text-slate-400">%</span>
          </span>
          <span className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">terbaca</span>
        </div>
      </div>
      <p className="text-center text-[11px] tabular-nums text-slate-500">
        <span className="font-semibold text-slate-900">{publishable}</span> <span className="text-slate-400">/</span> <span>{total} field detail</span>
      </p>
    </div>
  );
}
