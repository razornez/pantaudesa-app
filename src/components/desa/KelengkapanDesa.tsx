"use client";

import { useState } from "react";
import {
  Building2, Car, Wrench, Globe2, Landmark, MapPin,
  ShieldCheck, Heart, BookOpen, Dumbbell, Store,
  Stethoscope, GraduationCap, Leaf, ChevronDown, ChevronUp,
  TrendingUp, CheckCircle2, XCircle, Coins, BarChart3, Users,
} from "lucide-react";
import { ProfilDesa, AsetDesa, FasilitasDesa, LembagaDesa } from "@/lib/types";
import { formatRupiah, formatRupiahFull } from "@/lib/utils";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

type Tab = "perangkat" | "aset" | "fasilitas" | "lembaga" | "bumdes";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "perangkat", label: "Perangkat", emoji: "🏛️" },
  { id: "aset",      label: "Aset",      emoji: "🏗️" },
  { id: "fasilitas", label: "Fasilitas", emoji: "🏫" },
  { id: "lembaga",   label: "Lembaga",   emoji: "🤝" },
  { id: "bumdes",    label: "BUMDes",    emoji: "🏪" },
];

// ─── Aset ─────────────────────────────────────────────────────────────────────

const ASET_ICON: Record<AsetDesa["jenis"], React.ElementType> = {
  tanah: MapPin, bangunan: Building2, kendaraan: Car,
  peralatan: Wrench, infrastruktur: Globe2, lainnya: Landmark,
};
const ASET_GRAD: Record<AsetDesa["jenis"], string> = {
  tanah:         "from-emerald-400 to-emerald-600",
  bangunan:      "from-indigo-400 to-indigo-600",
  kendaraan:     "from-sky-400 to-sky-600",
  peralatan:     "from-violet-400 to-violet-600",
  infrastruktur: "from-orange-400 to-orange-600",
  lainnya:       "from-slate-400 to-slate-600",
};
const KONDISI_DOT: Record<string, string> = {
  baik: "bg-emerald-400", sedang: "bg-amber-400", rusak: "bg-rose-500",
};

