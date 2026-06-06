"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  ArrowRight, Check, User, AtSign, Mail,
  Eye, EyeOff, RotateCw, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { AUTH_COPY } from "@/lib/copy";
import OtpInput from "@/components/ui/OtpInput";
import { useCountdown } from "@/lib/use-countdown";

type Step = "form" | "otp" | "done";

interface FormData {
  nama:       string;
  username:   string;
  email:      string;
  pin:        string;
  confirmPin: string;
}
type FieldErrors = Partial<Record<keyof FormData, string>>;

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

// ─── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ["form", "otp", "done"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {["Data Diri", "Verifikasi"].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            i < idx   ? "bg-indigo-600 text-white" :
            i === idx ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400 ring-offset-1" :
                        "bg-slate-100 text-slate-400"
          }`}>
            {i < idx ? <Check size={11} /> : <span>{i + 1}</span>}
            <span>{label}</span>
          </div>
          {i < 1 && <div className={`w-6 h-0.5 rounded-full ${i < idx ? "bg-indigo-400" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Main inner ────────────────────────────────────────────────────────────────

function DaftarInner() {
  const router          = useRouter();
  const params          = useSearchParams();
  const { status }      = useSession();

  const [step,     setStep]     = useState<Step>("form");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<FieldErrors>({});
  const [apiErr,   setApiErr]   = useState("");
  const [otpReset, setOtpReset] = useState(0);
  const [canResendAt, setCanResendAt] = useState<Date | null>(null);
  const resendIn = useCountdown(canResendAt);

  const [showPin,    setShowPin]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<FormData>({
    nama: "", username: "", email: params.get("email") ?? "", pin: "", confirmPin: "",
  });

  // Redirect if already logged in with complete profile
  useEffect(() => {
    if (status === "authenticated") router.replace("/profil/saya");
  }, [status, router]);

  const set = (k: keyof FormData, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
    setApiErr("");
  };

  const checkUsername = (value: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (!/^[a-z0-9_]{3,20}$/.test(value)) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/users/username-check?username=${encodeURIComponent(value)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
        if (!data.available) setErrors(e => ({ ...e, username: "Username sudah dipakai, coba yang lain." }));
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  };

  const handleNamaChange = (v: string) => {
    set("nama", v);
    if (!form.username || form.username === slugify(form.nama)) {
      const slug = slugify(v);
      set("username", slug);
      checkUsername(slug);
    }
  };

  // ── Submit form → validate → send OTP ──────────────────────────────────
  const handleFormSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const errs: FieldErrors = {};
    if (!form.nama.trim())     errs.nama       = "Nama tidak boleh kosong.";
    if (!/^[a-z0-9_]{3,20}$/.test(form.username)) errs.username = "3–20 karakter: huruf kecil, angka, underscore.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Format email tidak valid.";
    if (!/^\d{6}$/.test(form.pin))             errs.pin        = "PIN harus 6 digit angka.";
    if (form.pin !== form.confirmPin)          errs.confirmPin = "PIN tidak cocok.";
    if (usernameStatus === "taken") errs.username = "Username sudah dipakai, coba yang lain.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiErr("");
    try {
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.error });
          if (data.redirect) setApiErr(`${data.error} → `);
        } else {
          setApiErr(data.error ?? "Terjadi kesalahan.");
        }
        return;
      }

      setCanResendAt(new Date(data.canResendAt));
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit OTP ──────────────────────────────────────────────────────────
  const handleOtpComplete = async (code: string) => {
    setLoading(true);
    setApiErr("");
    try {
      // 1. Verify OTP → marks emailVerified in DB
      const res  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, code, purpose: "REGISTER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiErr(data.error ?? "Kode salah. Coba periksa kembali.");
        setOtpReset(n => n + 1);
        return;
      }

      // 2. Auto-login — user sudah terbukti identitasnya lewat OTP
      const result = await signIn("pin", {
        email:    form.email.toLowerCase().trim(),
        pin:      form.pin,
        redirect: false,
      });

      setStep("done");

      if (result?.error) {
        // Login gagal tapi akun sudah terbuat — arahkan ke login manual
        setTimeout(() => router.push("/login?email=" + encodeURIComponent(form.email)), 1500);
      } else {
        setTimeout(() => router.push("/"), 1500);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendIn > 0) return;
    setApiErr("");
    const res  = await fetch("/api/auth/resend-otp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: form.email, purpose: "REGISTER" }),
    });
    const data = await res.json();
    setCanResendAt(new Date(data.canResendAt));
  };

  return (
    <div className="min-h-screen flex">

      {/* Sisi kiri */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 overflow-hidden p-10">
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
              <div className="text-4xl mb-4">🏘️</div>
              <h1 className="text-3xl font-black text-white leading-tight mb-3">{AUTH_COPY.register.sideTitle}</h1>
              <p className="text-indigo-200 text-sm leading-relaxed">
                {AUTH_COPY.register.sideBody}
              </p>
            </div>

            {/* Apa yang bisa kamu lakukan */}
            <div className="space-y-2">
              {[
                { e: "📌", t: AUTH_COPY.register.benefits[0] },
                { e: "🔔", t: AUTH_COPY.register.benefits[1] },
                { e: "📢", t: AUTH_COPY.register.benefits[2] },
                { e: "🏅", t: AUTH_COPY.register.benefits[3] },
              ].map(f => (
                <div key={f.t} className="flex items-center gap-3">
                  <span className="text-lg">{f.e}</span>
                  <span className="text-sm text-indigo-100">{f.t}</span>
                </div>
              ))}
            </div>

            {/* Kewenangan Desa */}
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-3">Apa saja yang jadi tanggung jawab desa?</p>
              <div className="space-y-2 text-xs">
                {[
                  { level: "Desa", color: "bg-emerald-400", items: "Jalan desa, drainase, posyandu, BUMDes, APBDes" },
                  { level: "Camat", color: "bg-sky-400", items: "Koordinasi antar desa, rekomendasi perizinan" },
                  { level: "Bupati/Wali Kota", color: "bg-amber-400", items: "Jalan kabupaten, puskesmas, APBD II" },
                  { level: "Gubernur", color: "bg-rose-400", items: "Jalan provinsi, APBD I, pemprov" },
                ].map(r => (
                  <div key={r.level} className="flex items-start gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full mt-1 flex-shrink-0 ${r.color}`} />
                    <span className="text-indigo-100 leading-relaxed">
                      <span className="font-bold text-white">{r.level}</span> — {r.items}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-indigo-300 mt-2.5">Pantau hal-hal yang memang menjadi tanggung jawab desamu.</p>
            </div>
          </div>
          <p className="text-indigo-300 text-xs">
            {AUTH_COPY.register.loginPrompt}{" "}
            <Link href="/login" className="text-white font-semibold hover:underline">{AUTH_COPY.register.loginCta}</Link>
          </p>
        </div>
      </div>

      {/* Sisi kanan */}
      <div className="flex-1 lg:max-w-md flex flex-col justify-center px-6 sm:px-10 py-10 bg-white">

        <div className="lg:hidden flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src={ASSETS.logo} alt="PantauDesa" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-slate-800">Pantau<span className="text-indigo-600">Desa</span></span>
          </Link>
          <Link href="/login" className="text-xs text-indigo-600 font-semibold">Masuk</Link>
        </div>

        {step !== "done" && <ProgressDots step={step} />}

        {/* ── Step 1: Form ─────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{AUTH_COPY.register.title}</h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{AUTH_COPY.register.subtitle}</p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">{AUTH_COPY.whyAccountTitle}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{AUTH_COPY.whyAccountBody}</p>
              <Link href="/desa" className="mt-2 inline-flex text-xs font-bold text-indigo-700 hover:text-indigo-900">
                {AUTH_COPY.seePublicData}
              </Link>
            </div>

            {apiErr && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">
                  {apiErr}
                  {apiErr.includes("→") && (
                    <Link href={`/login?email=${encodeURIComponent(form.email)}`} className="font-semibold underline ml-1">
                      Masuk sekarang
                    </Link>
                  )}
                </p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">

              {/* Nama */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nama Lengkap *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.nama} onChange={e => handleNamaChange(e.target.value)} placeholder="Nama aslimu"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.nama ? "border-rose-300 bg-rose-50" : "border-slate-200 focus:border-indigo-400"}`} />
                </div>
                {errors.nama && <p className="text-xs text-rose-600 mt-1">⚠ {errors.nama}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Username *</label>
                <div className="relative">
                  <AtSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.username}
                    onChange={e => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      set("username", v);
                      checkUsername(v);
                    }}
                    placeholder="username_kamu" maxLength={20}
                    className={`w-full pl-10 pr-8 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition font-mono ${
                      errors.username || usernameStatus === "taken" ? "border-rose-300 bg-rose-50" :
                      usernameStatus === "available" ? "border-emerald-400 bg-emerald-50/30" :
                      "border-slate-200 focus:border-indigo-400"
                    }`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <RotateCw size={13} className="text-slate-400 animate-spin" />}
                    {usernameStatus === "available" && <CheckCircle2 size={13} className="text-emerald-500" />}
                    {usernameStatus === "taken"     && <XCircle size={13} className="text-rose-500" />}
                  </span>
                </div>
                {errors.username
                  ? <p className="text-xs text-rose-600 mt-1">⚠ {errors.username}</p>
                  : usernameStatus === "available"
                  ? <p className="text-xs text-emerald-600 mt-1">✓ Username tersedia</p>
                  : <p className="text-[10px] text-slate-400 mt-1">Tidak bisa diubah setelah daftar</p>
                }
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@kamu.com"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.email ? "border-rose-300 bg-rose-50" : "border-slate-200 focus:border-indigo-400"}`} />
                </div>
                {errors.email && <p className="text-xs text-rose-600 mt-1">⚠ {errors.email}</p>}
              </div>

              {/* PIN */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">PIN 6 Digit *</label>
                <div className="relative">
                  <input type={showPin ? "text" : "password"} value={form.pin}
                    onChange={e => set("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric" maxLength={6} placeholder="••••••"
                    className={`w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition tracking-[0.35em] ${errors.pin ? "border-rose-300 bg-rose-50" : "border-slate-200 focus:border-indigo-400"}`} />
                  <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.pin
                  ? <p className="text-xs text-rose-600 mt-1">⚠ {errors.pin}</p>
                  : <p className="text-[10px] text-slate-400 mt-1">PIN digunakan untuk login. Jangan bagikan ke siapapun.</p>
                }
              </div>

              {/* Konfirmasi PIN */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Konfirmasi PIN *</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPin}
                    onChange={e => set("confirmPin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric" maxLength={6} placeholder="••••••"
                    className={`w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition tracking-[0.35em] ${errors.confirmPin ? "border-rose-300 bg-rose-50" : "border-slate-200 focus:border-indigo-400"}`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPin && <p className="text-xs text-rose-600 mt-1">⚠ {errors.confirmPin}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 mt-1">
                {loading ? <><RotateCw size={15} className="animate-spin" /> Memproses...</> : <><span>{AUTH_COPY.register.primaryCta}</span><ArrowRight size={15} /></>}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              {AUTH_COPY.register.loginPrompt}{" "}
              <Link href="/login" className="text-indigo-600 font-semibold hover:underline">{AUTH_COPY.register.loginCta}</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: OTP ──────────────────────────────────────────────── */}
        {step === "otp" && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Cek emailmu</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Kode 6 digit dikirim ke{" "}
                <span className="font-semibold text-slate-700">{form.email}</span>.
                <br />Berlaku 10 menit — masukkan segera.
              </p>
            </div>

            {apiErr && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm text-rose-700">⚠ {apiErr}</p>
              </div>
            )}

            <OtpInput onComplete={handleOtpComplete} disabled={loading} error={!!apiErr} reset={otpReset} />

            {loading && (
              <div className="flex justify-center">
                <RotateCw size={18} className="text-indigo-500 animate-spin" />
              </div>
            )}

            {/* Countdown + resend */}
            <div className="text-center space-y-2.5">
              {resendIn > 0 ? (
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  <RotateCw size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-500">
                    Kirim ulang tersedia dalam{" "}
                    <span className="font-black text-indigo-600 tabular-nums">{resendIn}s</span>
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors underline underline-offset-2"
                >
                  Tidak menerima kode? Kirim ulang sekarang
                </button>
              )}

              {/* Panduan jika tidak menerima */}
              <details className="text-left">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 text-center select-none">
                  Masih belum menerima? Lihat tips ▾
                </summary>
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 space-y-1">
                  <p className="font-bold">Yang bisa kamu lakukan:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Cek folder <strong>Spam</strong> atau <strong>Promotions</strong></li>
                    <li>Tunggu hingga tombol &quot;Kirim Ulang&quot; muncul, lalu klik</li>
                    <li>Pastikan emailmu benar — kalau salah, kembali dan ubah</li>
                  </ul>
                </div>
              </details>

              <button
                onClick={() => { setStep("form"); setApiErr(""); }}
                className="block text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors mx-auto"
              >
                ← Email salah? Ubah data pendaftaran
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ─────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Pendaftaran Berhasil!</h2>
              <p className="text-sm text-slate-500 mt-1">Akun kamu sudah aktif. Mengalihkan ke halaman masuk...</p>
            </div>
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DaftarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" /></div>}>
      <DaftarInner />
    </Suspense>
  );
}
