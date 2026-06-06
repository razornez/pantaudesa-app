"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface State { hasError: boolean; eventId: string | null }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
    this.setState({ eventId: eventId ?? null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Ups, ada yang tidak beres
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu secara otomatis.
              Coba muat ulang halaman atau kembali ke beranda.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { this.setState({ hasError: false, eventId: null }); window.location.reload(); }}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <RefreshCw size={14} /> Muat Ulang
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Home size={14} /> Ke Beranda
            </Link>
          </div>
          {this.state.eventId && (
            <p className="text-[10px] text-slate-300 font-mono">
              ID: {this.state.eventId}
            </p>
          )}
        </div>
      </div>
    );
  }
}
