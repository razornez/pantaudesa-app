import type { DesaVersionEntry } from "./types";
import { formatDateTime } from "./utils";

interface DesaVersionHistoryListProps {
  desaName: string | null;
  loading: boolean;
  error: string | null;
  versions: DesaVersionEntry[];
  storageNote: string | null;
}

export function DesaVersionHistoryList({
  desaName,
  loading,
  error,
  versions,
  storageNote,
}: DesaVersionHistoryListProps) {
  if (!desaName) {
    return (
      <p className="text-xs text-slate-500">
        Pilih desa di langkah 1 untuk melihat riwayat versi.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-xs text-slate-500">
        Memuat riwayat versi {desaName}...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-slate-500">
        Belum bisa memuat riwayat versi: {error}
      </p>
    );
  }

  if (versions.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Belum ada riwayat versi untuk {desaName}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {storageNote ? <p className="text-[11px] text-slate-500">{storageNote}</p> : null}
      <ul className="space-y-1.5">
        {versions.slice(0, 5).map((version) => (
          <li
            key={version.id}
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">
                v{version.versionNumber} · {version.title}
              </span>
              <span className="text-[11px] text-slate-500">
                {formatDateTime(version.createdAt)}
              </span>
            </div>
            {version.changedFields.length > 0 ? (
              <p className="mt-0.5 text-[11px] text-slate-500">
                Field berubah: {version.changedFields.join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
