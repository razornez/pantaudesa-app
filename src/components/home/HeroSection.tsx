"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { FILTER, HERO } from "@/lib/copy";

// ─── Data ─────────────────────────────────────────────────────────────────────

const RECEIPT_BARS = [
  { label: "Pembangunan Fisik", persen: 95, color: "bg-emerald-400" },
  { label: "Program Sosial",    persen: 62, color: "bg-amber-400"   },
  { label: "Dana Siaga",        persen: 31, color: "bg-rose-400"    },
];

const TICKER_ITEMS = [
  { nama: "Desa Sukamaju",      persen: 95, status: "baik"   },
  { nama: "Desa Sumber Rejeki", persen: 96, status: "baik"   },
  { nama: "Desa Baru Makmur",   persen: 95, status: "baik"   },
  { nama: "Desa Mekar Sari",    persen: 90, status: "baik"   },
  { nama: "Desa Harapan Jaya",  persen: 80, status: "sedang" },
  { nama: "Desa Karang Indah",  persen: 70, status: "sedang" },
  { nama: "Desa Mataram Baru",  persen: 55, status: "rendah" },
  { nama: "Desa Pura Harapan",  persen: 35, status: "rendah" },
];

const DOT_GLOW: Record<string, string> = {
  baik:   "bg-emerald-400 shadow-[0_0_7px_2px_rgba(52,211,153,0.8)]",
  sedang: "bg-amber-400   shadow-[0_0_7px_2px_rgba(251,191,36,0.8)]",
  rendah: "bg-rose-400    shadow-[0_0_7px_2px_rgba(251,113,133,0.8)]",
};

const PCT_COLOR: Record<string, string> = {
  baik:   "text-emerald-200",
  sedang: "text-amber-200",
  rendah: "text-rose-300",
};

const TICKER_LOOP = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  totalDesa: number;
  tahun: number;
}

