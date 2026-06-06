"use client";

import { Building2, UserRound } from "lucide-react";
import { PerangkatDesa } from "@/lib/types";

interface Props {
  perangkat: PerangkatDesa[];
}

const JABATAN_COLORS: Record<string, string> = {
  "Kepala Desa": "bg-indigo-100 text-indigo-700",
  "Sekretaris Desa": "bg-sky-100 text-sky-700",
  "Bendahara Desa": "bg-emerald-100 text-emerald-700",
  "Kaur Perencanaan": "bg-cyan-100 text-cyan-700",
  "Kaur Keuangan": "bg-amber-100 text-amber-700",
};

function getJabatanTone(jabatan: string) {
  return JABATAN_COLORS[jabatan] ?? "bg-slate-100 text-slate-600";
}

export default function PerangkatDesaSection({ perangkat }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black tracking-tight text-slate-900">
          Siapa yang Harus Kamu Tanya?
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Pejabat desa yang bertanggung jawab atas pengelolaan anggaran ini.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {perangkat.map((item, index) => (
          <article
            key={`${item.jabatan}-${item.nama}-${index}`}
            className="rounded-[24px] border border-slate-100 bg-slate-50/75 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                <UserRound size={16} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getJabatanTone(item.jabatan)}`}
                >
                  {item.jabatan}
                </span>
                <p className="mt-2 text-[22px] font-black leading-none tracking-tight text-slate-950 sm:text-xl">
                  {item.nama}
                </p>

                {item.periode ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Masa jabatan {item.periode}
                  </p>
                ) : null}

                {item.kontak ? (
                  <div className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                    <Building2 size={12} className="mt-0.5 flex-shrink-0 text-slate-400" aria-hidden />
                    <span>Nomor kantor desa — hubungi via kanal resmi</span>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
