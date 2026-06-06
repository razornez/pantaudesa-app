"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import type { DesaComponentData } from "./types";
import {
  fetchDesaComponentData,
  saveComponentVisibility,
} from "./api";

const visibleToneMap = {
  empty: {
    card: "bg-rose-50/80 text-rose-950",
    ring: "rgba(244,63,94,0.14)",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
  partial: {
    card: "bg-amber-50/85 text-amber-950",
    ring: "rgba(245,158,11,0.16)",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  complete: {
    card: "bg-emerald-50/80 text-emerald-950",
    ring: "rgba(16,185,129,0.16)",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
} as const;

const hiddenTone = {
  card: "bg-slate-50/90 text-slate-900",
  ring: "rgba(15,23,42,0.07)",
  badge: "bg-slate-100 text-slate-600",
  dot: "bg-slate-400",
} as const;

function completionLabel(status: "empty" | "partial" | "complete") {
  if (status === "complete") return "Lengkap";
  if (status === "partial") return "Sebagian";
  return "Kosong";
}

function teaserText(labels: string[]) {
  if (labels.length === 0) return "Belum ada field terisi";
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} +${labels.length - 3} lagi`;
}

export function ComponentVisibilityPanel({ desaId }: { desaId: string }) {
  const [data, setData] = useState<DesaComponentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null);
  const lastLoadedDesaIdRef = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchDesaComponentData(desaId)
      .then((payload) => {
        setData(payload);
        setExpandedComponentId((current) =>
          payload.visibleComponents.some((component) => component.componentId === current) ||
          payload.hiddenComponents.some((component) => component.componentId === current)
            ? current
            : null,
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [desaId]);

  useEffect(() => {
    if (lastLoadedDesaIdRef.current === desaId) return;
    lastLoadedDesaIdRef.current = desaId;
    load();
  }, [desaId, load]);

  const toggle = async (componentId: string, currentlyVisible: boolean) => {
    if (data?.source !== "db") return;
    setToggling(componentId);

    const newVisible = !currentlyVisible;
    setData((previous) => {
      if (!previous) return previous;

      if (newVisible) {
        const component = previous.hiddenComponents.find(
          (item) => item.componentId === componentId,
        );
        if (!component) return previous;

        return {
          ...previous,
          hiddenComponents: previous.hiddenComponents.filter(
            (item) => item.componentId !== componentId,
          ),
          visibleComponents: [
            ...previous.visibleComponents,
            { ...component, isVisible: true },
          ],
        };
      }

      const component = previous.visibleComponents.find(
        (item) => item.componentId === componentId,
      );
      if (!component) return previous;

      return {
        ...previous,
        visibleComponents: previous.visibleComponents.filter(
          (item) => item.componentId !== componentId,
        ),
        hiddenComponents: [
          ...previous.hiddenComponents,
          { ...component, isVisible: false },
        ],
      };
    });

    try {
      await saveComponentVisibility({ desaId, componentId, isVisible: newVisible });
      const payload = await fetchDesaComponentData(desaId);
      setData((previous) => (previous ? payload : previous));
    } catch {
      load();
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl bg-white/60 px-4 py-3 animate-pulse h-16"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
      />
    );
  }

  if (!data) return null;

  const allComponents = [
    ...data.visibleComponents,
    ...data.hiddenComponents,
  ].sort((left, right) => left.displayOrder - right.displayOrder);

  return (
    <div
      className="rounded-2xl bg-white/70 px-4 py-3 space-y-3"
      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Kelengkapan Komponen
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {data.filledFieldCount ?? 0}/{Math.max(data.totalFields, 1)} field publik aktif terisi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] text-slate-400">{data.templateName}</span>
          {data.source === "fallback" ? (
            <span
              className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
              style={{ boxShadow: "inset 0 0 0 1px rgba(217,119,6,0.15)" }}
            >
              Migrasi belum aktif
            </span>
          ) : null}
        </div>
      </div>

      {data.mismatchPublishedFieldCount ? (
        <div
          className="rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800"
          style={{ boxShadow: "inset 0 0 0 1px rgba(217,119,6,0.14)" }}
        >
          Ada {data.mismatchPublishedFieldCount} field published lama yang relasi templatenya belum sinkron.
          Progress panel hanya menghitung field yang sudah cocok dengan template aktif sekarang.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {allComponents.map((component) => {
          const isExpanded = expandedComponentId === component.componentId;
          const tone =
            component.isVisible
              ? visibleToneMap[component.completionStatus]
              : hiddenTone;

          return (
            <div
              key={component.componentId}
              className={`rounded-2xl px-3 py-3 transition-colors ${tone.card}`}
              style={{ boxShadow: `inset 0 0 0 1px ${tone.ring}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedComponentId((current) =>
                      current === component.componentId ? null : component.componentId,
                    )
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    {component.isVisible ? (
                      <Eye size={12} className="text-emerald-600 flex-shrink-0" aria-hidden />
                    ) : (
                      <EyeOff size={12} className="text-slate-500 flex-shrink-0" aria-hidden />
                    )}
                    <span className="truncate text-[12.5px] font-semibold">{component.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}
                    >
                      {component.isVisible
                        ? completionLabel(component.completionStatus)
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="tabular-nums font-semibold">
                      {component.filledFieldCount}/{component.totalFieldCount}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
                    <span className="min-w-0 truncate">
                      {teaserText(component.teaserLabels)}
                    </span>
                  </div>
                </button>

                <div className="flex items-start gap-2">
                  {data.source === "db" ? (
                    <button
                      type="button"
                      disabled={toggling === component.componentId}
                      onClick={(event) => {
                        event.stopPropagation();
                        void toggle(component.componentId, component.isVisible);
                      }}
                      className={`flex-shrink-0 rounded-xl px-2.5 py-1 text-[10.5px] font-medium transition-colors disabled:opacity-40 ${
                        component.isVisible
                          ? "bg-white/70 text-slate-600 hover:bg-white"
                          : "bg-white/90 text-emerald-700 hover:bg-white"
                      }`}
                      style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.07)" }}
                    >
                      {toggling === component.componentId
                        ? "..."
                        : component.isVisible
                          ? "Sembunyikan"
                          : "Tampilkan"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComponentId((current) =>
                        current === component.componentId ? null : component.componentId,
                      )
                    }
                    className="rounded-xl bg-white/70 p-1.5 text-slate-500 transition-transform hover:bg-white"
                    style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.07)" }}
                    aria-label={`Lihat ringkasan ${component.label}`}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div
                  className="mt-3 space-y-3 rounded-xl bg-white/70 p-3"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
                >
                  {component.derivedSignals.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {component.derivedSignals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-600"
                          style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.07)" }}
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {component.derivedSignals.length > 0 && component.fieldCount === 0 ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Sinyal aktif
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                          {component.filledFieldLabels.length > 0
                            ? component.filledFieldLabels.join(", ")
                            : "Belum ada sinyal aktif di komponen ini."}
                        </p>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        Komponen ini bersifat pendukung dan tidak masuk hitungan field template publik di ringkasan atas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Sudah terisi
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                          {component.filledFieldLabels.length > 0
                            ? component.filledFieldLabels.join(", ")
                            : "Belum ada field terisi."}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Masih kosong
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {component.missingFieldLabels.length > 0
                            ? component.missingFieldLabels.join(", ")
                            : "Tidak ada field kosong di komponen ini."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
