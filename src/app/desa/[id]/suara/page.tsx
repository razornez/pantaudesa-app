import Link from "next/link";
import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { getDesaByIdOrSlugWithFallback } from "@/lib/data/desa-read";
import SuaraWargaSection from "@/components/desa/SuaraWargaSection";

interface Props {
  params: Promise<{ id: string }>;
}

// Generate on-demand (ISR) instead of prerendering all 3,581 desa at build —
// matches the /desa/[id] detail page strategy, keeps builds fast, and avoids
// hammering the DB with thousands of queries during the build.
export const revalidate = 300;

export default async function SuaraWargaDesaPage({ params }: Props) {
  const { id } = await params;
  const desa   = await getDesaByIdOrSlugWithFallback(id);

  if (!desa) return notFound();

  const score = desa.completenessScore ?? 0;
  const badge =
    score >= 75 ? { label: "Data Lengkap", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" } :
    score >= 34 ? { label: "Data Sedang",  cls: "border-sky-200 bg-sky-50 text-sky-700" } :
                  { label: "Data Minim",   cls: "border-amber-200 bg-amber-50 text-amber-700" };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
          <li><Link href="/" className="hover:text-indigo-600 transition-colors">Beranda</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/desa" className="hover:text-indigo-600 transition-colors">Desa</Link></li>
          <li aria-hidden>›</li>
          <li><Link href={`/desa/${id}`} className="hover:text-indigo-600 transition-colors">{desa.nama}</Link></li>
          <li aria-hidden>›</li>
          <li className="font-medium text-slate-700" aria-current="page">Suara Warga</li>
        </ol>
      </nav>

      {/* Mini header desa */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">{desa.nama}</h1>
          <div className="flex items-center gap-1 mt-0.5 text-slate-400">
            <MapPin size={12} />
            <span className="text-xs">{desa.kecamatan}, {desa.kabupaten}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Suara Warga full */}
      <SuaraWargaSection desaId={desa.id} desaNama={desa.nama} />
    </div>
  );
}
