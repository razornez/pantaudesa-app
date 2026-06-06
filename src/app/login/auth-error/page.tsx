"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import { Suspense } from "react";

// ─── Error map ────────────────────────────────────────────────────────────────

const ERROR_MAP: Record<string, { title: string; message: string; action: string; canRetry: boolean }> = {
  Configuration: {
    title:    "Masalah konfigurasi server",
    message:  "Ada masalah pada pengaturan server kami. Tim kami sudah diberitahu.",
    action:   "Coba lagi dalam beberapa menit. Jika masalah terus berlanjut, hubungi kami.",
    canRetry: true,
  },
  AccessDenied: {
    title:    "Akses ditolak",
    message:  "Kamu tidak memiliki izin untuk mengakses halaman ini.",
    action:   "Pastikan kamu menggunakan email yang terdaftar, atau daftar akun baru.",
    canRetry: false,
  },
  Verification: {
    title:    "Link sudah tidak berlaku",
    message:  "Link masuk yang kamu klik sudah kedaluwarsa atau sudah pernah digunakan.",
    action:   "Link masuk hanya berlaku 10 menit dan hanya bisa digunakan sekali. Minta link baru di bawah.",
    canRetry: true,
  },
  OAuthSignin: {
    title:    "Gagal memulai login",
    message:  "Terjadi kesalahan saat memproses permintaan login.",
    action:   "Coba lagi. Jika masih gagal, coba bersihkan cache browser kamu.",
    canRetry: true,
  },
  OAuthCallback: {
    title:    "Gagal memproses link masuk",
    message:  "Terjadi kesalahan saat memverifikasi link masuk.",
    action:   "Minta link baru dan klik segera setelah diterima. Jangan buka link di tab lain.",
    canRetry: true,
  },
  Default: {
    title:    "Terjadi kesalahan",
    message:  "Proses login tidak berhasil karena alasan yang tidak diketahui.",
    action:   "Coba lagi, atau hubungi kami jika masalah terus berlanjut.",
    canRetry: true,
  },
};

// ─── Inner component (needs useSearchParams) ──────────────────────────────────

function AuthErrorContent() {
  const params    = useSearchParams();
  const errorCode = params.get("error") ?? "Default";
  const info      = ERROR_MAP[errorCode] ?? ERROR_MAP.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-rose-500" />
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-black text-slate-900">{info.title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">{info.message}</p>
        </div>

        {/* Action hint */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Yang bisa kamu lakukan: </span>
            {info.action}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {info.canRetry && (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md shadow-indigo-200"
            >
              <RefreshCw size={14} /> Minta Link Masuk Baru
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            <Home size={14} /> Kembali ke Beranda
          </Link>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            Masih bermasalah?{" "}
            <a
              href="mailto:support@razornez.net"
              className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Mail size={10} /> Hubungi kami
            </a>
          </p>
          {process.env.NODE_ENV === "development" && errorCode !== "Default" && (
            <p className="text-[10px] text-slate-300 font-mono mt-2">error={errorCode}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page (Suspense required for useSearchParams in Next.js App Router) ───────

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
