import Link from "next/link";
import { buildQueueFocusHref } from "./constants";
import type { IntakeHistorySubmission } from "./types";
import { formatDateTime } from "./utils";

function formatSubmissionStatus(status: string) {
  switch (status) {
    case "WAITING_VERIFIED_APPROVAL":
      return "Menunggu persetujuan";
    case "PROCESSING":
      return "Perlu review internal";
    case "PUBLISHED":
      return "Sudah dipublikasikan";
    case "REJECTED":
      return "Ditolak verified";
    case "FAILED":
      return "Perlu unggah ulang";
    default:
      return status;
  }
}

interface IntakeHistoryListProps {
  loading: boolean;
  error: string | null;
  submissions: IntakeHistorySubmission[];
  storageNote: string | null;
}

export function IntakeHistoryList({
  loading,
  error,
  submissions,
  storageNote,
}: IntakeHistoryListProps) {
  if (loading) {
    return <p className="text-xs text-slate-500">Memuat riwayat intake...</p>;
  }

  if (error) {
    return (
      <p className="text-xs text-slate-500">
        Belum bisa memuat riwayat: {error}
      </p>
    );
  }

  if (submissions.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Belum ada submission intake yang tercatat.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {storageNote ? <p className="text-[11px] text-slate-500">{storageNote}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Shortcut terbaru
        </p>
        <Link
          href="/internal-admin/documents"
          className="text-[11px] font-semibold text-sky-700 hover:underline"
        >
          Buka antrean review
        </Link>
      </div>
      <ul className="space-y-2">
        {submissions.slice(0, 5).map((item) => (
          <li key={item.id}>
            <Link
              href={buildQueueFocusHref({ status: item.status, documentId: item.id })}
              className="group block rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.desa.nama} · {formatDateTime(item.updatedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {formatSubmissionStatus(item.status)}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Klik untuk membuka kartu ini di antrean review.
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
