import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import ContactAdminSection from "@/components/support/ContactAdminSection";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readSourceParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "/profil/klaim-admin-desa";
  return value ?? "/profil/klaim-admin-desa";
}

export default async function HubungiAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sourcePage = readSourceParam(params.source);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={sourcePage}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
      >
        <ArrowLeft size={15} />
        Kembali
      </Link>

      <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-sky-50 p-5 shadow-sm sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          <LifeBuoy size={14} />
          Hubungi Admin
        </div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
          Kirim bantuan atau klarifikasi ke tim PantauDesa.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Gunakan halaman ini untuk melaporkan kendala klaim admin, masalah akses, dugaan admin palsu, atau kebutuhan klarifikasi lainnya.
        </p>
      </section>

      <div className="mt-5">
        <ContactAdminSection sourcePage={sourcePage} />
      </div>
    </div>
  );
}
