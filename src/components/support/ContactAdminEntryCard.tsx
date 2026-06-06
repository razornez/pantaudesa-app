import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";

export default function ContactAdminEntryCard({
  href = "/hubungi-admin?source=%2Fprofil%2Fklaim-admin-desa",
}: {
  href?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <LifeBuoy size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">Butuh bantuan dari admin PantauDesa?</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Form bantuan dipindah ke halaman terpisah agar alur klaim tetap fokus. Kamu tetap bisa kirim kendala, klarifikasi, atau laporan dari sana.
          </p>
          <Link
            href={href}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
          >
            Buka halaman Hubungi Admin
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
