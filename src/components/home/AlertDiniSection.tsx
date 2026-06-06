import Link from "next/link";
import Image from "next/image";
import { Radar, Search, ArrowRight } from "lucide-react";
import { Desa } from "@/lib/types";
import { SECTION } from "@/lib/copy";
import { ASSETS } from "@/lib/assets";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface Props {
  desa: Desa[];
}

export default function AlertDiniSection({ desa }: Props) {
  // Surface real desa (have Dana Desa) whose data is still the most incomplete,
  // so warga can help complete them — based on real completeness, not serapan.
  const perluDitinjau = desa
    .filter((d) => (d.paguDanaDesa ?? 0) > 0 && (d.completenessScore ?? 0) < 34)
    .sort((a, b) => (a.completenessScore ?? 0) - (b.completenessScore ?? 0))
    .slice(0, 3);

  if (perluDitinjau.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 overflow-hidden">

      {/* Header */}
      <div className="relative h-48 sm:h-52 w-full">
        <Image
          src={ASSETS.illustrationAlert}
          alt="Ilustrasi warga meninjau kondisi desa"
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/50 to-amber-900/20" />

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/85 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Search size={14} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-white drop-shadow">{SECTION.alertDini}</h2>
          </div>
          <p className="text-xs text-amber-100 ml-9">{SECTION.alertDiniSub(perluDitinjau.length)}</p>
        </div>
      </div>

      {/* Kartu desa yang perlu ditinjau */}
      <div className="bg-amber-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
              <Radar size={16} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black text-amber-950">Risk Radar</p>
              <p className="text-xs text-amber-700">Sinyal awal untuk desa yang perlu dicek dulu.</p>
            </div>
          </div>
          <DataStatusBadge status="needs-review" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {perluDitinjau.map((d, i) => (
            <Link
              key={d.id}
              href={`/desa/${d.id}`}
              className="group relative min-h-[44px] overflow-hidden rounded-2xl border border-amber-100 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              aria-label={`Lengkapi data ${d.nama}, kelengkapan ${d.completenessScore ?? 0}%`}
            >
              <div className="risk-radar-grid absolute inset-0 opacity-60" aria-hidden />
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className="risk-pulse-dot mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500"
                      style={{ animationDelay: `${i * 0.18}s` }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 leading-tight group-hover:text-amber-800 transition-colors">
                        {d.nama}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{d.kabupaten}, {d.provinsi}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 p-2.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wide text-amber-700">Kelengkapan data</span>
                    <span className="text-sm font-black text-amber-800">{d.completenessScore ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700 group-hover:brightness-110"
                      style={{ width: `${d.completenessScore ?? 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">Buka sumber</span>
                  <ArrowRight size={13} className="text-amber-500 transition-all group-hover:translate-x-1 group-hover:text-amber-700" aria-hidden />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
