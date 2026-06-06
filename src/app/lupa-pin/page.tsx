"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, RotateCw, AlertTriangle, Eye, EyeOff } from "lucide-react";
import OtpInput from "@/components/ui/OtpInput";
import { useCountdown } from "@/lib/use-countdown";

type Step = "email" | "otp" | "newpin" | "done";

function LupaPinInner() {
  const router     = useRouter();
  const params     = useSearchParams();

  const [step,    setStep]    = useState<Step>("email");
  const [email,   setEmail]   = useState(params.get("email") ?? "");
  const [pin,     setPin]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [otp,     setOtp]     = useState("");
  const [otpReset, setOtpReset] = useState(0);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resendAt, setResendAt] = useState<Date | null>(null);
  const resendSecs = useCountdown(resendAt);

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErr("");
    const trimmed = email.toLowerCase().trim();
    if (!trimmed) { setErr("Email tidak boleh kosong."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-pin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Terjadi kesalahan."); return; }
      setResendAt(new Date(data.canResendAt));
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleOtpComplete = (code: string) => {
    setOtp(code);
    setStep("newpin");
  };

  const handleResend = async () => {
    if (resendSecs > 0) return;
    const res  = await fetch("/api/auth/resend-otp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.toLowerCase().trim(), purpose: "RESET_PIN" }),
    });
    const data = await res.json();
    setResendAt(new Date(data.canResendAt));
  };

  // ── Set new PIN ───────────────────────────────────────────────────────────
  const handleNewPin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^\d{6}$/.test(pin))    { setErr("PIN harus 6 digit angka."); return; }
    if (pin !== confirm)          { setErr("Konfirmasi PIN tidak cocok."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-pin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.toLowerCase().trim(), otp, pin, confirmPin: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field === "otp") { setErr(data.error); setStep("otp"); setOtpReset(n => n + 1); }
        else setErr(data.error ?? "Terjadi kesalahan.");
        return;
      }
      setStep("done");
      setTimeout(() => router.push(`/login?email=${encodeURIComponent(email)}`), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">

        <div>
          <h1 className="text-xl font-black text-slate-900">Reset PIN</h1>
          <p className="text-sm text-slate-500 mt-1">
            {step === "email"  && "Masukkan email terdaftar kamu."}
            {step === "otp"    && `Kode 6 digit dikirim ke ${email}.`}
            {step === "newpin" && "Buat PIN baru untuk akunmu."}
            {step === "done"   && "PIN berhasil diperbarui!"}
          </p>
        </div>

        {err && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{err}</p>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }}
                placeholder="email@kamu.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50">
              {loading ? <RotateCw size={14} className="animate-spin" /> : <><span>Kirim Kode OTP</span><ArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <OtpInput onComplete={handleOtpComplete} disabled={loading} error={!!err} reset={otpReset} />
            <div className="text-center">
              {resendSecs > 0
                ? <p className="text-xs text-slate-400">Kirim ulang dalam {resendSecs}s</p>
                : <button onClick={handleResend} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Kirim ulang kode</button>
              }
            </div>
          </div>
        )}

        {step === "newpin" && (
          <form onSubmit={handleNewPin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">PIN Baru (6 digit)</label>
              <div className="relative">
                <input type={showPin ? "text" : "password"} value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric" maxLength={6} placeholder="••••••"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition tracking-[0.5em]" />
                <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Konfirmasi PIN Baru</label>
              <input type={showPin ? "text" : "password"} value={confirm}
                onChange={e => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric" maxLength={6} placeholder="••••••"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition tracking-[0.5em]" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50">
              {loading ? <RotateCw size={14} className="animate-spin" /> : "Simpan PIN Baru"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-sm text-slate-500">Mengalihkan ke halaman masuk...</p>
            <div className="w-6 h-6 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto" />
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600">← Kembali ke masuk</Link>
        </div>
      </div>
    </div>
  );
}

export default function LupaPinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" /></div>}>
      <LupaPinInner />
    </Suspense>
  );
}
