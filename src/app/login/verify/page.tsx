import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center mx-auto">
          <Sparkles size={32} className="text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Cek emailmu!</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Kami kirimkan magic link ke emailmu. Klik link di email untuk masuk — berlaku 10 menit.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700 text-left">
          <p className="font-bold mb-1">Tidak menerima email?</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Cek folder spam / promotions</li>
            <li>Pastikan email yang dimasukkan benar</li>
          </ul>
        </div>
        <Link
          href="/login"
          className="block text-xs font-semibold text-indigo-600 hover:underline"
        >
          Kembali & coba email lain
        </Link>
      </div>
    </div>
  );
}
