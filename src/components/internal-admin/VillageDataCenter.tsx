"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  BookOpen,
  ChevronRight,
  Database,
  LayoutGrid,
  Clock,
} from "lucide-react";
import {
  DEFAULT_TEMPLATE_KEY,
} from "@/lib/village-data/template-constants";
import { ActivityLogTab } from "./village-data-center/ActivityLogTab";
import { DesaDataTab } from "./village-data-center/DesaDataTab";
import { StandardsTab } from "./village-data-center/StandardsTab";
import type { VillageDataCenterTab } from "./village-data-center/types";
import { VersionsTab } from "./village-data-center/VersionsTab";

function TabButton({
  tab,
  active,
  icon,
  label,
  onClick,
}: {
  tab: VillageDataCenterTab;
  active: VillageDataCenterTab;
  icon: ReactNode;
  label: string;
  onClick: (tab: VillageDataCenterTab) => void;
}) {
  const isActive = tab === active;
  return (
    <button
      type="button"
      onClick={() => onClick(tab)}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 ${
        isActive
          ? "bg-[#1E1B4B] text-white shadow-sm"
          : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function VillageDataCenter({
  initialTab,
}: {
  initialTab: VillageDataCenterTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<VillageDataCenterTab>(initialTab);

  const switchTab = useCallback(
    (tab: VillageDataCenterTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <>
      <header className="sticky top-0 z-40 glass" style={{ borderRadius: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-slate-500 min-w-0">
            <span className="font-semibold text-slate-900">Admin</span>
            <ChevronRight size={10} aria-hidden />
            <span className="text-slate-900 font-medium">Data Desa</span>
          </div>
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 text-[11px] text-slate-500"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
          >
            <Database size={11} aria-hidden className="text-[#1E1B4B]" />
            <span className="ml-0.5 font-medium text-slate-700">
              {DEFAULT_TEMPLATE_KEY}
            </span>
          </div>
          <div className="flex-1" />
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Foundation · template-aware
          </span>
        </div>
      </header>

      <div className="space-y-6">
        <div className="pt-2">
          <p className="eyebrow mb-1.5">Data Desa · Admin Center</p>
          <h1
            className="text-[24px] sm:text-[28px] font-semibold text-slate-900 leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            Manajemen Data & Template Desa
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 max-w-2xl">
            Workspace internal untuk mengelola data desa, template publik, dan parity
            komponen antara intake, back office, dan halaman detail warga.
          </p>
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-2xl bg-slate-50 w-fit"
          style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
        >
          <TabButton
            tab="desa-data"
            active={activeTab}
            icon={<LayoutGrid size={13} />}
            label="Data per Desa"
            onClick={switchTab}
          />
          <TabButton
            tab="standards"
            active={activeTab}
            icon={<BookOpen size={13} />}
            label="Kelola Template"
            onClick={switchTab}
          />
          <TabButton
            tab="versions"
            active={activeTab}
            icon={<Clock size={13} />}
            label="Versi & Audit"
            onClick={switchTab}
          />
          <TabButton
            tab="activity"
            active={activeTab}
            icon={<Activity size={13} />}
            label="Log Aktivitas"
            onClick={switchTab}
          />
        </div>

        {activeTab === "standards" ? <StandardsTab /> : null}
        {activeTab === "desa-data" ? <DesaDataTab /> : null}
        {activeTab === "versions" ? <VersionsTab /> : null}
        {activeTab === "activity" ? <ActivityLogTab /> : null}
      </div>
    </>
  );
}
