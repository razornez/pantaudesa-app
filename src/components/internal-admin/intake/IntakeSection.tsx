"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface IntakeSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: string;
  badgeClassName?: string;
  onToggle?: (open: boolean) => void;
}

export function IntakeSection({
  title,
  children,
  defaultOpen = true,
  className = "",
  badge,
  badgeClassName,
  onToggle,
}: IntakeSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClassName}`}
            >
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={14} className="text-slate-400" aria-hidden />
        ) : (
          <ChevronDown size={14} className="text-slate-400" aria-hidden />
        )}
      </button>
      {open && <div className="px-4 pb-4 sm:px-5">{children}</div>}
    </div>
  );
}

// ============================================================================
// Compact Section for inline use
// ============================================================================

interface IntakeCompactSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function IntakeCompactSection({
  title,
  children,
  className = "",
}: IntakeCompactSectionProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}
