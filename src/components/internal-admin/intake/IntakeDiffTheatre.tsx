"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { IntakeDiffFilterTabs } from "./IntakeDiffFilterTabs";
import { IntakeDiffRow } from "./IntakeDiffRow";
import {
  getFilteredDiffEntries,
  getOrderedDiffSections,
  type DiffFilter,
} from "./diff-theatre";
import type { PipelineResult } from "./types";

export function IntakeDiffTheatre({ result }: { result: PipelineResult }) {
  const [filter, setFilter] = useState<DiffFilter>("all");
  const [showUnchanged, setShowUnchanged] = useState(false);
  const diff = result.diff;

  if (!diff) {
    return (
      <section
        className="rounded-3xl bg-white p-7"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
        }}
      >
        <p className="eyebrow mb-1.5 text-indigo-600">Diff · ujung tombak review</p>
        <p className="text-sm text-slate-500">
          Pilih desa target untuk membandingkan hasil dengan data yang ada.
        </p>
      </section>
    );
  }

  const { entries, addedCount, updatedCount, removedCount } = diff;
  const unchangedEntries = entries.filter((entry) => entry.deltaType === "unchanged");
  const changeCount = addedCount + updatedCount + removedCount;
  const filteredEntries = getFilteredDiffEntries(entries, filter, showUnchanged);
  const orderedSections = getOrderedDiffSections(filteredEntries);
  const legendItems = [
    {
      label: "Warna hijau",
      note: "Baru",
      dotClassName: "bg-emerald-500",
      chipClassName: "bg-emerald-50 text-emerald-900",
      ringColor: "rgba(5,95,70,0.12)",
    },
    {
      label: "Warna ungu",
      note: "Diperbarui",
      dotClassName: "bg-indigo-500",
      chipClassName: "bg-indigo-50 text-[#1E1B4B]",
      ringColor: "rgba(67,56,202,0.14)",
    },
    {
      label: "Warna merah",
      note: "Dihapus",
      dotClassName: "bg-rose-500",
      chipClassName: "bg-rose-50 text-rose-900",
      ringColor: "rgba(159,18,57,0.14)",
    },
    {
      label: "Warna abu",
      note: "Sama",
      dotClassName: "bg-slate-400",
      chipClassName: "bg-slate-100 text-slate-700",
      ringColor: "rgba(100,116,139,0.16)",
    },
  ] as const;

  return (
    <section
      className="overflow-hidden rounded-3xl bg-white"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04), 0 4px 10px -2px rgba(15,23,42,0.06), 0 16px 36px -12px rgba(15,23,42,0.10)",
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-6 sm:px-7">
        <div className="w-full pr-2 sm:w-auto sm:pr-0">
          <p className="eyebrow mb-1.5 text-indigo-600">Diff · ujung tombak review</p>
          <h2
            className="text-[20px] font-semibold leading-tight text-slate-900 sm:text-[28px]"
            style={{ letterSpacing: "-0.028em" }}
          >
            {changeCount > 0 ? (
              <>
                {changeCount}{" "}
                <span className="font-normal text-slate-400">
                  field akan berubah di halaman desa
                </span>
              </>
            ) : (
              <span className="font-normal text-slate-400">
                Tidak ada perubahan dari data saat ini
              </span>
            )}
          </h2>
          <div className="mt-3 sm:hidden">
            <div className="grid grid-cols-4 gap-1.5 text-[9px] font-medium">
              {legendItems.map((item) => (
                <div
                  key={`${item.label}-mobile`}
                  className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-1.5 py-1 ${item.chipClassName}`}
                  style={{ boxShadow: `inset 0 0 0 1px ${item.ringColor}` }}
                >
                  <span className={`h-2 w-2 rounded-full ${item.dotClassName}`} />
                  <span className="truncate">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
            {legendItems.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10.5px] font-medium ${item.chipClassName}`}
                style={{ boxShadow: `inset 0 0 0 1px ${item.ringColor}` }}
              >
                <span className={`h-2 w-2 rounded-full ${item.dotClassName}`} />
                <span>{item.label}</span>
                <span className="text-slate-400">=</span>
                <span>{item.note}</span>
              </span>
            ))}
          </div>
        </div>

        <IntakeDiffFilterTabs
          filter={filter}
          entries={entries}
          addedCount={addedCount}
          updatedCount={updatedCount}
          removedCount={removedCount}
          unchangedCount={unchangedEntries.length}
          onChange={setFilter}
        />
      </div>

      <div
        className="hidden px-7 pb-2 sm:grid"
        style={{
          gridTemplateColumns: "4px 180px 1fr 24px 1fr",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div />
        <div />
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Saat ini
        </div>
        <div />
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Setelah publish · draft
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="px-7 pb-6 text-sm italic text-slate-400">
          Tidak ada perubahan untuk filter ini.
        </div>
      ) : (
        orderedSections.map(([sectionName, sectionEntries]) => {
          const sectionChangedCount = sectionEntries.filter(
            (entry) => entry.deltaType !== "unchanged",
          ).length;

          return (
            <div
              key={sectionName}
              className="border-t border-slate-100 px-3 pb-2 first:border-t-0"
            >
              <div className="flex items-center justify-between px-5 pb-1.5 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                  {sectionName}
                  <span className="ml-1 font-normal text-slate-400">
                    · {sectionEntries.length} field
                  </span>
                </p>
                {sectionChangedCount > 0 ? (
                  <span className="text-[10.5px] tabular-nums text-slate-500">
                    {sectionChangedCount} berubah
                  </span>
                ) : null}
              </div>
              {sectionEntries.map((entry, index) => (
                <IntakeDiffRow key={`${entry.field}-${index}`} entry={entry} />
              ))}
            </div>
          );
        })
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-7 py-4">
        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          {filter === "all" && unchangedEntries.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowUnchanged((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              {showUnchanged ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showUnchanged ? "Sembunyikan" : "Tampilkan"} {unchangedEntries.length} field
              tidak berubah
            </button>
          ) : null}
          <span className="text-[11px]">
            Catatan:{" "}
            <span className="text-slate-700">
              guardrail aktif - publish final tetap di antrean review
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {addedCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900"
              style={{ boxShadow: "inset 0 0 0 1px rgba(5,95,70,0.12)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {addedCount} baru
            </span>
          ) : null}
          {updatedCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-[#1E1B4B]"
              style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.15)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {updatedCount} update
            </span>
          ) : null}
          {removedCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-900"
              style={{ boxShadow: "inset 0 0 0 1px rgba(159,18,57,0.15)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {removedCount} hapus
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