function AsetTab({ aset }: { aset: AsetDesa[] }) {
  const total   = aset.reduce((s, a) => s + a.nilai, 0);
  const byJenis = aset.reduce<Record<string, AsetDesa[]>>((a, item) => {
    (a[item.jenis] ??= []).push(item); return a;
  }, {});

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Hero number */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">Total Nilai Aset Desa</p>
          <p className="text-2xl font-black text-slate-900">{formatRupiahFull(total)}</p>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <p className="text-lg font-black text-emerald-600">{aset.filter(a=>a.kondisi==="baik").length}</p>
            <p className="text-[10px] text-slate-400">baik</p>
          </div>
          <div>
            <p className="text-lg font-black text-amber-500">{aset.filter(a=>a.kondisi==="sedang").length}</p>
            <p className="text-[10px] text-slate-400">sedang</p>
          </div>
          <div>
            <p className="text-lg font-black text-rose-500">{aset.filter(a=>a.kondisi==="rusak").length}</p>
            <p className="text-[10px] text-slate-400">rusak</p>
          </div>
        </div>
      </div>

      {/* Visual icon cards per jenis */}
      {(Object.entries(byJenis) as [AsetDesa["jenis"], AsetDesa[]][]).map(([jenis, items]) => {
        const Icon     = ASET_ICON[jenis];
        const grad     = ASET_GRAD[jenis];
        const jenisVal = items.reduce((s, a) => s + a.nilai, 0);
        const label    = { tanah:"Tanah", bangunan:"Bangunan", kendaraan:"Kendaraan", peralatan:"Peralatan", infrastruktur:"Infrastruktur", lainnya:"Lainnya" }[jenis];
        const key      = jenis;

        return (
          <div key={jenis}>
            {/* Jenis header */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center`}>
                <Icon size={12} className="text-white" />
              </div>
              <p className="text-xs font-bold text-slate-600">{label}</p>
              <span className="text-xs text-slate-400 ml-auto">{formatRupiah(jenisVal)}</span>
            </div>
            {/* Item cards — horizontal scroll on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((a, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHovered(`${key}-${i}`)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group relative rounded-xl border transition-all cursor-default ${
                    hovered === `${key}-${i}` ? "border-slate-200 shadow-md bg-white" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{a.nama}</p>
                      <p className="text-[10px] text-slate-400">{a.lokasi} · {a.tahunBeli}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-slate-700">{formatRupiah(a.nilai)}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${KONDISI_DOT[a.kondisi]}`} />
                        <span className="text-[10px] text-slate-400 capitalize">{a.kondisi}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Fasilitas ────────────────────────────────────────────────────────────────

const FASILITAS_ICON: Record<FasilitasDesa["jenis"], React.ElementType> = {
  pendidikan: GraduationCap, kesehatan: Stethoscope, olahraga: Dumbbell,
  ibadah: BookOpen, umum: Building2, ekonomi: Store,
};
const FASILITAS_GRAD: Record<FasilitasDesa["jenis"], string> = {
  pendidikan: "from-sky-400 to-sky-600",
  kesehatan:  "from-rose-400 to-rose-600",
  olahraga:   "from-emerald-400 to-emerald-600",
  ibadah:     "from-violet-400 to-violet-600",
  umum:       "from-slate-400 to-slate-500",
  ekonomi:    "from-amber-400 to-amber-600",
};
const FASILITAS_BG: Record<FasilitasDesa["jenis"], string> = {
  pendidikan: "bg-sky-50 border-sky-100",
  kesehatan:  "bg-rose-50 border-rose-100",
  olahraga:   "bg-emerald-50 border-emerald-100",
  ibadah:     "bg-violet-50 border-violet-100",
  umum:       "bg-slate-50 border-slate-100",
  ekonomi:    "bg-amber-50 border-amber-100",
};
const FASILITAS_TEXT: Record<FasilitasDesa["jenis"], string> = {
  pendidikan: "text-sky-700", kesehatan: "text-rose-700", olahraga: "text-emerald-700",
  ibadah: "text-violet-700", umum: "text-slate-600", ekonomi: "text-amber-700",
};

function FasilitasTab({ fasilitas }: { fasilitas: FasilitasDesa[] }) {
  const totalUnit = fasilitas.reduce((s, f) => s + f.jumlah, 0);
  const pctBaik   = Math.round(fasilitas.filter(f=>f.kondisi==="baik").length / fasilitas.length * 100);

  return (
    <div className="space-y-4">
      {/* Sparkline stats */}
      <div className="flex gap-3">
        {[
          { val: fasilitas.length, label: "Jenis",  bg: "bg-slate-100", text: "text-slate-700" },
          { val: totalUnit,        label: "Unit",    bg: "bg-indigo-100", text: "text-indigo-700" },
          { val: pctBaik + "%",   label: "Kondisi baik", bg: "bg-emerald-100", text: "text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`flex-1 rounded-2xl ${s.bg} p-3 text-center`}>
            <p className={`text-xl font-black ${s.text}`}>{s.val}</p>
            <p className={`text-[10px] font-medium ${s.text} opacity-70`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bento-style cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fasilitas.map((f, i) => {
          const Icon  = FASILITAS_ICON[f.jenis];
          const grad  = FASILITAS_GRAD[f.jenis];
          const bg    = FASILITAS_BG[f.jenis];
          const text  = FASILITAS_TEXT[f.jenis];
          return (
            <div key={i} className={`rounded-2xl border p-3.5 flex flex-col gap-2 ${bg}`}>
              {/* Icon + count */}
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                  <Icon size={17} className="text-white" />
                </div>
                <span className={`text-2xl font-black ${text}`}>{f.jumlah}</span>
              </div>
              <div>
                <p className={`text-xs font-bold ${text} leading-tight`}>{f.nama}</p>
                {f.ket && <p className={`text-[10px] mt-0.5 opacity-70 ${text}`}>{f.ket}</p>}
              </div>
              {/* Kondisi dot */}
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${KONDISI_DOT[f.kondisi]}`} />
                <span className={`text-[9px] font-semibold opacity-60 ${text} capitalize`}>{f.kondisi}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lembaga ──────────────────────────────────────────────────────────────────

const LEMBAGA_ICON: Record<LembagaDesa["jenis"], React.ElementType> = {
  pemerintahan: Landmark, keamanan: ShieldCheck, pemberdayaan: Users,
  keagamaan: BookOpen, ekonomi: Coins, kesehatan: Heart, pendidikan: GraduationCap,
};
const LEMBAGA_GRAD: Record<LembagaDesa["jenis"], string> = {
  pemerintahan: "from-indigo-500 to-indigo-700",
  keamanan:     "from-slate-500 to-slate-700",
  pemberdayaan: "from-rose-400 to-rose-600",
  keagamaan:    "from-violet-400 to-violet-600",
  ekonomi:      "from-amber-400 to-amber-600",
  kesehatan:    "from-pink-400 to-pink-600",
  pendidikan:   "from-sky-400 to-sky-600",
};
const LEMBAGA_BG: Record<LembagaDesa["jenis"], string> = {
  pemerintahan: "bg-indigo-50 border-indigo-100",
  keamanan:     "bg-slate-50 border-slate-200",
  pemberdayaan: "bg-rose-50 border-rose-100",
  keagamaan:    "bg-violet-50 border-violet-100",
  ekonomi:      "bg-amber-50 border-amber-100",
  kesehatan:    "bg-pink-50 border-pink-100",
  pendidikan:   "bg-sky-50 border-sky-100",
};
const LEMBAGA_TEXT: Record<LembagaDesa["jenis"], string> = {
  pemerintahan: "text-indigo-700", keamanan: "text-slate-600", pemberdayaan: "text-rose-700",
  keagamaan: "text-violet-700", ekonomi: "text-amber-700", kesehatan: "text-pink-700", pendidikan: "text-sky-700",
};

function LembagaTab({ lembaga }: { lembaga: LembagaDesa[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const aktif = lembaga.filter(l => l.aktif).length;

  return (
    <div className="space-y-3">
      {/* Status strip */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-100">
        <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
        <span className="text-xs font-bold text-emerald-700">{aktif} aktif</span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${aktif / lembaga.length * 100}%` }} />
        </div>
        <XCircle size={13} className="text-slate-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-slate-500">{lembaga.length - aktif} tidak aktif</span>
      </div>

      {/* 2-col grid of expandable cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {lembaga.map((l) => {
          const Icon  = LEMBAGA_ICON[l.jenis];
          const grad  = LEMBAGA_GRAD[l.jenis];
          const bg    = LEMBAGA_BG[l.jenis];
          const text  = LEMBAGA_TEXT[l.jenis];
          const open  = expanded === l.nama;

          return (
            <div key={l.nama} className={`rounded-2xl border overflow-hidden transition-all ${bg} ${open ? "shadow-sm" : ""}`}>
              <button
                onClick={() => setExpanded(open ? null : l.nama)}
                className="w-full p-3.5 text-left hover:brightness-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon size={17} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Short name */}
                    <p className={`text-xs font-black ${text} leading-tight truncate`}>
                      {l.nama.replace(/\(.*\)/, "").trim()}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold ${l.aktif ? "text-emerald-600" : "text-slate-400"}`}>
                        {l.aktif ? "● Aktif" : "○ Tidak Aktif"}
                      </span>
                      <span className={`text-[9px] opacity-60 ${text}`}>{l.anggota} anggota</span>
                    </div>
                  </div>
                  {open ? <ChevronUp size={13} className={`flex-shrink-0 ${text} opacity-40`} /> : <ChevronDown size={13} className={`flex-shrink-0 ${text} opacity-40`} />}
                </div>
              </button>

              {open && (
                <div className="border-t border-current/10 bg-white/70 px-3.5 py-3 space-y-2">
                  {/* Full name in parentheses if abbreviated */}
                  {l.nama.includes("(") && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider opacity-50 ${text}`}>
                      {l.nama.match(/\((.*)\)/)?.[1]}
                    </p>
                  )}
                  <p className={`text-xs leading-relaxed ${text} opacity-80`}>{l.deskripsi}</p>
                  {l.program && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <Leaf size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600"><span className="font-semibold">Program:</span> {l.program}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">Berdiri {l.tahunBerdiri} · Ketua: <span className="font-semibold text-slate-600">{l.ketua}</span></p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BUMDes ───────────────────────────────────────────────────────────────────

function BumdesTab({ bumdes }: { bumdes: NonNullable<ProfilDesa["bumdes"]> }) {
  const ratio = bumdes.omsetPerTahun ? bumdes.omsetPerTahun / bumdes.modal : null;

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className={`rounded-2xl p-4 border ${bumdes.status === "aktif" ? "bg-emerald-50 border-emerald-200" : bumdes.status === "dalam_pembentukan" ? "bg-amber-50 border-amber-200" : "bg-slate-100 border-slate-200"}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1.5 ${bumdes.status === "aktif" ? "bg-emerald-100 text-emerald-700" : bumdes.status === "dalam_pembentukan" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"}`}>
              {bumdes.status === "aktif" ? "✅ Aktif" : bumdes.status === "dalam_pembentukan" ? "🔄 Pembentukan" : "⛔ Tidak Aktif"}
            </span>
            <p className="text-base font-black text-slate-900">{bumdes.nama}</p>
            <p className="text-xs text-slate-500">{bumdes.bidangUsaha}</p>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-2xl font-black text-slate-700">{bumdes.tahunBerdiri}</p>
            <p className="text-[9px] text-slate-400 font-medium">Berdiri</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{bumdes.deskripsi}</p>
      </div>

      {/* Finansial cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-2 shadow-sm">
            <Coins size={15} className="text-white" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Modal Awal</p>
          <p className="text-sm font-black text-indigo-700">{formatRupiahFull(bumdes.modal)}</p>
        </div>
        {bumdes.omsetPerTahun && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-2 shadow-sm">
              <TrendingUp size={15} className="text-white" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">Omset/Tahun</p>
            <p className="text-sm font-black text-emerald-700">{formatRupiahFull(bumdes.omsetPerTahun)}</p>
          </div>
        )}
      </div>

      {/* ROI visual */}
      {ratio && (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><BarChart3 size={12} className="text-indigo-500" /> Perbandingan Modal vs Omset</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ratio >= 1 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {ratio >= 1 ? `📈 ${ratio.toFixed(1)}× modal` : "📉 Di bawah modal"}
            </span>
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5"><span>Modal</span><span>{formatRupiah(bumdes.modal)}</span></div>
              <div className="h-2 bg-indigo-100 rounded-full"><div className="h-full bg-indigo-500 rounded-full w-full" /></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5"><span>Omset</span><span>{formatRupiah(bumdes.omsetPerTahun!)}</span></div>
              <div className="h-2 bg-emerald-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ratio * 70)}%` }} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function KelengkapanDesa({ profil }: { profil: ProfilDesa }) {
  const [tab, setTab] = useState<Tab>(() => {
    if (profil.aset.length > 0) return "aset";
    if (profil.fasilitas.length > 0) return "fasilitas";
    if (profil.lembaga.length > 0) return "lembaga";
    if (profil.bumdes) return "bumdes";
    return "aset";
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-hair shadow-lux-1">
      {/* Header — clean, monochrome */}
      <div className="flex flex-col gap-3 border-b border-[color:var(--hair)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Kelengkapan Desa</p>
          <h2 className="text-[15px] font-semibold leading-tight text-[color:var(--ink-1)]">
            Aset, Fasilitas &amp; Organisasi Masyarakat
          </h2>
        </div>
        <DataStatusBadge status="demo" size="xs" className="self-start" />
      </div>

      {/* Tabs — ink underline for active */}
      <div className="flex border-b border-[color:var(--hair)]">
        {TABS.filter((t) => t.id !== "perangkat").map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-4 py-3 text-[12px] font-medium transition-colors sm:flex-initial sm:justify-start ${
                isActive
                  ? "text-[color:var(--indigo-950)]"
                  : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]"
              }`}
            >
              <span>{t.label}</span>
              {isActive && (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-[color:var(--indigo-950)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {tab === "aset"      && <AsetTab      aset={profil.aset} />}
        {tab === "fasilitas" && <FasilitasTab  fasilitas={profil.fasilitas} />}
        {tab === "lembaga"   && <LembagaTab    lembaga={profil.lembaga} />}
        {tab === "bumdes"    && (profil.bumdes
          ? <BumdesTab bumdes={profil.bumdes} />
          : <p className="py-8 text-center text-slate-400 text-sm">BUMDes belum terbentuk.</p>
        )}
      </div>
    </div>
  );
}
