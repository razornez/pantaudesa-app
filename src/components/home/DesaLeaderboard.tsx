"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, TrendingDown, MapPin, Trophy, Map, Search, type LucideIcon } from "lucide-react";
import { Desa } from "@/lib/types";
import { BADGE_STYLES } from "@/lib/badge";
// getSerapanColor removed — progress now shows data completeness, not budget absorption
import { ASSETS } from "@/lib/assets";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "terbaik" | "provinsi" | "ditinjau";

interface ProvinsiRow {
  provinsi: string;
  avg:      number;
  count:    number;
  best:     string;   // nama desa terbaik di provinsi ini
}

// ─── Trophy podium ────────────────────────────────────────────────────────────

function PodiumBlock({ desa, rank }: { desa: Desa; rank: 1 | 2 | 3 }) {
  const medal  = rank === 1 ? "🏆" : rank === 2 ? "🥈" : "🥉";
  const config = {
    1: { height: "h-20", bg: "from-amber-200 to-amber-300", border: "border-amber-300", ring: "bg-amber-400", textAccent: "text-amber-800", podiumBg: "bg-amber-200", fontSize: "text-[12px]", pctSize: "text-base" },
    2: { height: "h-14", bg: "from-slate-200 to-slate-300", border: "border-slate-300", ring: "bg-slate-400", textAccent: "text-slate-700", podiumBg: "bg-slate-200", fontSize: "text-[11px]", pctSize: "text-sm" },
    3: { height: "h-10", bg: "from-orange-200 to-orange-300", border: "border-orange-300", ring: "bg-orange-400", textAccent: "text-orange-800", podiumBg: "bg-orange-200", fontSize: "text-[10px]", pctSize: "text-xs" },
  }[rank];

  return (
    <Link href={`/desa/${desa.id}`} className="flex-1 flex flex-col items-center group">
      {/* Card above podium */}
      <div className={`w-full bg-gradient-to-b ${config.bg} border ${config.border} rounded-t-2xl pt-3 pb-2 px-1.5 text-center shadow-sm group-hover:brightness-95 transition-all`}>
        <div className="text-xl mb-1">{medal}</div>
        <p className={`${config.fontSize} font-black ${config.textAccent} leading-tight truncate px-1`}>
          {desa.nama.replace(/^Desa\s+/, "")}
        </p>
        <p className={`${config.pctSize} font-black ${config.textAccent} mt-0.5`}>
          {desa.completenessScore ?? 0}%
        </p>
        {desa.profil?.badge && (
          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded-full mt-1 ${
            BADGE_STYLES[desa.profil.badge.warna].bg
          } ${BADGE_STYLES[desa.profil.badge.warna].text}`}>
            {desa.profil.badge.icon}
          </span>
        )}
      </div>
      {/* Podium base */}
      <div className={`w-full ${config.height} ${config.podiumBg} border-x border-b ${config.border} rounded-b flex items-center justify-center`}>
        <span className={`text-xs font-black ${config.textAccent} opacity-60`}>#{rank}</span>
      </div>
    </Link>
  );
}

// ─── Rank row (4, 5, ...) ─────────────────────────────────────────────────────

function RankRow({ desa, rank, warning = false }: { desa: Desa; rank: number; warning?: boolean }) {
  const badge  = desa.profil?.badge;
  const styles = badge ? BADGE_STYLES[badge.warna] : null;

  return (
    <Link
      href={`/desa/${desa.id}`}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0 ${warning ? "hover:bg-amber-50/40" : ""}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black ${
        warning ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
      }`}>
        {warning ? "?" : rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`text-sm font-semibold truncate ${warning ? "text-slate-700 group-hover:text-amber-700" : "text-slate-800 group-hover:text-indigo-600"} transition-colors`}>
            {desa.nama}
          </p>
          {badge && styles && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${styles.bg} ${styles.text} ${styles.border}`}>
              {badge.icon}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
          <MapPin size={8} />{desa.kecamatan}, {desa.kabupaten}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {warning && <TrendingDown size={12} className="text-amber-500" />}
        <div className="hidden sm:block w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              (desa.completenessScore ?? 0) >= 75 ? "bg-emerald-500" :
              (desa.completenessScore ?? 0) >= 40 ? "bg-sky-500" : "bg-amber-400"
            }`}
            style={{ width: `${desa.completenessScore ?? 0}%` }}
          />
        </div>
        <span className={`text-sm font-black ${warning ? "text-amber-700" : (desa.completenessScore ?? 0) >= 75 ? "text-emerald-600" : "text-sky-600"}`}>
          {desa.completenessScore ?? 0}%
        </span>
      </div>
      <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ─── Provinsi row ─────────────────────────────────────────────────────────────

function ProvinsiRow({ row, rank }: { row: ProvinsiRow; rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const barColor = row.avg >= 85 ? "bg-emerald-500" : row.avg >= 65 ? "bg-amber-400" : "bg-rose-400";
  const textColor = row.avg >= 85 ? "text-emerald-700" : row.avg >= 65 ? "text-amber-700" : "text-rose-700";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-7 flex-shrink-0 text-center">
        {medal
          ? <span className="text-base">{medal}</span>
          : <span className="text-xs font-black text-slate-400">#{rank}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-slate-700 truncate">{row.provinsi}</p>
          <span className={`text-sm font-black ml-2 flex-shrink-0 ${textColor}`}>{row.avg}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${row.avg}%` }} />
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{row.count} desa · terbaik: {row.best}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  topBaik:         Desa[];
  topRendah:       Desa[];
  provinsiRanking: ProvinsiRow[];
  totalDesa:        number;
}

export default function DesaLeaderboard({ topBaik, topRendah, provinsiRanking, totalDesa }: Props) {
  const [view, setView] = useState<View>("terbaik");

  const views: { id: View; label: string; shortLabel: string; icon: LucideIcon }[] = [
    { id: "terbaik",  label: "Data Terlengkap", shortLabel: "Terlengkap", icon: Trophy },
    { id: "provinsi", label: "Per Provinsi",   shortLabel: "Provinsi", icon: Map },
    { id: "ditinjau", label: "Data Terendah", shortLabel: "Terendah", icon: Search },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-50">
        {/* Ilustrasi banner tipis */}
        <div className="relative h-20 overflow-hidden">
          <Image
            src={ASSETS.illustrationDesaBaik}
            alt="Desa terbaik Indonesia"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-900/20 to-slate-950/65" />
          <div className="absolute bottom-2 left-4 right-4">
            <h2 className="text-base font-black text-white drop-shadow">Mulai Baca dari Desa Ini</h2>
            <p className="text-[11px] font-semibold text-white/90 drop-shadow">Diurutkan dari data paling lengkap.</p>
          </div>
        </div>
        <div className="px-5 pb-0 pt-1">
          {/* View toggle */}
          <div className="flex gap-1 overflow-hidden">
            {views.map(v => {
              const Icon = v.icon;
              return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`flex min-h-[44px] flex-1 items-center justify-center gap-1 px-2 py-2 text-[11px] font-bold rounded-t-xl border-b-2 transition-all sm:text-xs ${
                  view === v.id
                    ? "border-indigo-500 text-indigo-600 bg-indigo-50/60"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={13} />
                <span className="sm:hidden">{v.shortLabel}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Terbaik view ──────────────────────────────────────────────── */}
      {view === "terbaik" && (
        <div>
          {/* Podium top 3 */}
          <div className="px-4 pt-5 pb-2 flex items-end gap-2 justify-center">
            {topBaik[1] && <PodiumBlock desa={topBaik[1]} rank={2} />}
            {topBaik[0] && <PodiumBlock desa={topBaik[0]} rank={1} />}
            {topBaik[2] && <PodiumBlock desa={topBaik[2]} rank={3} />}
          </div>
          {topBaik.slice(3).length > 0 && (
            <div className="mt-1 border-t border-slate-50">
              {topBaik.slice(3).map((desa, index) => (
                <RankRow key={desa.id} desa={desa} rank={index + 4} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Provinsi view ─────────────────────────────────────────────── */}
      {view === "provinsi" && (
        <div className="px-5 py-4 space-y-0.5 divide-y divide-slate-50">
          {provinsiRanking.map((row, i) => (
            <ProvinsiRow key={row.provinsi} row={row} rank={i + 1} />
          ))}
        </div>
      )}

      {/* ── Ditinjau view ──────────────────────────────────────────────── */}
      {view === "ditinjau" && (
        <div>
          <div className="px-4 py-3 bg-amber-50/60 border-b border-amber-100 flex items-center gap-2">
            <Search size={14} className="text-amber-600 flex-shrink-0" />
            <DataStatusBadge status="needs-review" />
            <p className="text-xs text-amber-800 font-semibold">Datanya masih minim. Bantu lengkapi dari sumber resminya.</p>
          </div>
          {topRendah.map((d, i) => <RankRow key={d.id} desa={d} rank={i + 1} warning />)}
        </div>
      )}

      {/* Footer CTA */}
      <div className="border-t border-slate-50 px-5 py-3">
        <Link href="/desa" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          {totalDesa > 0 ? `Lihat semua ${totalDesa} desa` : "Lihat semua desa"} <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
