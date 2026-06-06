"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { RiwayatTahunan } from "@/lib/types";
import { SECTION } from "@/lib/copy";
import { getTrendVerdict } from "@/lib/verdicts";
import { getVerdictColors } from "@/lib/utils";

interface Props {
  riwayat: RiwayatTahunan[];
}

function fmt(v: number): string {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  return `Rp ${(v / 1_000_000).toFixed(0)} Jt`;
}

function yearBg(persen: number): string {
  if (persen >= 85) return "text-emerald-600 bg-emerald-50";
  if (persen >= 60) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

export default function RiwayatChart({ riwayat }: Props) {
  const verdict = getTrendVerdict(riwayat);
  const colors  = getVerdictColors(verdict.tone);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{SECTION.riwayat}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{SECTION.riwayatSub}</p>
        </div>
      </div>

      {/* Verdict dinamis */}
      <div className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2 mb-4 border ${colors.bg} ${colors.border}`}>
        <span className={`font-semibold ${colors.text}`}>{verdict.message}</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={riwayat} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="tahun" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "persentaseSerapan") return [`${value}%`, "Terpakai"];
              if (name === "totalAnggaran")     return [fmt(Number(value)), "Anggaran"];
              return [value, name];
            }}
            contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }}
          />
          <ReferenceLine y={85} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1}
            label={{ value: "Target 85%", fill: "#10B981", fontSize: 10, position: "insideTopRight" }} />
          <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="persentaseSerapan"
            stroke="#6366F1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#6366F1", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-5 gap-1">
        {riwayat.map((r) => (
          <div key={r.tahun} className={`rounded-lg p-1.5 text-center ${yearBg(r.persentaseSerapan)}`}>
            <p className="text-xs font-bold">{r.persentaseSerapan}%</p>
            <p className="text-xs opacity-70">{r.tahun}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
