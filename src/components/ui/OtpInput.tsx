"use client";

import { useEffect, useRef, useState } from "react";

const LEN = 6;

interface Props {
  onComplete: (value: string) => void;
  disabled?:  boolean;
  error?:     boolean;
  reset?:     number;
}

export default function OtpInput({ onComplete, disabled, error, reset }: Props) {
  const [digits, setDigits] = useState(Array(LEN).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const prevReset = useRef(reset);
  useEffect(() => {
    if (reset === prevReset.current) return;
    prevReset.current = reset;
    setDigits(Array(LEN).fill(""));
    refs.current[0]?.focus();
  }, [reset]);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = v;
    setDigits(next);
    if (v && i < LEN - 1) refs.current[i + 1]?.focus();
    if (next.join("").length === LEN) onComplete(next.join(""));
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    if (text.length === LEN) { setDigits(text.split("")); onComplete(text); }
    e.preventDefault();
  };

  return (
    <div className="grid grid-cols-6 gap-2 w-full" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className={`w-full h-10 text-center text-lg font-black rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40 cursor-text ${
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
