"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminDesaTab } from "@/lib/admin-claim/profile-tabs";

export default function AdminDesaTabNav({ tabs }: { tabs: AdminDesaTab[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin Desa tabs" className="overflow-x-auto no-scrollbar" style={{ borderTop: "1px solid var(--hair)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="inline-flex sm:flex min-w-max sm:min-w-0 items-center gap-4 px-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.key}
                href={tab.href}
                prefetch={false}
                className={`relative px-1.5 py-3 text-sm font-semibold whitespace-nowrap t-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  active ? "text-[#1E1B4B]" : "text-slate-500 hover:text-slate-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
                {active && (
                  <span
                    className="absolute bottom-1 left-1 right-1 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #4F46E5, #1E1B4B)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
