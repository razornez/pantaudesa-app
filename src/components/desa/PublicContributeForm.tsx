"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, ShieldCheck, CheckCircle2, Loader2, X, Heart } from "lucide-react";
import { DOCUMENT_CATEGORIES } from "@/lib/storage/upload-validation";

interface Props {
  desaId: string;
  desaNama: string;
  /** Human labels of the data dimensions still missing for this desa. */
  missing: string[];
  /** accept attribute for the file input (mime + extensions). */
  accept: string;
  /** Allowed format labels (e.g. PDF, XLSX) for the hint line. */
  formatLabels: string[];
  maxFileMb: number;
}

const DATA_SOURCES = [
  {
    label: "DJPK Kemenkeu",
    detail: "Dana Desa & transfer fiskal tahunan",
    dot: "#10B981",
    bg: "rgba(16,185,129,.08)",
    ring: "rgba(16,185,129,.20)",
  },
  {
    label: "Kemendesa IDM 2024",
    detail: "Kategori & indeks desa membangun",
    dot: "#4F46E5",
    bg: "rgba(79,70,229,.08)",
    ring: "rgba(79,70,229,.20)",
  },
  {
    label: "Dukcapil GIS Kemendagri",
    detail: "Kependudukan, KK, luas & batas wilayah",
    dot: "#14B8A6",
    bg: "rgba(20,184,166,.08)",
    ring: "rgba(20,184,166,.20)",
  },
  {
    label: "OpenStreetMap",
    detail: "Koordinat GPS & geometri desa",
    dot: "#84CC16",
    bg: "rgba(132,204,22,.08)",
    ring: "rgba(132,204,22,.22)",
  },
  {
    label: "Open-Meteo",
    detail: "Topografi, ketinggian & elevasi lahan",
    dot: "#0EA5E9",
    bg: "rgba(14,165,233,.08)",
    ring: "rgba(14,165,233,.20)",
  },
  {
    label: "OpenSID website desa",
    detail: "Kepala desa, perangkat & profil resmi",
    dot: "#8B5CF6",
    bg: "rgba(139,92,246,.08)",
    ring: "rgba(139,92,246,.20)",
  },
] as const;

type Status = "idle" | "submitting" | "done" | "error";

