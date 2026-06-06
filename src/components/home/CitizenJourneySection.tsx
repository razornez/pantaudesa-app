import {
  Search,
  FileSearch,
  FlaskConical,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

type Step = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    title: "Cari Desa",
    body: "Mulai dari nama desa, kecamatan, atau kabupaten yang ingin kamu pahami.",
    icon: Search,
  },
  {
    title: "Lihat status data",
    body: "Pahami apakah informasinya masih demo, sumber ditemukan, atau perlu review.",
    icon: FlaskConical,
  },
  {
    title: "Baca sumber/dokumen",
    body: "Cek dokumen atau tautan publik sebelum menilai angka dan ringkasan.",
    icon: FileSearch,
  },
  {
    title: "Tanya atau sampaikan suara warga",
    body: "Gunakan bahan awal untuk bertanya dengan tenang atau membagikan kondisi desa.",
    icon: MessageSquare,
  },
];

export default function CitizenJourneySection() {
  return (
    <section id="alur-warga">
      <div className="mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Alur warga</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-800">
          Dari penasaran jadi tahu harus cek apa
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Cari desa, lihat status data, baca sumber atau dokumen, lalu ajukan pertanyaan atau sampaikan suara warga dengan tenang.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <details
              key={step.title}
              className="group relative rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
            >
              {index < steps.length - 1 && (
                <div className="absolute left-full top-7 hidden h-px w-2 bg-slate-200 sm:block" />
              )}
              <summary className="flex cursor-pointer list-none flex-col items-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 rounded-xl">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-colors group-open:bg-sky-600 group-open:text-white">
                  <Icon size={19} />
                </div>
                <p className="text-xs font-black leading-tight text-slate-900">{step.title}</p>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{step.body}</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
