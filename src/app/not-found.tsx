import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">

      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto">
          <span className="text-6xl select-none">🗺️</span>
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center border-2 border-white shadow-sm">
          <span className="text-lg font-black text-rose-500">?</span>
        </div>
      </div>

      {/* Copy */}
      <div className="max-w-sm space-y-2 mb-8">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">404 — Tidak Ditemukan</p>
        <h1 className="text-3xl font-black text-slate-900 leading-tight">
          Halaman tidak ditemukan.
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Mungkin alamatnya salah atau halaman sudah dipindahkan. Kamu masih bisa menelusuri desa dari halaman utama.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-indigo-200"
        >
          <Home size={15} /> Beranda
        </Link>
        <Link
          href="/desa"
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Search size={15} /> Cari Desa
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Butuh bantuan?{" "}
        <Link href="/panduan" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5">
          Baca panduan <ArrowRight size={11} />
        </Link>
      </p>
    </div>
  );
}
