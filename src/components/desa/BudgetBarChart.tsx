"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Desa } from "@/lib/types";

interface Props {
  desa: Desa;
  isDark?: boolean;
}

const fmt = (v: number) =>
  v >= 1_000_000_000 ? `Rp ${(v / 1_000_000_000).toFixed(1)} M` : `Rp ${(v / 1_000_000).toFixed(0)} Jt`;

const LIGHT = {
  card:        "bg-white rounded-2xl p-5 border border-slate-100 shadow-sm",
  heading:     "text-slate-800",
  sub:         "text-slate-500",
  grid:        "#F1F5F9",
  tick:        "#94A3B8",
  tooltipStyle: { borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 },
};

const DARK = {
  card:        "bg-slate-800/70 rounded-2xl p-5 border border-white/[0.08] shadow-lg",
  heading:     "text-white",
  sub:         "text-slate-400",
  grid:        "#1e293b",
  tick:        "#64748B",
  tooltipStyle: { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, background: "#0f172a", color: "#f1f5f9" },
};

export default function BudgetBarChart({ desa, isDark = false }: Props) {
  const t = isDark ? DARK : LIGHT;

  const data = [
    { name: "Anggaran",  anggaran: desa.totalAnggaran,                realisasi: 0,              selisih: 0 },
    { name: "Realisasi", anggaran: 0,                                 realisasi: desa.terealisasi, selisih: 0 },
    { name: "Selisih",   anggaran: 0,                                 realisasi: 0,              selisih: desa.totalAnggaran - desa.terealisasi },
  ];

  return (
    <div className={t.card}>
      <h2 className={`text-base font-semibold mb-1 ${t.heading}`}>Perbandingan Anggaran & Realisasi</h2>
      <p className={`text-xs mb-4 ${t.sub}`}>Tahun Anggaran {desa.tahun}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `${(v / 1_000_000_000).toFixed(1)}M`}
            tick={{ fontSize: 10, fill: t.tick }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), name === "anggaran" ? "Anggaran" : name === "realisasi" ? "Realisasi" : "Selisih"]}
            contentStyle={t.tooltipStyle}
          />
          <Bar dataKey="anggaran"  fill="#818CF8" radius={[6, 6, 0, 0]} maxBarSize={60} />
          <Bar dataKey="realisasi" fill="#34D399" radius={[6, 6, 0, 0]} maxBarSize={60} />
          <Bar dataKey="selisih"   fill="#FB7185" radius={[6, 6, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
