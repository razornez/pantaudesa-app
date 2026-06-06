"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DashboardInsightStep } from "@/lib/internal-admin/dashboard-types";
import { SectionHeading, Surface, ToneBadge, toneClasses } from "./shared";

export function NextStepsPanel({ steps }: { steps: DashboardInsightStep[] }) {
  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Insight berikutnya"
        title="Kalau owner hanya punya waktu sebentar, ini urutan gerak yang paling masuk akal"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step) => {
          const styles = toneClasses(step.tone);
          return (
            <Surface key={step.id} className={`bg-gradient-to-br ${styles.glow}`}>
              <div className="space-y-4 p-5">
                <ToneBadge tone={step.tone} label={step.title} />
                <p className="text-[14px] leading-7 text-slate-700">{step.body}</p>
                <Link href={step.href} className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-900">
                  {step.ctaLabel}
                  <ArrowUpRight size={13} aria-hidden />
                </Link>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
