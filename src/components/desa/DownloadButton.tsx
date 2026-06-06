"use client";

import { Download } from "lucide-react";
import { Desa } from "@/lib/types";

interface Props {
  desa: Desa;
}

function toCSV(desa: Desa): string {
  const rows: string[][] = [
    ["Field", "Value"],
    ["Nama Desa", desa.nama],
    ["Kecamatan", desa.kecamatan],
    ["Kabupaten", desa.kabupaten],
    ["Provinsi", desa.provinsi],
    ["Tahun Anggaran", desa.tahun.toString()],
    ["Jumlah Penduduk", desa.penduduk.toString()],
    ["Kategori Fokus", desa.kategori],
    ["Dana Desa (Rp)", (desa.paguDanaDesa ?? 0) > 0 ? (desa.paguDanaDesa ?? 0).toString() : "-"],
    ["Kelengkapan Data (%)", (desa.completenessScore ?? 0).toString()],
    [],
  ];

  if (desa.apbdes?.length) {
    rows.push(["=== RINCIAN APBDes ===", ""]);
    rows.push(["Bidang", "Anggaran (Rp)", "Realisasi (Rp)", "Persentase (%)"]);
    desa.apbdes.forEach((a) => rows.push([a.bidang, a.anggaran.toString(), a.realisasi.toString(), a.persentase.toString()]));
    rows.push([]);
  }

  if (desa.outputFisik?.length) {
    rows.push(["=== OUTPUT FISIK ===", ""]);
    rows.push(["Program", "Target", "Realisasi", "Satuan", "Persentase (%)"]);
    desa.outputFisik.forEach((o) => rows.push([o.label, o.target.toString(), o.realisasi.toString(), o.satuan, o.persentase.toString()]));
    rows.push([]);
  }

  if (desa.riwayat?.length) {
    rows.push(["=== RIWAYAT 5 TAHUN ===", ""]);
    rows.push(["Tahun", "Anggaran (Rp)", "Realisasi (Rp)", "Persentase (%)"]);
    desa.riwayat.forEach((r) => rows.push([r.tahun.toString(), r.totalAnggaran.toString(), r.terealisasi.toString(), `${r.persentaseSerapan}`]));
  }

  return rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

export default function DownloadButton({ desa }: Props) {
  const handleDownload = () => {
    const csv = toCSV(desa);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pantaudesa_${desa.nama.toLowerCase().replace(/\s+/g, "_")}_${desa.tahun}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
    >
      <Download size={14} />
      Unduh Data CSV
    </button>
  );
}