export default function PublicContributeForm({
  desaId,
  desaNama,
  missing,
  accept,
  formatLabels,
  maxFileMb,
}: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0].value);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [ack, setAck] = useState(false);

  const canSubmit = files.length > 0 && title.trim().length > 0 && ack && status !== "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setMessage("");
    try {
      const fd = new FormData();
      fd.set("desaId", desaId);
      fd.set("category", category);
      fd.set("title", title.trim());
      fd.set("note", note.trim());
      fd.set("contributorName", name.trim());
      fd.set("contributorContact", contact.trim());
      fd.set("responsibilityAck", ack ? "true" : "false");
      files.forEach((f) => fd.append("files", f));

      const res = await fetch("/api/public/contribute", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Gagal mengirim. Coba lagi.");
        return;
      }
      setStatus("done");
      setMessage(data?.message ?? "Terima kasih! Dokumen masuk antrian peninjauan.");
      setFiles([]); setTitle(""); setNote(""); setName(""); setContact(""); setAck(false);
    } catch {
      setStatus("error");
      setMessage("Gagal terhubung ke server. Coba lagi.");
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
      {/* Provenance — always visible */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <p className="text-[10.5px] font-semibold uppercase tracking-[.14em] text-indigo-500 mb-2">
          Data yang sudah kami kumpulkan
        </p>
        <p className="text-[13px] leading-relaxed text-slate-700 mb-4">
          Data <span className="font-semibold text-slate-800">{desaNama}</span> yang kamu baca ini
          dikumpulkan susah payah dari{" "}
          <span className="font-semibold text-indigo-700">6 sumber resmi berbeda</span> — supaya
          kamu bisa memantau desamu tanpa harus mencari sendiri.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DATA_SOURCES.map((s) => (
            <div
              key={s.label}
              className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: s.bg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
            >
              <span
                className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: s.dot }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 leading-tight">{s.label}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
        {missing.length > 0 ? (
          <div className="mt-3 space-y-2">
            {/* Why is data missing — plain language explanation */}
            <div
              className="rounded-xl px-3.5 py-3"
              style={{ background: "rgba(248,250,252,1)", boxShadow: "inset 0 0 0 1px rgba(148,163,184,.25)" }}
            >
              <p className="text-[11.5px] font-semibold text-slate-700 mb-1.5">
                Kenapa ada data yang belum kami isi?
              </p>
              <p className="text-[11.5px] leading-relaxed text-slate-500">
                Bukan karena tidak mencoba. Beberapa data memang{" "}
                <span className="font-medium text-slate-700">belum tersedia secara digital</span> di mana pun:
              </p>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-500">
                  <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" aria-hidden />
                  <span>
                    <span className="font-medium text-slate-700">Nama kepala desa</span> — tidak ada database
                    nasional yang terbuka. Data ini hanya ada di kantor desa masing-masing.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-500">
                  <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" aria-hidden />
                  <span>
                    <span className="font-medium text-slate-700">Dokumen & anggaran rinci</span> — setiap desa
                    menyimpan sendiri, belum ada sistem terpusat yang bisa diakses publik.
                  </span>
                </li>
              </ul>
            </div>
            {/* CTA */}
            <div
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: "rgba(99,102,241,.06)", boxShadow: "inset 0 0 0 1px rgba(99,102,241,.18)" }}
            >
              <Heart size={14} className="mt-0.5 flex-shrink-0 text-indigo-500" aria-hidden />
              <div className="text-[11.5px] leading-relaxed text-indigo-900">
                <span className="font-semibold">Di sinilah kamu bisa bantu.</span>{" "}
                Data yang masih kosong untuk {desaNama}: {missing.join(", ")}.{" "}
                <span className="text-indigo-700">
                  Kalau kamu punya akses ke dokumen resmi desa ini — bahkan foto SK atau laporan —
                  kirim ke kami. Kontribusimu berarti bagi ribuan warga.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mt-3 flex items-start gap-2.5 rounded-xl px-3.5 py-3"
            style={{ background: "rgba(16,185,129,.06)", boxShadow: "inset 0 0 0 1px rgba(16,185,129,.18)" }}
          >
            <Heart size={14} className="mt-0.5 flex-shrink-0 text-emerald-600" aria-hidden />
            <p className="text-[11.5px] leading-relaxed text-emerald-900">
              <span className="font-semibold">Data desa ini cukup lengkap</span>, tapi selalu ada
              yang bisa diperbaiki. Kalau kamu punya dokumen resmi terbaru, tetap bantu kami
              perbarui.
            </p>
          </div>
        )}
      </div>

      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Upload size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-indigo-600">Gotong royong data</span>
          <span className="block text-sm font-bold text-slate-800">Bantu lengkapi data {desaNama}</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Punya dokumen resmi desa ini? Kirim untuk ditinjau tim PantauDesa.
          </span>
        </span>
        <span className="flex-shrink-0 text-xs font-semibold text-indigo-600">{open ? "Tutup" : "Buka"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5">
          {/* Admin-desa official-channel notice */}
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed text-amber-900">
              <p className="font-bold">Apakah Anda admin desa?</p>
              <p className="mt-0.5">
                Jika Anda perangkat/admin {desaNama}, sebaiknya isi data lewat jalur resmi agar bisa
                terbit lebih cepat dan terverifikasi.{" "}
                <Link href="/login" className="font-semibold text-amber-800 underline hover:text-amber-950">
                  Masuk
                </Link>{" "}
                atau{" "}
                <Link href="/daftar" className="font-semibold text-amber-800 underline hover:text-amber-950">
                  daftar
                </Link>
                , lalu ajukan{" "}
                <Link href="/profil/klaim-admin-desa" className="font-semibold text-amber-800 underline hover:text-amber-950">
                  klaim Admin Desa
                </Link>
                .
              </p>
            </div>
          </div>

          {status === "done" ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Terkirim — menunggu peninjauan</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-700">{message}</p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-3 text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                >
                  Kirim dokumen lain
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Jenis data / dokumen</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Keterangan dokumen <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder={`Mis. APBDes ${desaNama} 2024`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* File input */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">File dokumen <span className="text-rose-500">*</span></label>
                <input
                  type="file"
                  accept={accept}
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Format: {formatLabels.join(", ")} · maks {maxFileMb} MB/file
                </p>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                        <span className="truncate">{f.name}</span>
                        <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="flex-shrink-0 text-slate-400 hover:text-rose-500" aria-label="Hapus file">
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Optional note */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Catatan (opsional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Sumber dokumen, tahun, atau konteks lain"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Optional contributor identity */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Nama kamu (opsional)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  maxLength={160}
                  placeholder="Email/HP untuk follow-up (opsional)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Responsibility ack */}
              <label className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                />
                <span className="text-xs leading-relaxed text-slate-600">
                  Saya menyatakan dokumen ini asli/benar dan boleh ditinjau tim PantauDesa. Saya paham
                  data tidak langsung tampil sebelum diverifikasi.
                </span>
              </label>

              {status === "error" && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{message}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Mengirim…
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Kirim untuk ditinjau
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
