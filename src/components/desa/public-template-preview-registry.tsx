import type { ReactNode } from "react";
import type { ComponentPreviewVariant } from "@/lib/village-data/component-catalog-manifest";

interface PreviewField {
  fieldKey: string;
  label: string;
}

export interface TemplatePreviewComponentInput {
  componentKey: string;
  previewVariant?: ComponentPreviewVariant;
  label: string;
  description: string;
  fields: PreviewField[];
  highlightFieldKeys?: string[];
}

function hasField(input: TemplatePreviewComponentInput, fieldKey: string) {
  return input.fields.some((field) => field.fieldKey === fieldKey);
}

function PreviewStatCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-2.5 shadow-sm ${
        highlighted
          ? "border border-indigo-200 bg-white ring-1 ring-indigo-100"
          : "border border-white/90 bg-white/70"
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FirstViewShellPreview({
  input,
  body,
}: {
  input: TemplatePreviewComponentInput;
  body: string;
}) {
  return (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body={body}
      tone="border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="overflow-hidden rounded-[26px] border border-indigo-100/70 bg-white/70">
        <div className="grid grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-3 border-r border-indigo-100/60 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                Kartu Identitas Desa
              </span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                Sumber Ditemukan
              </span>
            </div>
            <div>
              <p className="text-[14px] font-black text-slate-950">Nama desa</p>
              <p className="mt-1 text-[9px] text-slate-500">
                Kecamatan, Kabupaten, Provinsi
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PreviewStatCard
                label="Penduduk"
                value="3.786 jiwa"
                highlighted={hasField(input, "jumlahPenduduk")}
              />
              <PreviewStatCard
                label="Sumber"
                value="1 sumber"
                highlighted={input.componentKey === "sumber_dokumen"}
              />
              <PreviewStatCard
                label="Dokumen"
                value="0 dokumen"
                highlighted={input.componentKey === "sumber_dokumen"}
              />
              <PreviewStatCard
                label="Kategori"
                value="Maju"
                highlighted={hasField(input, "kategori")}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PreviewStatCard
                label="Luas wilayah"
                value="12,4 km2"
                highlighted={hasField(input, "luasWilayah")}
              />
              <PreviewStatCard
                label="Dusun"
                value="4 dusun"
                highlighted={hasField(input, "jumlahDusun")}
              />
              <PreviewStatCard
                label="RT / RW"
                value="11 RT / 5 RW"
                highlighted={hasField(input, "jumlahRt") || hasField(input, "jumlahRw")}
              />
              <PreviewStatCard
                label="KK"
                value="987 KK"
                highlighted={hasField(input, "jumlahKK")}
              />
            </div>
            <div className="grid gap-2">
              <div
                className={`rounded-2xl px-3 py-2.5 shadow-sm ${
                  hasField(input, "potensiUnggulan")
                    ? "border border-indigo-200 bg-white ring-1 ring-indigo-100"
                    : "border border-white/90 bg-white/70"
                }`}
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Potensi unggulan
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-slate-700">
                  Wisata sungai, kopi rakyat, dan hortikultura dataran tinggi.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-xl border border-white/90 bg-white/80 px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                Web Profil Desa
              </span>
              <span className="rounded-xl border border-white/90 bg-white/80 px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                022-8799...
              </span>
              <span className="rounded-xl border border-white/90 bg-white/80 px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                halo@...
              </span>
            </div>
          </div>
          <div className="space-y-2 bg-slate-50/85 p-3">
            <div>
              <p className="text-[10px] font-black text-slate-900">Yang perlu kamu tahu dulu</p>
              <p className="mt-1 line-clamp-3 text-[9px] leading-relaxed text-slate-500">
                Slot ini di halaman publik berisi konteks, sumber, dan kartu baca awal.
              </p>
            </div>
            {[
              ["Status data", "Panduan baca"],
              ["Sumber publik", "Sumber Ditemukan"],
              ["Dokumen", "Belum tercatat"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-[10px] font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function PreviewDbFieldChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-700 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.12)]">
      <span className="h-1 w-1 rounded-full bg-indigo-500" aria-hidden />
      Field DB
      <span className="text-indigo-500/80">{label}</span>
    </span>
  );
}

function renderPreviewFieldChips(input: TemplatePreviewComponentInput) {
  const highlightKeys = new Set(input.highlightFieldKeys ?? []);
  const highlighted = input.fields.filter((field) => highlightKeys.has(field.fieldKey));
  const fallback = highlighted.length > 0 ? highlighted : input.fields.slice(0, 3);
  return fallback.slice(0, 4).map((field) => (
    <PreviewDbFieldChip key={field.fieldKey} label={field.label} />
  ));
}

function PreviewShell({
  eyebrow,
  title,
  body,
  tone,
  chips,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone: string;
  chips: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-[28px] border ${tone}`}>
      <div className="space-y-2.5 p-3.5 sm:p-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-[12px] font-black leading-tight text-slate-900">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-500">{body}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">{chips}</div>
        {children}
      </div>
    </div>
  );
}

export const PUBLIC_TEMPLATE_PREVIEW_REGISTRY: Record<
  ComponentPreviewVariant,
  (input: TemplatePreviewComponentInput) => ReactNode
> = {
  identity: (input) => (
    <FirstViewShellPreview
      input={input}
      body="Slot first view di halaman publik memang besar. Preview ini menampilkan shell lengkapnya, lalu menyorot field identitas yang diisi komponen ini."
    />
  ),
  demography: (input) => (
    <FirstViewShellPreview
      input={input}
      body="Komponen demografi juga hidup di shell first view yang sama. Area angka dan fakta cepat di bawah nama desa di-highlight dari field demografi."
    />
  ),
  source: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Snapshot sumber tampil sebagai bukti awal sebelum warga membaca angka atau dokumen."
      tone="border-sky-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="grid gap-2 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Sumber publik</p>
          <p className="mt-2 text-[11px] font-black text-slate-900">Website resmi desa</p>
          <p className="mt-1 text-[9px] text-slate-500">URL, label sumber, dan status cek tampil di sini.</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dokumen pendukung</p>
          <p className="mt-2 text-[11px] font-black text-slate-900">Belanja desa / profil resmi</p>
          <p className="mt-1 text-[9px] text-slate-500">Ringkasan dokumen, bukan payload panjang.</p>
        </div>
      </div>
    </PreviewShell>
  ),
  transparency: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Skor transparansi tetap muncul sebagai tiga metrik utama, bukan tabel teknis."
      tone="border-cyan-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="grid gap-2 lg:grid-cols-3">
        {["Skor total", "Ketepatan", "Kelengkapan"].map((label) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-2 text-[20px] font-black text-slate-900">84</p>
          </div>
        ))}
      </div>
    </PreviewShell>
  ),
  budget: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Ringkasan anggaran tampil sebagai kartu angka utama yang jadi pintu masuk membaca APBDes."
      tone="border-amber-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {["Total anggaran", "Realisasi", "Belum terserap", "Persentase"].map((label) => (
          <div key={label} className="rounded-2xl bg-white px-3 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className="mt-1 text-[11px] font-black text-slate-900">{label === "Persentase" ? "81%" : "Rp 3,3 M"}</p>
          </div>
        ))}
      </div>
    </PreviewShell>
  ),
  pendapatan: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Rincian sumber pendapatan tetap berupa breakdown asal dana dengan bar sederhana."
      tone="border-orange-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {["Dana Desa", "ADD", "PADes", "Bantuan"].map((label, index) => (
          <div key={label} className="rounded-2xl bg-white px-3 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className="mt-1 text-[11px] font-black text-slate-900">Rp {(index + 1) * 250} Jt</p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${68 + index * 6}%` }} />
            </div>
          </div>
        ))}
      </div>
    </PreviewShell>
  ),
  kinerja: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Section ini tetap memadukan output fisik, rincian APBDes, dan riwayat dalam slot yang sama."
      tone="border-slate-200 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Output fisik</p>
          <div className="mt-2 space-y-2">
            {["Perbaikan jalan desa", "Drainase lingkungan", "Pelatihan warga"].map((item) => (
              <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-[9px] font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Riwayat & rincian</p>
          <div className="mt-3 space-y-2">
            <div className="h-16 rounded-2xl bg-slate-50" />
            <div className="h-10 rounded-2xl bg-slate-50" />
          </div>
        </div>
      </div>
    </PreviewShell>
  ),
  perangkat: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Perangkat sekarang hidup di shell tab dokumen/transparansi agar warga langsung melihat pihak yang harus ditanya lebih dulu."
      tone="border-indigo-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50">
          {["Perangkat", "Dokumen", "Transparansi"].map((tab, index) => (
            <div
              key={tab}
              className={`px-3 py-2 text-center text-[9px] font-bold ${
                index === 0
                  ? "border-b-2 border-indigo-500 bg-white text-indigo-700"
                  : "text-slate-500"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-[10px] font-black text-slate-950">Siapa yang Harus Kamu Tanya?</p>
            <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-500">
              Pejabat desa yang bertanggung jawab atas pengelolaan anggaran ini.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Kepala Desa", "Ode Mandra"],
              ["Sekretaris Desa", "Rini Wulandari"],
              ["Bendahara Desa", "Tono Setiawan"],
              ["Kaur Perencanaan", "Rika Novitasari"],
            ].map(([role, name]) => (
              <div key={role} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[8px] font-semibold text-indigo-700">
                  {role}
                </p>
                <p className="mt-2 text-[10px] font-black text-slate-900">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PreviewShell>
  ),
  kelengkapan: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Kelengkapan desa sekarang fokus ke aset, fasilitas, lembaga, dan BUMDes setelah perangkat dipindah ke shell tab dokumen/transparansi."
      tone="border-emerald-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
        <div className="bg-[#202B45] px-4 py-3 text-white">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-100">Kelengkapan desa</p>
          <p className="text-[11px] font-black">Aset, Fasilitas & Organisasi Masyarakat</p>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {["Aset", "Fasilitas", "Lembaga", "BUMDes"].map((tab, index) => (
              <span
                key={tab}
                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                  index === 0 ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {["Tanah kas desa", "Gedung serbaguna", "Mobil siaga desa"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-white p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Preview item</p>
                <p className="mt-1 text-[10px] font-black text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PreviewShell>
  ),
  guide: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Panduan warga tetap tampil sebagai alur langkah dan kartu pemeriksa sebelum laporan."
      tone="border-amber-100 bg-amber-50/55"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {["Pahami hak warga", "Tanya pihak tepat", "Cek sebelum lapor", "Sampaikan suara"].map((step, index) => (
          <div key={step} className="rounded-2xl border border-amber-100 bg-white px-3 py-3">
            <p className="text-[9px] font-black text-amber-700">Langkah {index + 1}</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-900">{step}</p>
          </div>
        ))}
      </div>
    </PreviewShell>
  ),
  agenda: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Agenda desa memakai field DB untuk daftar kegiatan, ringkasan, dan kontak agenda."
      tone="border-sky-100 bg-sky-50/45"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="rounded-2xl border border-sky-100 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-slate-950">Agenda publik desa</p>
            <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
              Slot opsional yang bisa dipasang manual dari catalog.
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-2 py-1 text-[8px] font-bold text-sky-700">
            Field DB
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["Musyawarah", "Layanan", "Kegiatan"].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-[9px] font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </PreviewShell>
  ),
  voice: (input) => (
    <PreviewShell
      eyebrow="Preview detail publik"
      title={input.label}
      body="Komponen suara warga tetap berupa CTA dan preview cerita singkat dalam kartu gradasi."
      tone="border-indigo-100 bg-white"
      chips={renderPreviewFieldChips(input)}
    >
      <div className="overflow-hidden rounded-2xl border border-indigo-100">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
          <p className="text-[12px] font-black">Suara Warga</p>
          <p className="text-[9px] text-indigo-100">3 cerita dari warga</p>
        </div>
        <div className="space-y-2 bg-white p-4">
          {["Jalan lingkungan mulai rusak", "Posyandu aktif tiap bulan", "Perlu papan APBDes lebih jelas"].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-[9px] text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </PreviewShell>
  ),
};

export function renderTemplateComponentPreview(input: TemplatePreviewComponentInput) {
  return (
    PUBLIC_TEMPLATE_PREVIEW_REGISTRY[input.previewVariant ?? "identity"] ??
    PUBLIC_TEMPLATE_PREVIEW_REGISTRY.identity
  )(input);
}
