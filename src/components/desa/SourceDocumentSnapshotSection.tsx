import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileText,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import type { Desa } from "@/lib/types";

interface Props {
  desa: Desa;
}

type SnapshotTone = "ok" | "warn" | "neutral";

interface SnapshotCard {
  title: string;
  status: string;
  tone: SnapshotTone;
  body: string;
  icon: LucideIcon;
}

const pillByTone: Record<SnapshotTone, string> = {
  ok: "pill-ok",
  warn: "pill-warn",
  neutral: "bg-slate-100 text-[color:var(--ink-3)]",
};

export default function SourceDocumentSnapshotSection({ desa }: Props) {
  const docs = desa.dokumen ?? [];
  const availableDocs = docs.filter((doc) => doc.tersedia);
  const sourceNames = desa.sumber?.map((source) => source.nama).filter(Boolean) ?? [];
  const needsReviewSource = desa.sumber?.some((source) => source.perluReview) ?? false;
  const hasSource = sourceNames.length > 0 || Boolean(desa.profil?.website);
  const primarySource = sourceNames[0] ?? desa.profil?.website;
  const hasApbdes = availableDocs.some((doc) => /apbdes/i.test(doc.nama));
  const hasRealisasi = availableDocs.some((doc) => /realisasi/i.test(doc.nama));
  const documentStatus =
    hasApbdes || hasRealisasi ? "Sumber ditemukan" : "Belum tercatat";
  const documentBody =
    hasApbdes && hasRealisasi
      ? "APBDes dan realisasi ada sebagai dokumen referensi, belum menjadi kesimpulan final."
      : hasApbdes
        ? "APBDes ada sebagai dokumen referensi. Realisasi masih perlu dicek lebih lanjut."
        : hasRealisasi
          ? "Dokumen realisasi ada sebagai referensi. APBDes masih perlu dicek lebih lanjut."
          : "Dokumen APBDes/Realisasi belum tercatat untuk desa ini.";

  const cards: SnapshotCard[] = [
    {
      title: "Sumber utama",
      status: hasSource ? "Ditemukan" : "Belum tercatat",
      tone: hasSource ? "ok" : "neutral",
      body: hasSource
        ? `${primarySource} menjadi rujukan awal. Sumber ini belum berarti terverifikasi.`
        : "Sumber publik belum tercatat untuk desa ini.",
      icon: Globe2,
    },
    {
      title: "Sumber lain",
      status: sourceNames.length > 1 ? `${sourceNames.length - 1} lainnya` : "Belum ada",
      tone: sourceNames.length > 1 ? "ok" : "neutral",
      body: sourceNames.length > 1
        ? sourceNames.slice(1, 3).join("; ")
        : `Belum ada sumber tambahan untuk ${desa.kecamatan} yang tercatat di ringkasan ini.`,
      icon: Building2,
    },
    {
      title: "Dokumen APBDes/Realisasi",
      status: documentStatus === "Sumber ditemukan" ? "Ditemukan" : "Belum tercatat",
      tone: hasApbdes || hasRealisasi ? "ok" : "neutral",
      body: documentBody,
      icon: FileText,
    },
    {
      title: "Status review",
      status: needsReviewSource ? "Perlu review" : "Belum diverifikasi",
      tone: needsReviewSource ? "warn" : "neutral",
      body: needsReviewSource
        ? "Ada sumber atau dokumen yang perlu dicek ulang sebelum menjadi rujukan."
        : "Sumber dapat dibaca sebagai referensi, tetapi belum dinyatakan terverifikasi.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Snapshot sumber</p>
          <h2 className="display text-[26px] font-semibold leading-tight text-[color:var(--ink-1)]">
            Sumber dan dokumen yang sudah terlihat
          </h2>
        </div>
        <p className="hidden max-w-xs text-right text-[11px] leading-relaxed text-[color:var(--ink-3)] sm:block">
          Sumber: {primarySource ?? "belum tersedia"}. {desa.terakhirDiperbaruiLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl bg-white p-4 ring-hair shadow-lux-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--indigo-50)] text-[color:var(--indigo-600)]">
                  <Icon size={15} aria-hidden />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillByTone[card.tone]}`}
                >
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-[13px] font-semibold leading-tight text-[color:var(--ink-1)]">
                {card.title}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--ink-3)]">
                {card.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
