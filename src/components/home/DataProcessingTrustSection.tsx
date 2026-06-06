import {
  BadgeCheck,
  ClipboardCheck,
  FileSearch,
  Globe2,
  Tags,
  type LucideIcon,
} from "lucide-react";

type Step = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    title: "Sumber publik ditemukan",
    body: "PantauDesa menandai tautan atau dokumen publik yang bisa mulai dibaca warga.",
    icon: Globe2,
  },
  {
    title: "Dokumen diklasifikasi",
    body: "Dokumen dipisahkan sebagai APBDes, realisasi, profil, atau bahan pendukung.",
    icon: FileSearch,
  },
  {
    title: "Data ditandai statusnya",
    body: "Setiap angka penting diberi konteks seperti Data Demo, Sumber Ditemukan, atau Perlu Review.",
    icon: Tags,
  },
  {
    title: "Review dilakukan",
    body: "Informasi perlu dicek lagi sebelum dipakai sebagai rujukan, apalagi untuk klaim resmi.",
    icon: ClipboardCheck,
  },
  {
    title: "Warga membaca dengan konteks",
    body: "Hasil akhirnya membantu warga bertanya lebih tepat, bukan langsung menyimpulkan pelanggaran.",
    icon: BadgeCheck,
  },
];

export default function DataProcessingTrustSection() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Metodologi ringkas
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">
          Bagaimana data diproses?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          PantauDesa menampilkan data sebagai bahan baca awal. Status, sumber, dan batasan klaim sengaja ditaruh dekat angka agar warga tidak mengira data demo sebagai keputusan resmi.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
                  <Icon size={15} aria-hidden />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Langkah {index + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-snug text-slate-900">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
