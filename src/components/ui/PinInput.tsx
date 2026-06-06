"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  length?:    number;
  onComplete: (value: string) => void;
  disabled?:  boolean;
  error?:     boolean;
  reset?:     number; // increment to reset
}

export default function PinInput({ length = 6, onComplete, disabled, error, reset }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const prevReset = useRef(reset);
  useEffect(() => {
    if (reset === prevReset.current) return;
    prevReset.current = reset;
    setDigits(Array(length).fill(""));
    refs.current[0]?.focus();
  }, [length, reset]);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
    if (next.join("").length === length) onComplete(next.join(""));
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (text.length === length) {
      setDigits(text.split(""));
      onComplete(text);
    }
    e.preventDefault();
  };

  return (
    <div className="grid gap-2 w-full" style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className={`w-full h-10 text-center text-lg font-black rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40 ${
            error
              ? "border-rose-400 bg-rose-50 text-rose-700"
              : d
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-800 focus:border-indigo-400 focus:bg-indigo-50/50"
          }`}
        />
      ))}
    </div>
  );
}
