"use client";

import type { DiffEntry } from "./types";
import type { DiffFilter } from "./diff-theatre";

interface IntakeDiffFilterTabsProps {
  filter: DiffFilter;
  entries: DiffEntry[];
  addedCount: number;
  updatedCount: number;
  removedCount: number;
  unchangedCount: number;
  onChange: (next: DiffFilter) => void;
}

function FilterTab({
  active,
  count,
  label,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all duration-150 ${
        active ? "bg-[#1E1B4B] text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
      <span className={`ml-1 text-[10px] ${active ? "opacity-70" : "opacity-60"}`}>{count}</span>
    </button>
  );
}

export function IntakeDiffFilterTabs({
  filter,
  entries,
  addedCount,
  updatedCount,
  removedCount,
  unchangedCount,
  onChange,
}: IntakeDiffFilterTabsProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-50 p-1"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
    >
      <FilterTab label="Semua" count={entries.length} active={filter === "all"} onClick={() => onChange("all")} />
      {addedCount > 0 && <FilterTab label="Baru" count={addedCount} active={filter === "added"} onClick={() => onChange("added")} />}
      {updatedCount > 0 && (
        <FilterTab label="Update" count={updatedCount} active={filter === "updated"} onClick={() => onChange("updated")} />
      )}
      {removedCount > 0 && <FilterTab label="Hapus" count={removedCount} active={filter === "removed"} onClick={() => onChange("removed")} />}
      {unchangedCount > 0 && (
        <FilterTab label="Sama" count={unchangedCount} active={filter === "unchanged"} onClick={() => onChange("unchanged")} />
      )}
    </div>
  );
}
