import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Desa, SortField, SortOrder } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { TABLE_HEADERS } from "@/lib/copy";

interface Props {
  desa: Desa[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortHeader({ label, field, active, onSort }: {
  label: string; field: SortField; active: boolean; order: SortOrder; onSort: (f: SortField) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-1 text-left transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
    >
      {label}
      <ArrowUpDown size={12} className={active ? "text-indigo-500" : "text-slate-300"} aria-hidden />
    </button>
  );
}

export default function DesaTable({ desa, sortField, sortOrder, onSort }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr className="text-xs font-medium text-slate-500">
              <th className="px-4 py-3 text-left">
                <SortHeader label={TABLE_HEADERS.nama} field="nama" active={sortField === "nama"} order={sortOrder} onSort={onSort} />
              </th>
              <th className="hidden px-4 py-3 text-left md:table-cell">{TABLE_HEADERS.wilayah}</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">
                <SortHeader label="Dana Desa" field="paguDanaDesa" active={sortField === "paguDanaDesa"} order={sortOrder} onSort={onSort} />
              </th>
              <th className="hidden px-4 py-3 text-right lg:table-cell" />
              <th className="px-4 py-3 text-right">
                <SortHeader label="Kelengkapan" field="completenessScore" active={sortField === "completenessScore"} order={sortOrder} onSort={onSort} />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {desa.map((d) => (
              <tr key={d.id} className="group transition-colors hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/desa/${d.id}`}
                    className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    <p className="font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">{d.nama}</p>
                    <p className="text-xs leading-relaxed text-slate-500 md:hidden">{d.kabupaten}</p>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                  <p className="text-xs">{d.kecamatan}</p>
                  <p className="text-xs text-slate-400">{d.kabupaten}, {d.provinsi}</p>
                </td>
                <td className="hidden px-4 py-3 text-right text-slate-700 lg:table-cell">
                  {(d.paguDanaDesa ?? 0) > 0 ? formatRupiah(d.paguDanaDesa ?? 0) : "—"}
                </td>
                <td className="hidden px-4 py-3 text-right text-slate-700 lg:table-cell">—</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {d.completenessScore ?? 0}%
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            (d.completenessScore ?? 0) >= 75 ? "bg-emerald-500" :
                            (d.completenessScore ?? 0) >= 40 ? "bg-sky-500" : "bg-amber-400"
                          }`}
                          style={{ width: `${d.completenessScore ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/desa/${d.id}`}
                    className="inline-flex min-h-[36px] items-center rounded-lg px-2 text-xs font-semibold text-indigo-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    Lihat Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
