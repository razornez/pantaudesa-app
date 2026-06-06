import {
  ClipboardList,
  FileText,
  FolderOpen,
  Landmark,
  ScrollText,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type DocumentItem = {
  label: string;
  body: string;
  icon: LucideIcon;
};

const documents: DocumentItem[] = [
  {
    label: "APBDes",
    body: "Rencana pendapatan dan belanja desa.",
    icon: ClipboardList,
  },
  {
    label: "Realisasi",
    body: "Catatan pelaksanaan anggaran.",
    icon: FileText,
  },
  {
    label: "RKPDes",
    body: "Rencana kerja pemerintah desa tahunan.",
    icon: FolderOpen,
  },
  {
    label: "RPJMDes",
    body: "Arah pembangunan desa beberapa tahun.",
    icon: Landmark,
  },
  {
    label: "Perdes",
    body: "Peraturan desa yang menjadi dasar kebijakan.",
    icon: ScrollText,
  },
  {
    label: "Profil Desa",
    body: "Informasi wilayah, perangkat, dan layanan.",
    icon: UserRound,
  },
];

export default function DocumentDeskSection() {
  return (
    <section>
      <div className="mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Meja dokumen</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-800">
          Dokumen apa yang biasanya bisa dicari warga?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Daftar ini membantu warga tahu nama dokumen sebelum bertanya atau mencari ke kanal resmi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => {
          const Icon = document.icon;
          return (
            <div
              key={document.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{document.label}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{document.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