export default function HeroSection({ totalDesa, tahun }: Props) {
  const router = useRouter();
  const [ready,        setReady]        = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true),        80);
    const t2 = setTimeout(() => setBarsAnimated(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ⌘K / Ctrl+K → /desa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/desa");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/desa?cari=${encodeURIComponent(query)}` : "/desa");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl">

      {/* ── Layer 1: hero.webp — ilustrasi penuh card ──────────────────────── */}
      <Image
        src={ASSETS.hero}
        alt=""
        fill
        className="object-cover object-center"
        sizes="(max-width: 1280px) 100vw, 1280px"
        priority
        aria-hidden
      />

      {/* ── Layer 2: gradient arah kiri→kanan
          Kiri: indigo pekat (teks terbaca)
          Kanan: memudar — ilustrasi & desa muncul di belakang receipt card ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(105deg,
            rgba(55,48,163,1.00)  0%,
            rgba(67,56,202,0.97) 25%,
            rgba(79,70,229,0.88) 45%,
            rgba(109,40,217,0.55) 65%,
            rgba(124,58,237,0.18) 85%,
            rgba(124,58,237,0.05) 100%
          )`,
        }}
        aria-hidden
      />

      {/* ── Layer 3: grain tipis ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize:   "180px 180px",
          opacity: 0.03,
        }}
        aria-hidden
      />

      {/* ── Layer 4: konten ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-4 p-6 sm:p-10 pb-0 lg:pb-10">

        {/* ── Kiri: headline + CTA ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 lg:max-w-lg">

          {/* Live badge */}
          <div
            className={`animate-fade-up delay-100 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5 border border-white/20 bg-white/10 text-indigo-100 backdrop-blur-sm ${ready ? "" : "opacity-0"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_6px_rgba(110,231,183,0.9)]" />
            {HERO.badge(tahun, totalDesa)}
          </div>

          {/* Headline dengan brush highlight */}
          <h1
            className={`animate-fade-up delay-100 text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.12] tracking-tight drop-shadow-lg ${ready ? "" : "opacity-0"}`}
          >
            Uang{" "}
            <span className="relative inline-block brush-highlight">
              <span className="relative z-10">desamu</span>
            </span>
            <br className="hidden sm:block" />
            {" "}sudah dipakai<br className="hidden sm:block" />
            {" "}untuk apa?
          </h1>

          {/* Subtitle */}
          <p
            className={`animate-fade-up delay-200 text-indigo-100 text-sm sm:text-base max-w-md mb-7 leading-relaxed drop-shadow ${ready ? "" : "opacity-0"}`}
          >
            {HERO.subtitle}
          </p>

          {/* CTA */}
          <div
            className={`animate-fade-up delay-300 space-y-3 ${ready ? "" : "opacity-0"}`}
          >
            <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="home-desa-search" className="sr-only">
                Cari desa, kecamatan, atau kabupaten
              </label>
              <div className="relative min-w-0 flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200" aria-hidden />
                <input
                  id="home-desa-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={FILTER.searchPlaceholder}
                  className="w-full rounded-xl border border-white/25 bg-white/95 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-xl shadow-indigo-900/35 outline-none transition focus:border-white focus:ring-2 focus:ring-white/60"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-xl shadow-indigo-900/40 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
              >
                {HERO.ctaSearch}
              </button>
            </form>
          </div>

          <p
            className={`animate-fade-up delay-300 mt-4 max-w-lg text-xs leading-relaxed text-indigo-100/85 ${ready ? "" : "opacity-0"}`}
          >
            Mengawasi desa bukan berarti memusuhi desa. Justru karena desa adalah titik paling dekat
            antara anggaran negara dan kehidupan warga, di situlah transparansi harus paling terasa.
          </p>
        </div>

        {/* ── Kanan: Receipt card (mengambang di atas area ilustrasi) ────────── */}
        <div
          className={`hidden lg:block flex-shrink-0 transition-all duration-700 delay-300 ${ready ? "opacity-100" : "opacity-0 translate-y-4"}`}
          style={{ transform: ready ? "rotate(4deg)" : "rotate(4deg) translateY(16px)" }}
        >
          <div className="relative w-60">

            {/* Washi tape */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20" style={{ transform: "rotate(-2deg)" }}>
              <div className="w-24 h-7 rounded-sm bg-amber-300/90 shadow-md flex items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-px bg-amber-500/40" />
              </div>
            </div>

            {/* Receipt body */}
            <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl pt-7 px-5 pb-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="receipt-perf mb-4 -mx-5" />

              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-0.5">Dana Desa {tahun}</p>
              <p className="text-sm font-bold text-slate-800 mb-0.5">Desa Sukamaju</p>
              <p className="text-[10px] text-slate-400 mb-4 font-mono">Ciawi · Bogor · Jawa Barat</p>

              <div className="space-y-3.5">
                {RECEIPT_BARS.map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500">{bar.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-700">{bar.persen}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bar.color} transition-all duration-[1100ms] ease-out`}
                        style={{
                          width: barsAnimated ? `${bar.persen}%` : "0%",
                          transitionDelay: `${i * 180}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Serapan Total</span>
                <span className="text-emerald-600 font-mono font-black text-sm">95%</span>
              </div>
            </div>

            {/* Receipt tail */}
            <div className="bg-white/95 backdrop-blur-sm px-5 pb-3 rounded-b-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="receipt-perf mb-2 -mx-5" />
              <p className="text-center text-[8px] text-slate-300 font-mono tracking-widest">
                pantaudesa · {tahun}
              </p>
            </div>

            <div className="absolute -bottom-3 left-6 right-6 h-6 bg-indigo-900/30 blur-xl rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Live Ticker ────────────────────────────────────────────────────── */}
      <div
        className={`relative z-10 mt-6 lg:mt-2 border-t border-white/10 transition-opacity duration-700 delay-500 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <div className="overflow-hidden py-3">
          <div className="flex animate-ticker">
            {TICKER_LOOP.map((item, i) => (
              <div key={i} className="inline-flex items-center gap-2 mx-5 whitespace-nowrap flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_GLOW[item.status]}`} />
                <span className="text-xs text-indigo-200/80 font-medium">{item.nama}</span>
                <span className={`text-xs font-mono font-bold ${PCT_COLOR[item.status]}`}>{item.persen}%</span>
                <span className="text-indigo-300/40 text-xs mx-1">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
