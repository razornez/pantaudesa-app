"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  claimId: string;
  desaId: string;
  desaName: string;
  desaLocation: string;
  claimStatus: string;
  alreadySubmitted: boolean;
  alreadySubmittedAt: string | null;
}

function claimStatusLabel(status: string) {
  if (status === "PENDING") return "Pengajuan dibuat";
  if (status === "IN_REVIEW") return "Sedang diperiksa";
  return "Pengajuan ditolak";
}

function claimStatusTone(status: string) {
  if (status === "PENDING") return "pill-warn";
  if (status === "IN_REVIEW") return "pill-info";
  return "pill-danger";
}

export default function ClaimSupportForm({
  claimId,
  desaId,
  desaName,
  desaLocation,
  claimStatus,
  alreadySubmitted,
  alreadySubmittedAt,
}: Props) {
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [whyCannotVerify, setWhyCannotVerify] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("Centang pernyataan tanggung jawab sebelum mengirim.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin-claim/support-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          desaId,
          reason,
          explanation,
          whyCannotVerify,
          evidenceDescription: evidenceDescription || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Pengajuan belum berhasil dikirim. Coba lagi beberapa saat.");
        return;
      }
      setResult({ ok: true, message: data.message });
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const isRejected = claimStatus === "REJECTED";

  if (result?.ok) {
    return (
      <div className="lux-card p-6 space-y-3">
        <div className="notice-card notice-ok text-sm leading-relaxed">
          <p className="font-semibold">{isRejected ? "Keberatan terkirim" : "Pengajuan tambahan terkirim"}</p>
          <p className="mt-2">{result.message}</p>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isRejected
            ? "Status pengajuan belum langsung berubah. Admin PantauDesa akan meninjau ulang bukti yang kamu kirim dan memberi kabar lewat email."
            : "Tim PantauDesa akan meninjau informasi tambahan ini bersama data pengajuan yang sudah ada."}
        </p>
        <Link href="/profil/klaim-admin-desa" className="btn-lux btn-lux-secondary w-full sm:w-auto">
          Kembali ke status klaim
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="lux-card p-5 space-y-2">
        <p className="eyebrow text-[10px]">Konteks pengajuan</p>
        <p className="text-base font-semibold text-slate-900">{desaName}</p>
        <p className="text-sm text-slate-500">{desaLocation}</p>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${claimStatusTone(claimStatus)}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden />
          {claimStatusLabel(claimStatus)}
        </span>
      </div>

      {isRejected && (
        <div className="notice-card notice-danger text-sm leading-relaxed">
          <p className="font-medium">Pengajuan kamu saat ini belum bisa diterima</p>
          <p className="mt-2">
            Mengirim keberatan atau bukti tambahan tidak otomatis membuat akun menjadi admin terverifikasi. Tim PantauDesa akan membaca ulang bukti yang kamu kirim, lalu memberi keputusan lewat email.
          </p>
        </div>
      )}

      {alreadySubmitted && (
        <div className="notice-card notice-info text-sm leading-relaxed">
          <p className="font-medium">
            {isRejected ? "Bukti tambahan sudah pernah dikirim" : "Pengajuan tambahan sudah pernah dikirim"}
          </p>
          {alreadySubmittedAt ? (
            <p className="mt-2 text-xs opacity-80">
              Dikirim pada {new Date(alreadySubmittedAt).toLocaleString("id-ID")}
            </p>
          ) : null}
          <p className="mt-2">
            {isRejected
              ? "Kamu boleh mengirim informasi baru bila ada bukti yang lebih kuat."
              : "Kamu boleh mengirim penjelasan tambahan bila ada perkembangan baru."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="lux-card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Detail pengajuan</h2>

          <div>
            <label className="field-label">
              Alasan kamu mengajukan sebagai Admin Desa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="Contoh: Saya perangkat desa yang mengelola data resmi desa."
              className="field-lux"
              required
            />
            <p className="text-xs text-slate-400 mt-1">{reason.length}/200</p>
          </div>

          <div>
            <label className="field-label">
              Penjelasan lengkap pengajuan kamu <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Ceritakan jabatan, peran, dan alasan kamu berwenang mengelola informasi desa ini."
              className="textarea-lux"
              required
            />
            <p className="text-xs text-slate-400 mt-1">{explanation.length}/2000</p>
          </div>

          <div>
            <label className="field-label">
              Mengapa kamu belum bisa verifikasi lewat token website atau email resmi? <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={whyCannotVerify}
              onChange={(e) => setWhyCannotVerify(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Contoh: website desa sedang diperbaiki, email resmi belum aktif, atau akses email dipegang pihak lain."
              className="textarea-lux"
              required
            />
          </div>

          <div>
            <label className="field-label">
              Gambaran bukti yang kamu miliki <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Contoh: SK pengangkatan, surat kuasa, atau dokumen resmi lain yang bisa membantu review."
              className="textarea-lux"
            />
            <p className="text-xs text-slate-400 mt-1">
              Upload file belum tersedia di form ini. Jelaskan dulu bukti yang kamu punya agar tim tahu dokumen apa yang bisa diminta bila perlu.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)] cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-slate-300 accent-[#1E1B4B]"
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            Saya menyatakan informasi yang saya kirimkan benar dan dapat dipertanggungjawabkan.
          </span>
        </label>

        {error && <p className="notice-card notice-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !agreed}
          className="btn-lux btn-lux-primary w-full"
        >
          {loading ? "Mengirim..." : "Kirim Pengajuan Admin Desa"}
        </button>
      </form>
    </div>
  );
}
