"use client";

import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Lock, RotateCw } from "lucide-react";
import { updateUserPin } from "./api";

interface ChangePinCardProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function ChangePinCard({ onSuccess, onError }: ChangePinCardProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function reset() {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setFieldErrors({});
  }

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSaving(true);

    try {
      await updateUserPin({ currentPin, newPin, confirmPin });
      onSuccess();
      reset();
      setOpen(false);
    } catch (error) {
      const data = error as { error?: string; field?: string };
      if (data.field) {
        setFieldErrors({ [data.field]: data.error ?? "Input tidak valid." });
      } else {
        onError(data.error ?? "Gagal mengganti PIN.");
      }
    } finally {
      setSaving(false);
    }
  }

  function renderPinInput(
    label: string,
    value: string,
    onChange: (value: string) => void,
    field: string
  ) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
        <div className="relative">
          <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPins ? "text" : "password"}
            value={value}
            onChange={(event) => {
              onChange(event.target.value.replace(/\D/g, "").slice(0, 6));
              setFieldErrors({});
            }}
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-10 text-sm tracking-[0.4em] transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              fieldErrors[field] ? "border-rose-300 bg-rose-50" : "border-slate-200 focus:border-indigo-400"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPins((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
          >
            {showPins ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        {fieldErrors[field] && <p className="mt-1 text-xs text-rose-600">⚠ {fieldErrors[field]}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          reset();
        }}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
            <Lock size={14} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Ganti PIN</p>
            <p className="text-xs text-slate-400">Ubah PIN 6 digit untuk keamanan akun</p>
          </div>
        </div>
        <ChevronRight size={15} className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 px-5 pb-5 pt-1">
          {renderPinInput("PIN Saat Ini", currentPin, setCurrentPin, "currentPin")}
          {renderPinInput("PIN Baru", newPin, setNewPin, "newPin")}
          {renderPinInput("Konfirmasi PIN Baru", confirmPin, setConfirmPin, "confirmPin")}
          <p className="text-[10px] text-slate-400">PIN 6 digit angka. Jangan gunakan urutan mudah ditebak (123456, tanggal lahir).</p>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !currentPin || !newPin || !confirmPin}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-40"
            >
              {saving ? (
                <>
                  <RotateCw size={13} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                "Simpan PIN Baru"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
