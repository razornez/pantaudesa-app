"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Clock3 } from "lucide-react";
import AdminDesaFilterBar, {
  type AdminDesaFilter,
} from "@/components/internal-admin/AdminDesaFilterBar";
import type { AuditRow, VersionRow } from "./types";
import { fetchVersionsData } from "./api";
import {
  EmptyState,
  ErrorNotice,
  SkeletonCards,
  VersionStatusPill,
} from "./shared";

function formatAuditTimestamp(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    time: date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function VersionsTab() {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((filter: AdminDesaFilter) => {
    setLoading(true);
    fetchVersionsData(filter)
      .then((payload) => {
        setVersions(payload.versions ?? []);
        setAuditEvents(payload.auditEvents ?? []);
        setTotal(payload.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat riwayat versi.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchVersionsData({ q: "", provinsi: "", kabupaten: "", kecamatan: "" })
      .then((payload) => {
        if (cancelled) return;
        setVersions(payload.versions ?? []);
        setAuditEvents(payload.auditEvents ?? []);
        setTotal(payload.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Gagal memuat riwayat versi.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorNotice message={error} />;

  return (
    <div className="space-y-5">
      <AdminDesaFilterBar onChange={fetchData} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section
          className="rounded-3xl bg-white p-6"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
          }}
        >
          <p className="eyebrow mb-1.5 text-indigo-600">Riwayat versi</p>
          <h3 className="mb-4 text-[17px] font-semibold text-slate-900">
            {total > 0 ? `${total} versi data tersimpan` : "Riwayat versi"}
          </h3>
          {loading ? (
            <SkeletonCards count={3} height="h-14" />
          ) : versions.length === 0 ? (
            <EmptyState
              icon={<Clock3 size={18} />}
              title="Belum ada riwayat versi"
              note="Versi akan muncul setelah intake dikirim ke review dan diproses."
            />
          ) : (
            <div className="space-y-2.5">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-2xl bg-slate-50/60 p-4"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-900">
                        {version.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {version.desa.nama} · {version.desa.kecamatan}
                      </p>
                    </div>
                    <VersionStatusPill status={version.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="tabular-nums">v{version.versionNumber}</span>
                    {version.changedFields.length > 0 ? (
                      <span>{version.changedFields.length} field berubah</span>
                    ) : null}
                    <span>
                      {new Date(version.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {version.changedFields.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {version.changedFields.slice(0, 4).map((field) => (
                        <span
                          key={field}
                          className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700"
                          style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.12)" }}
                        >
                          {field}
                        </span>
                      ))}
                      {version.changedFields.length > 4 ? (
                        <span className="text-[10px] text-slate-400">
                          +{version.changedFields.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className="rounded-3xl bg-white p-6"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
          }}
        >
          <p className="eyebrow mb-1.5 text-amber-700">Audit trail</p>
          <h3 className="mb-4 text-[17px] font-semibold text-slate-900">Aktivitas terbaru</h3>
          {loading ? (
            <SkeletonCards count={4} height="h-12" />
          ) : auditEvents.length === 0 ? (
            <EmptyState
              icon={<AlertCircle size={18} />}
              title="Belum ada aktivitas"
              note="Audit event akan tercatat setelah intake diproses atau data diterbitkan."
            />
          ) : (
            <div className="space-y-2">
              {auditEvents.map((event) => {
                const timestamp = formatAuditTimestamp(event.createdAt);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 border-b border-slate-50 py-2.5 last:border-b-0"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-slate-900">
                        {event.eventLabel ?? event.eventType}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {event.desa.nama} · {event.actorRole ?? "system"}
                      </p>
                      {event.note ? (
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{event.note}</p>
                      ) : null}
                    </div>
                    <span className="flex-shrink-0 text-right text-[10.5px] leading-tight text-slate-400 tabular-nums">
                      <span className="block">{timestamp.date}</span>
                      <span className="block">{timestamp.time}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
