"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { ToastType } from "@/components/ui/Toast";
import { markDocumentFailed } from "./api";
import type { DocRow } from "./types";

interface MarkFailedModalProps {
  doc: DocRow;
  onClose: () => void;
  onDone: () => void;
  onNotify: (message: string, type?: ToastType) => void;
}

export function MarkFailedModal({
  doc,
  onClose,
  onDone,
  onNotify,
}: MarkFailedModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      onNotify("Alasan kegagalan wajib diisi.", "error");
      return;
    }

    setLoading(true);

    try {
      await markDocumentFailed(doc.id, reason.trim());
      onNotify("Dokumen ditandai gagal.", "success");
      onDone();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Koneksi bermasalah. Coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="lux-panel w-full max-w-md space-y-4 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="eyebrow text-[10px]">Tandai gagal diproses</p>
          <h2 className="text-[18px] font-semibold tracking-tight text-slate-900 sm:text-[20px]">
            {doc.title}
          </h2>
          <p className="text-xs text-slate-500">{doc.desa.nama}</p>
        </div>

        <div className="notice-card notice-danger text-xs">
          Pengunggah akan lihat alasan ini. Jelaskan dengan jelas apa yang perlu diperbaiki.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="field-label text-xs">Alasan untuk pengunggah</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Contoh: dokumen buram, lampiran tidak sesuai."
              className="textarea-lux text-sm"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-lux btn-lux-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-lux btn-lux-danger flex-1 text-sm"
            >
              {loading ? "Menyimpan..." : "Tandai gagal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
