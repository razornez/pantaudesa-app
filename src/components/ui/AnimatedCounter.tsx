"use client";

import { useEffect, useMemo, useState } from "react";
import { formatRupiah } from "@/lib/utils";

type CounterFormat = "number" | "rupiah" | "percent";

interface Props {
  value: number;
  format?: CounterFormat;
  className?: string;
  durationMs?: number;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatValue(value: number, format: CounterFormat) {
  if (format === "rupiah") return formatRupiah(value);
  if (format === "percent") return `${Math.round(value)}%`;
  return Math.round(value).toLocaleString("id-ID");
}

export default function AnimatedCounter({
  value,
  format = "number",
  className = "",
  durationMs = 1100,
}: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;

    if (prefersReducedMotion()) {
      raf = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(raf);
    }

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, value]);

  const text = useMemo(() => formatValue(display, format), [display, format]);

  return <span className={className}>{text}</span>;
}
