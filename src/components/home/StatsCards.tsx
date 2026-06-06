import { Gauge, MapPin, Wallet, CheckCircle2, AlertCircle, Search, Database } from "lucide-react";
import { SummaryStats } from "@/lib/types";
import { STATS } from "@/lib/copy";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

interface Props {
  stats: SummaryStats;
}

function coverageColors(pct: number): { text: string; bg: string; ring: string } {
  if (pct >= 75) return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "border-emerald-200" };
  if (pct >= 34) return { text: "text-sky-600",     bg: "bg-sky-50",     ring: "border-sky-200" };
  return           { text: "text-amber-600",  bg: "bg-amber-50",   ring: "border-amber-200" };
}

export default function StatsCards({ stats }: Props) {
  const total = stats.totalDesa || 1;
  const pctLengkap = Math.round((stats.desaLengkap / total) * 100);
  const pctSedang  = Math.round((stats.desaSedang  / total) * 100);
  const pctMinim   = Math.round((stats.desaMinim   / total) * 100);
  const pctDana    = Math.round((stats.desaAdaDanaDesa / total) * 100);

  const cards = [
    {
      label: STATS.totalDanaDesa.label,
      value: stats.totalDanaDesaNasional,
      format: "rupiah" as const,
      sub:   STATS.totalDanaDesa.sub(stats.totalDesa.toLocaleString("id-ID")),
      icon:  Wallet,
      color: "text-indigo-600",
      bg:    "bg-indigo-50",
    },
    {
      label: STATS.totalDesa.label,
      value: stats.totalDesa,
      format: "number" as const,
      sub:   STATS.totalDesa.sub,
      icon:  MapPin,
      color: "text-sky-600",
      bg:    "bg-sky-50",
    },
    {
      label: STATS.rataRataKelengkapan.label,
      value: stats.rataRataKelengkapan,
      format: "percent" as const,
      sub:   STATS.rataRataKelengkapan.sub,
      icon:  Gauge,
      color: "text-emerald-600",
      bg:    "bg-emerald-50",
    },
    {
      label: STATS.desaLengkap.label,
      value: stats.desaLengkap,
      format: "number" as const,
      sub:   STATS.desaLengkap.sub(pctLengkap),
      icon:  CheckCircle2,
      color: "text-emerald-600",
      bg:    "bg-emerald-50",
    },
    {
      label: STATS.desaSedang.label,
      value: stats.desaSedang,
      format: "number" as const,
      sub:   STATS.desaSedang.sub(pctSedang),
      icon:  AlertCircle,
      color: "text-sky-600",
      bg:    "bg-sky-50",
    },
    {
      label: STATS.desaMinim.label,
      value: stats.desaMinim,
      format: "number" as const,
      sub:   STATS.desaMinim.sub(pctMinim),
      icon:  Search,
      color: "text-amber-700",
      bg:    "bg-amber-50",
    },
  ];

  const { text: covText, bg: covBg, ring: covRing } = coverageColors(pctDana);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg"
            >
              <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3 transition-transform duration-200 group-hover:scale-105`}>
                <Icon size={18} className={card.color} />
              </div>
              <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                <AnimatedCounter value={card.value} format={card.format} />
              </p>
              <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Cakupan Dana Desa — real DJPK coverage */}
      <div className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${covBg} ${covRing}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm flex-shrink-0">
            <Database size={20} className={covText} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Cakupan Data Dana Desa</p>
            <p className="text-xs text-slate-500">Desa yang sudah punya nilai pagu Dana Desa resmi (DJPK)</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-3xl font-black ${covText}`}>
            <AnimatedCounter value={pctDana} />
            <span className="text-sm font-normal text-slate-400">%</span>
          </p>
          <p className={`text-xs font-semibold ${covText}`}>
            {stats.desaAdaDanaDesa.toLocaleString("id-ID")} desa
          </p>
        </div>
      </div>
    </div>
  );
}
