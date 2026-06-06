"use client";

import type { ReactNode } from "react";
import { useDetailMotion } from "./useDetailMotion";

export interface ChapterRailItem {
  id: string;
  label: string;
}

interface DetailV2ShellProps {
  chapters: ChapterRailItem[];
  children: ReactNode;
}

/**
 * Client wrapper for the cinematic desa detail page:
 *  - top scroll-progress bar (z-[60], above global navbar)
 *  - left chapter rail (desktop ≥1180px)
 *  - runs the global motion hook once
 * Global Navbar from root layout stays visible; content flows below it naturally.
 */
export default function DetailV2Shell({ chapters, children }: DetailV2ShellProps) {
  useDetailMotion();

  return (
    <>
      <div
        id="scroll-progress"
        className="fixed left-0 top-0 z-[60] h-[2px] transition-[width] duration-150"
        style={{ width: "0%", background: "linear-gradient(90deg, #4F46E5, #10B981)" }}
      />

      {chapters.length > 0 ? (
        <nav className="chrail fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3.5 xl:flex">
          {chapters.map((c, i) => (
            <a key={c.id} href={`#${c.id}`} className={i === 0 ? "active" : undefined}>
              <span className="pip" aria-hidden />
              <span>{c.label}</span>
            </a>
          ))}
        </nav>
      ) : null}

      <main>{children}</main>
    </>
  );
}
