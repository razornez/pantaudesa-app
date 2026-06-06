import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileSearch,
  MessageSquare,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type Principle = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const principles: Principle[] = [
  {
    title: "Baca sumbernya",
    body: "Mulai dari dokumen, tautan publik, dan catatan asal data sebelum menilai angka.",
    icon: FileSearch,
  },
  {
    title: "Pahami statusnya",
    body: "Bedakan data demo, sumber ditemukan, perlu review, dan data yang kelak terverifikasi.",
    icon: BadgeCheck,
  },
  {
    title: "Tanya pihak yang tepat",
    body: "Bawa pertanyaan yang jelas ke desa, kecamatan, atau dinas sesuai kewenangannya.",
    icon: MessageSquare,
  },
];

export default function PondasiTransparansiSection() {
  return (
    <section className="space-y-4">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          <ShieldCheck size={13} />
          Bukan menuduh
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">
          Bukan Menuduh, Tapi Membaca
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Memantau bukan berarti menuduh. PantauDesa membantu warga membaca informasi publik desa berdasarkan sumber dan status data yang jelas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {principles.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={18} />
              </div>
              <p className="mt-4 text-sm font-black text-slate-900">{item.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{item.body}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-white">Pertanyaan yang baik dimulai dari sumber yang jelas.</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              Gunakan PantauDesa untuk merapikan bahan bacaan, lalu lanjutkan dengan cara bertanya yang tepat sasaran.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tentang/kenapa-desa-dipantau"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              Pelajari Cara Memantau
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/desa"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Lihat Data Desa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
