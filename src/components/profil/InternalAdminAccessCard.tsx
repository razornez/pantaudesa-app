"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Discoverable entry to /internal-admin from /profil/saya — only visible
 * when the JWT role flag says INTERNAL_ADMIN. Server-side guards in
 * /internal-admin/layout.tsx still enforce real access.
 */
export default function InternalAdminAccessCard() {
  const { user } = useAuth();
  if (user?.role !== "INTERNAL_ADMIN") return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
            <ShieldCheck size={13} aria-hidden />
            Internal Admin
          </div>
          <h2 className="mt-3 text-base font-black text-slate-950">Panel review klaim &amp; dokumen desa</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Akun ini ditandai sebagai internal admin. Buka panel untuk menyetujui klaim Admin Desa,
            menelaah dokumen, dan menjalankan tindakan review yang sensitif.
          </p>
        </div>
      </div>
      <Link
        href="/internal-admin"
        className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        Buka panel internal admin <ArrowRight size={14} aria-hidden />
      </Link>
    </section>
  );
}
