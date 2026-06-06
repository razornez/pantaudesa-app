"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 mb-2">
                Terjadi kesalahan
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Sesuatu yang tidak terduga terjadi. Tim kami sudah diberitahu.
                Coba muat ulang halaman.
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mx-auto"
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
