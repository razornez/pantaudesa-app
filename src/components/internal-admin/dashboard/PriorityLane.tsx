"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DashboardPrioritySignal } from "@/lib/internal-admin/dashboard-types";
import { SectionHeading, Surface, ToneBadge, ToneIcon, toneClasses } from "./shared";

export function PriorityLane({ items }: { items: DashboardPrioritySignal[] }) {
  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Prioritas hari ini"
        title="Lima sinyal yang paling cepat mengubah kualitas PantauDesa"
        note="Card ini sengaja dibuat operasional: terlihat alasan risikonya, lalu langsung mengarah ke halaman kerja yang relevan."
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {items.map((item) => {
          const styles = toneClasses(item.tone);
          return (
            <Surface key={item.id} className={`bg-gradient-to-br ${styles.glow}`}>
              <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <ToneBadge tone={item.tone} label={item.eyebrow} />
                  <span
                    className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl ${styles.badge}`}
                    style={{ boxShadow: `inset 0 0 0 1px ${styles.border}` }}
                  >
                    <ToneIcon tone={item.tone} />
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold leading-6 text-slate-950">
                    {item.title}
                  </h3>
                  <p className="text-[13px] leading-6 text-slate-600">{item.description}</p>
                </div>
                <div className="mt-auto pt-1">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-800"
                  >
                    {item.ctaLabel}
                    <ArrowUpRight size={13} aria-hidden />
                  </Link>
                </div>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

