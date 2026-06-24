import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, FolderOpen, Search } from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import StatsCards from "@/components/home/StatsCards";
import SerapanDonut from "@/components/home/SerapanDonut";
import DesaLeaderboard from "@/components/home/DesaLeaderboard";
import AlertDiniSection from "@/components/home/AlertDiniSection";
import CitizenJourneySection from "@/components/home/CitizenJourneySection";
import DocumentDeskSection from "@/components/home/DocumentDeskSection";
import { buildSummaryStats, getDesaListResult } from "@/lib/data/desa-read";
import { perfStart, publicPerfLog, publicPerfLogWithRows } from "@/lib/perf";
import type { Desa } from "@/lib/types";
import { SECTION } from "@/lib/copy";
import { ASSETS } from "@/lib/assets";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PantauDesa — Transparansi Anggaran Dana Desa",
  description:
    "Pantau Dana Desa, APBDes, dan profil desa di Jawa Barat dan Jawa Tengah. Data resmi dari DJPK, Dukcapil, dan sumber pemerintah — terbuka untuk semua warga.",
  keywords: [
    "dana desa jawa barat", "dana desa jawa tengah", "APBDes", "transparansi anggaran desa",
    "pantau desa", "data desa", "kelengkapan data desa",
  ],
};

// Revalidate every 5 minutes — same TTL as the module-level desa list cache.
// Avoids re-fetching 3,581 desa rows on every single page visit.
export const revalidate = 300;

export default async function HomePage() {
  const routeTimer = perfStart();
  const desaListTimer = perfStart();
  const desaResult = await getDesaListResult();
  publicPerfLogWithRows("public.home", "getDesaListResult()", desaResult.items.length, desaListTimer);
  const compositionTimer = perfStart();
  const desaItems = desaResult.items;
  const summaryStats = buildSummaryStats(desaItems);

  // Sort by data completeness (real fields count), not budget absorption.
  const score = (d: Desa) => d.completenessScore ?? 0;

  const topBaik = [...desaItems]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5);

  const topRendah = [...desaItems]
    .filter((d) => score(d) < 20) // desa with very few real fields
    .sort((a, b) => score(a) - score(b))
    .slice(0, 3);

  // Provinsi ranking — by average data completeness
  const byProvinsi = desaItems.reduce<Record<string, { total: number; count: number; best: Desa }>>((acc, d) => {
    if (!acc[d.provinsi]) acc[d.provinsi] = { total: 0, count: 0, best: d };
    acc[d.provinsi].total += score(d);
    acc[d.provinsi].count += 1;
    if (score(d) > score(acc[d.provinsi].best)) acc[d.provinsi].best = d;
    return acc;
  }, {});

  const provinsiRanking = Object.entries(byProvinsi)
    .map(([provinsi, { total, count, best }]) => ({
      provinsi,
      avg:   Math.round(total / count),
      count,
      best:  best.nama.replace(/^Desa\s+/, ""),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);
  publicPerfLog("public.home", "aggregateHomepageData", compositionTimer);
  publicPerfLog("public.home", "routeDataReady", routeTimer);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection totalDesa={desaItems.length} tahun={2024} />

      {desaResult.state !== "ready" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Data belum siap ditampilkan</p>
          <p className="mt-1 text-xs leading-relaxed">
            Beberapa bagian halaman belum bisa memuat data terbaru. Coba muat ulang beberapa saat lagi.
          </p>
        </div>
      )}

      <section>
        <div className="mb-4 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Prioritas warga</p>
          <h2 className="text-lg font-semibold text-slate-800 mt-1">Mulai dari desa yang datanya paling lengkap</h2>
          <p className="text-sm text-slate-500 mt-1">
            Urutan ini berdasarkan seberapa lengkap data resmi tiap desa berhasil dikumpulkan — semakin lengkap, semakin mudah dipantau warga.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-4 items-start">
          <DesaLeaderboard
            topBaik={topBaik}
            topRendah={topRendah}
            provinsiRanking={provinsiRanking}
            totalDesa={desaItems.length}
          />
          <AlertDiniSection desa={desaItems} />
        </div>
      </section>

      <CitizenJourneySection />
      <DocumentDeskSection />

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">{SECTION.ringkasanNasional}</h2>
        <p className="text-sm text-slate-500 mb-4">{SECTION.ringkasanNasionalSub}</p>
        <StatsCards stats={summaryStats} />
      </div>

      {/* ── Charts + Leaderboard ─────────────────────────────────────────── */}
      <section>
        <div className="mb-4 max-w-2xl">
          <h2 className="text-base font-semibold text-slate-800">Sebaran kelengkapan data</h2>
          <p className="text-sm text-slate-500 mt-1">
            Berapa banyak desa yang datanya sudah lengkap, sedang, atau masih minim.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SerapanDonut stats={summaryStats} />
        </div>
      </section>

      {/* ── CTA + Citizen Illustration ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className="relative w-full lg:w-80 h-56 lg:h-auto flex-shrink-0">
            <Image
              src={ASSETS.illustrationCitizen}
              alt="Warga desa mengakses data anggaran desanya"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Dari bingung jadi tahu harus cek apa</p>
            <h2 className="mt-1 text-lg font-bold text-slate-800">PantauDesa merapikan bahan bacaan warga.</h2>
            <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-500">
                    <Search size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Sebelum</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Warga membuka banyak website dan bingung dokumen mana yang terbaru.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">
                    <FolderOpen size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Sesudah</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      PantauDesa merapikan sumber, dokumen, dan status agar lebih mudah dicek.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mb-5 inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 lg:justify-start">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Tetap gunakan sumber dan status data sebelum membuat kesimpulan.
            </p>
            <div>
              <Link
                href="/desa"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md"
              >
                Cari Desamu Sekarang <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
