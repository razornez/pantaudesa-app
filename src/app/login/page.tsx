"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, RotateCw, AlertTriangle, ShieldAlert, Users, Building2 } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { AUTH_COPY } from "@/lib/copy";
import PinInput from "@/components/ui/PinInput";
import { useCountdown } from "@/lib/use-countdown";

type Step = "email" | "pin";
type Mode = "warga" | "desa";

// ─── Mode selector ─────────────────────────────────────────────────────────────

function ModeSelector({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
      {([
        { id: "warga", label: "Saya Warga",          icon: Users     },
        { id: "desa",  label: "Portal Desa / Admin",  icon: Building2 },
      ] as { id: Mode; label: string; icon: React.ElementType }[]).map(m => {
        const Icon = m.icon;
        return (
          <button key={m.id} type="button" onClick={() => onChange(m.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === m.id
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={13} /> {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main inner ────────────────────────────────────────────────────────────────

function LoginInner() {
  const router     = useRouter();
  const params     = useSearchParams();

  const nextUrl = params.get("next") ?? "/";

  const [mode,    setMode]    = useState<Mode>("warga");
  const [step,    setStep]    = useState<Step>("email");
  const [email,   setEmail]   = useState(params.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [frozenUntil, setFrozenUntil] = useState<Date | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [pinReset, setPinReset] = useState(0);
  const [resendAt, setResendAt] = useState<Date | null>(null);

  const frozenSecs = useCountdown(frozenUntil);
  const resendSecs = useCountdown(resendAt);
  const isFrozen = frozenUntil !== null && frozenSecs > 0;
  const visibleErr = !isFrozen && frozenUntil !== null && frozenSecs === 0 ? "" : err;

  const handleModeChange = (m: Mode) => { setMode(m); setErr(""); };

  // ── Step 1: check email ─────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErr("");
    const trimmed = email.toLowerCase().trim();
    if (!trimmed) { setErr("Email tidak boleh kosong."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setErr("Format email tidak valid."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!data.exists) {
        // Redirect to register with email pre-filled
        router.push(`/daftar?email=${encodeURIComponent(trimmed)}`);
        return;
      }
      if (data.unverified) {
        setErr("Email belum diverifikasi. Cek inbox kamu dan klik link verifikasi, atau daftar ulang.");
        return;
      }
      setStep("pin");
    } catch (ex) {
      Sentry.captureException(ex);
      setErr("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify PIN ──────────────────────────────────────────────────
  const handlePinComplete = async (pin: string) => {
    if (isFrozen) return;
    setErr("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.toLowerCase().trim(), pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPinReset(n => n + 1);
        if (data.frozen) {
          setFrozenUntil(new Date(data.frozenUntil));
          setErr(data.error);
        } else {
          setAttemptsLeft(data.attemptsLeft ?? null);
          setErr(data.error ?? "PIN salah.");
        }
        return;
      }

      // PIN verified server-side — create NextAuth JWT session via "pin" provider
      if (!data.loginToken) {
        Sentry.captureMessage("PIN login succeeded without loginToken", "error");
        setErr("PIN berhasil diverifikasi, tetapi sesi belum bisa dibuat. Coba lagi.");
        setPinReset(n => n + 1);
        return;
      }

      const signInRes = await signIn("pin", {
        email: email.toLowerCase().trim(),
        loginToken: data.loginToken,
        redirect: false,
      });

      if (signInRes?.error) {
        Sentry.captureMessage(`signIn after pin error: ${signInRes.error}`, "warning");
        setErr("PIN benar, tetapi sesi login gagal dibuat. Coba lagi.");
        return;
      }

      router.push(nextUrl);
      router.refresh();
    } catch (ex) {
      Sentry.captureException(ex);
      setErr("Koneksi bermasalah. Coba lagi.");
      setPinReset(n => n + 1);
    } finally {
      setLoading(false);
    }
  };

  // ── Send PIN to email ───────────────────────────────────────────────────
  const handleSendPinEmail = async () => {
    if (resendSecs > 0) return;
    setErr("");
    const res  = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.toLowerCase().trim(), resendOtp: true }),
    });
    const data = await res.json();
    setResendAt(new Date(data.canResendAt));
    setErr("Kode sementara dikirim ke emailmu. Masukkan kode tersebut sebagai PIN.");
  };

  const frozenMins = frozenSecs > 0 ? Math.ceil(frozenSecs / 60) : 0;

  return (
    <div className="min-h-screen flex">

      {/* Sisi kiri */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 overflow-hidden p-10">
        <div className="absolute inset-0 opacity-10">
          <Image src={ASSETS.textureLight} alt="" fill className="object-cover" />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm">
              <Image src={ASSETS.logo} alt="PantauDesa" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-white">Pantau<span className="text-indigo-200">Desa</span></span>
          </Link>
          <div className="flex-1 flex flex-col justify-center max-w-sm space-y-5">
            <div>
              <div className="text-3xl mb-3">🏘️</div>
              <h1 className="text-3xl font-black text-white leading-tight mb-3">{AUTH_COPY.login.sideTitle}</h1>
              <p className="text-indigo-200 text-sm leading-relaxed">
                {AUTH_COPY.login.sideBody}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-2">Akun membantumu</p>
              {[
                { e: "📌", t: "Menyimpan desa pantauan" },
                { e: "🔔", t: "Mengikuti perubahan data" },
                { e: "📋", t: "Mengelola kontribusi warga" },
                { e: "🏅", t: "Membangun reputasi kontribusi" },
              ].map(f => (
                <div key={f.t} className="flex items-center gap-2.5">
                  <span className="text-base">{f.e}</span>
                  <span className="text-xs text-indigo-100">{f.t}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-indigo-300 text-xs">
            {AUTH_COPY.login.registerPrompt}{" "}
            <Link href="/daftar" className="text-white font-semibold hover:underline">{AUTH_COPY.login.registerCta}</Link>
          </p>
        </div>
      </div>

      {/* Sisi kanan */}
      <div className="flex-1 lg:max-w-md flex flex-col justify-center px-6 sm:px-10 py-12 bg-white">

        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src={ASSETS.logo} alt="PantauDesa" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-slate-800">Pantau<span className="text-indigo-600">Desa</span></span>
          </Link>
        </div>

        {/* ── Step 1: Email ─────────────────────────────────────────────── */}
        {step === "email" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{AUTH_COPY.login.title}</h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{AUTH_COPY.login.subtitle}</p>
            </div>

            <ModeSelector mode={mode} onChange={handleModeChange} />

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">{AUTH_COPY.whyAccountTitle}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{AUTH_COPY.whyAccountBody}</p>
              <Link href="/desa" className="mt-2 inline-flex text-xs font-bold text-indigo-700 hover:text-indigo-900">
                {AUTH_COPY.seePublicData}
              </Link>
            </div>

            {visibleErr && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{visibleErr}</p>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  {mode === "warga" ? "Email kamu" : "Email resmi desa / admin"}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); setFrozenUntil(null); }}
                    placeholder={mode === "warga" ? "email@kamu.com" : "email@desa.id"}
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition ${visibleErr ? "border-rose-300 bg-rose-50" : "border-slate-200"}`} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50">
                {loading ? <><RotateCw size={16} className="animate-spin" /> Memeriksa...</> : <><span>{AUTH_COPY.login.primaryCta}</span><ArrowRight size={15} /></>}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              {AUTH_COPY.login.registerPrompt}{" "}
              <Link href="/daftar" className="text-indigo-600 font-semibold hover:underline">{AUTH_COPY.login.registerCta}</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: PIN ───────────────────────────────────────────────── */}
        {step === "pin" && (
          <div className="space-y-6">
            <button onClick={() => { setStep("email"); setErr(""); setFrozenUntil(null); }} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              ← Ganti email
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Masukkan PIN</h2>
              <p className="text-sm text-slate-500 mt-1">
                Masuk sebagai <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>

            {isFrozen ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2">
                <ShieldAlert size={28} className="text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-rose-800">Akun dibekukan sementara</p>
                <p className="text-xs text-rose-600 leading-relaxed">{err}</p>
                {frozenSecs > 0 && (
                  <p className="text-sm font-black text-rose-700">
                    {frozenMins > 1 ? `${frozenMins} menit` : `${frozenSecs} detik`} lagi
                  </p>
                )}
              </div>
            ) : (
              <>
                <PinInput onComplete={handlePinComplete} disabled={loading} error={!!visibleErr} reset={pinReset} />

                {visibleErr && (
                  <div className="text-center">
                    <p className="text-sm text-rose-600">⚠ {err}</p>
                    {attemptsLeft !== null && (
                      <p className={`text-xs mt-1 ${attemptsLeft <= 2 ? "text-rose-500 font-semibold" : "text-rose-400"}`}>
                        Sisa {attemptsLeft} percobaan sebelum akun dibekukan.
                      </p>
                    )}
                  </div>
                )}

                {loading && <div className="flex justify-center"><RotateCw size={18} className="text-indigo-500 animate-spin" /></div>}
              </>
            )}

            {/* Lupa PIN / kirim PIN via email */}
            <div className="text-center space-y-2 pt-2 border-t border-slate-100">
              <Link href={`/lupa-pin?email=${encodeURIComponent(email)}`} className="block text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Lupa PIN?
              </Link>
              {!isFrozen && (
                resendSecs > 0 ? (
                  <p className="text-xs text-slate-400">Kirim PIN via email lagi dalam {resendSecs}s</p>
                ) : (
                  <button onClick={handleSendPinEmail} className="text-xs text-slate-500 hover:text-slate-700">
                    Kirim kode sementara ke email
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" /></div>}>
      <LoginInner />
    </Suspense>
  );
}
