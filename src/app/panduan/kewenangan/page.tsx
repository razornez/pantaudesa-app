import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import { AUTHORITY_GUIDE_PAGE } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Panduan Kewenangan — PantauDesa",
  description: "Panduan umum agar warga dapat membedakan kewenangan desa, kabupaten/kota, provinsi, dan pusat sebelum bertanya atau melapor.",
};

export default function PanduanKewenanganPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
            <Scale size={14} />
            {AUTHORITY_GUIDE_PAGE.eyebrow}
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            {AUTHORITY_GUIDE_PAGE.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {AUTHORITY_GUIDE_PAGE.intro}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {AUTHORITY_GUIDE_PAGE.categories.map((category) => (
            <article key={category.level} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">{category.level}</h2>
              <ul className="mt-4 space-y-2">
                {category.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <p className="text-sm leading-relaxed text-amber-900">{AUTHORITY_GUIDE_PAGE.disclaimer}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-lg font-black text-slate-900">Mulai dari data yang bisa dicek.</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Jika masalahnya terkait APBDes, dokumen publik, atau program desa, buka detail desa terlebih dahulu. Jika masalahnya berada di luar kewenangan desa, gunakan panduan ini untuk mengarahkannya ke pihak yang lebih tepat.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/desa"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Cari desa
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/panduan"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Buka FAQ PantauDesa
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
