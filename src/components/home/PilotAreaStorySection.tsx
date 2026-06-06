import { FileSearch, Globe2, MapPin, ShieldAlert } from "lucide-react";

const pilotStats = [
  {
    label: "11 desa",
    body: "Ditinjau sebagai contoh area awal.",
    icon: MapPin,
  },
  {
    label: "10 website",
    body: "Situs desa ditemukan untuk ditelusuri.",
    icon: Globe2,
  },
  {
    label: "Dokumen terdeteksi",
    body: "Sebagian APBDes atau realisasi mulai dipetakan.",
    icon: FileSearch,
  },
];

export default function PilotAreaStorySection() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-900 p-6 text-white shadow-sm sm:p-7">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">
            <MapPin size={13} />
            Pilot awal
          </div>
          <h2 className="mt-4 text-xl font-black">Kecamatan Arjasari jadi area belajar pertama</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            PantauDesa mulai dari area kecil agar proses pencarian sumber, pembacaan dokumen, dan
            penandaan status data bisa diuji dengan hati-hati sebelum diperluas.
          </p>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-900">
              <ShieldAlert size={16} />
            </div>
            <p className="text-sm leading-relaxed text-amber-50">
              Semua angka pilot masih demo, imported, atau needs_review. Jangan dibaca sebagai
              klaim resmi atau terverifikasi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {pilotStats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-100">
                  <Icon size={18} />
                </div>
                <p className="mt-4 text-lg font-black">{item.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
