"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
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

const EVENT_LABEL: Record<string, string> = {
  INTERNAL_INTAKE_SUBMITTED: "Dokumen disubmit ke review",
  INTERNAL_DOCUMENT_REVIEWED: "Dokumen direview",
  INTERNAL_AI_MAPPING_RUN: "AI mapping dijalankan",
  INTERNAL_AI_MAPPING_ACCEPTED: "Mapping AI diterima",
  INTERNAL_DATA_PUBLISHED: "Data diterbitkan",
  INTERNAL_DOCUMENT_FAILED: "Dokumen gagal diproses",
  DATA_DESA_PUBLISHED: "Data desa diterbitkan",
  DATA_DESA_REJECTED: "Data desa ditolak",
};

type TimelineItem =
  | { kind: "audit"; row: AuditRow }
  | { kind: "version"; row: VersionRow };

function formatActivityTimestamp(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    }),
    time: date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function ActivityLogTab() {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((filter: AdminDesaFilter) => {
    setLoading(true);
    fetchVersionsData(filter, { pageSize: 50 })
      .then((payload) => {
        setVersions(payload.versions ?? []);
        setAuditEvents(payload.auditEvents ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat log aktivitas.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchVersionsData(
      { q: "", provinsi: "", kabupaten: "", kecamatan: "" },
      { pageSize: 50 },
    )
      .then((payload) => {
        if (cancelled) return;
        setVersions(payload.versions ?? []);
        setAuditEvents(payload.auditEvents ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Gagal memuat log aktivitas.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const timeline = useMemo<TimelineItem[]>(() => {
    return [
      ...auditEvents.map((row) => ({ kind: "audit" as const, row })),
      ...versions.map((row) => ({ kind: "version" as const, row })),
    ].sort((left, right) => {
      const leftDate = left.row.createdAt;
      const rightDate = right.row.createdAt;
      return new Date(rightDate).getTime() - new Date(leftDate).getTime();
    });
  }, [auditEvents, versions]);

  if (error) return <ErrorNotice message={error} />;

  return (
    <div className="space-y-5">
      <section
        className="rounded-3xl bg-white p-6"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-indigo-600 mb-1.5">Histori · semua aksi data desa</p>
            <h2 className="text-[18px] font-semibold text-slate-900 leading-tight">
              Log Aktivitas
            </h2>
            <p className="text-[12px] text-slate-500 mt-1">
              Rekam jejak intake, publikasi, dan perubahan data desa. Hanya untuk
              dibaca — aksi dilakukan di Intake Workbench dan modal review dokumen.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <AdminDesaFilterBar onChange={fetchData} />
        </div>
      </section>

      {loading ? (
        <SkeletonCards count={5} height="h-12" />
      ) : timeline.length === 0 ? (
        <EmptyState
          icon={<Activity size={20} />}
          title="Belum ada aktivitas tercatat"
          note="Log akan muncul setelah intake disubmit atau data diterbitkan."
        />
      ) : (
        <section
          className="rounded-3xl bg-white p-6"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
          }}
        >
          <div className="space-y-0 divide-y divide-slate-50">
            {timeline.map((item, index) => {
              if (item.kind === "audit") {
                const event = item.row;
                const timestamp = formatActivityTimestamp(event.createdAt);
                return (
                  <div key={`a-${event.id}-${index}`} className="flex items-start gap-3 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium text-slate-900">
                        {event.eventLabel ?? EVENT_LABEL[event.eventType] ?? event.eventType}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {event.desa.nama} · {event.actorRole ?? "system"}
                      </p>
                      {event.note ? (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {event.note}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[10.5px] text-slate-400 flex-shrink-0 tabular-nums text-right leading-tight">
                      <span className="block">{timestamp.date}</span>
                      <span className="block">{timestamp.time}</span>
                    </span>
                  </div>
                );
              }

              const version = item.row;
              const timestamp = formatActivityTimestamp(version.createdAt);
              return (
                <div key={`v-${version.id}-${index}`} className="flex items-start gap-3 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12.5px] font-medium text-slate-900 truncate">
                        {version.title}
                      </p>
                      <VersionStatusPill status={version.status} />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {version.desa.nama} · v{version.versionNumber}
                    </p>
                  </div>
                  <span className="text-[10.5px] text-slate-400 flex-shrink-0 tabular-nums text-right leading-tight">
                    <span className="block">{timestamp.date}</span>
                    <span className="block">{timestamp.time}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
