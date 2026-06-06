import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark, Scale } from "lucide-react";
import { WHY_MONITORING_PAGE } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Kenapa Desa Dipantau — PantauDesa",
  description: "PantauDesa menjelaskan kenapa memantau desa adalah bentuk menjaga transparansi, bukan menuduh desa tanpa dasar.",
};

export default function KenapaDesaDipantauPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <Landmark size={14} />
            {WHY_MONITORING_PAGE.eyebrow}
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            {WHY_MONITORING_PAGE.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {WHY_MONITORING_PAGE.intro}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {WHY_MONITORING_PAGE.sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CheckCircle2 size={18} />
              </div>
              <h2 className="text-base font-black text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
              <Scale size={20} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black">Benahi dari bawah, dengan cara yang adil.</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{WHY_MONITORING_PAGE.closing}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/desa"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  Cari desa yang ingin dipantau
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/panduan/kewenangan"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Lihat panduan kewenangan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
