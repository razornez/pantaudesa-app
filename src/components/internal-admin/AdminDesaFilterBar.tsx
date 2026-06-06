"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { fetchDesaFilterOptions } from "./admin-desa-filter/api";

export interface AdminDesaFilter {
  q: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
}

interface FilterOptions {
  provinsi: string[];
  kabupaten: string[];
  kecamatan: string[];
}

interface Props {
  onChange: (filter: AdminDesaFilter) => void;
  initialFilter?: Partial<AdminDesaFilter>;
  loadOptionsOnMount?: boolean;
}

/**
 * Reusable admin desa filter bar - search + provinsi + kabupaten + kecamatan.
 * Matches the filter UX on the public /desa page but backed by admin APIs.
 * Used in: Data per Desa tab, Versi & Audit tab, Log Aktivitas tab.
 */
export default function AdminDesaFilterBar({
  onChange,
  initialFilter,
  loadOptionsOnMount = true,
}: Props) {
  const [q, setQ] = useState(initialFilter?.q ?? "");
  const [provinsi, setProvinsi] = useState(initialFilter?.provinsi ?? "");
  const [kabupaten, setKabupaten] = useState(initialFilter?.kabupaten ?? "");
  const [kecamatan, setKecamatan] = useState(initialFilter?.kecamatan ?? "");
  const [options, setOptions] = useState<FilterOptions>({
    provinsi: [],
    kabupaten: [],
    kecamatan: [],
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLoadInitialOptionsRef = useRef(false);

  const loadOptions = useCallback((prov: string, kab: string) => {
    fetchDesaFilterOptions({ provinsi: prov, kabupaten: kab })
      .then((data) => setOptions(data))
      .catch(() => {});
  }, []);

  const ensureInitialOptionsLoaded = useCallback(() => {
    if (didLoadInitialOptionsRef.current) return;
    didLoadInitialOptionsRef.current = true;
    loadOptions("", "");
  }, [loadOptions]);

  useEffect(() => {
    if (!loadOptionsOnMount) return;
    ensureInitialOptionsLoaded();
  }, [ensureInitialOptionsLoaded, loadOptionsOnMount]);

  const emit = useCallback(
    (next: AdminDesaFilter) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(next), 300);
    },
    [onChange],
  );

  const handleQ = (value: string) => {
    setQ(value);
    emit({ q: value, provinsi, kabupaten, kecamatan });
  };

  const handleProvinsi = (value: string) => {
    setProvinsi(value);
    setKabupaten("");
    setKecamatan("");
    loadOptions(value, "");
    emit({ q, provinsi: value, kabupaten: "", kecamatan: "" });
  };

  const handleKabupaten = (value: string) => {
    setKabupaten(value);
    setKecamatan("");
    loadOptions(provinsi, value);
    emit({ q, provinsi, kabupaten: value, kecamatan: "" });
  };

  const handleKecamatan = (value: string) => {
    setKecamatan(value);
    emit({ q, provinsi, kabupaten, kecamatan: value });
  };

  const hasFilter = q || provinsi || kabupaten || kecamatan;

  const clearAll = () => {
    setQ("");
    setProvinsi("");
    setKabupaten("");
    setKecamatan("");
    loadOptions("", "");
    onChange({ q: "", provinsi: "", kabupaten: "", kecamatan: "" });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <input
            type="text"
            value={q}
            onChange={(event) => handleQ(event.target.value)}
            placeholder="Cari nama desa, kecamatan, kabupaten..."
            className="field-lux w-full text-sm"
            style={{ paddingLeft: "2.35rem", paddingRight: "2.75rem" }}
          />
          {q ? (
            <button
              type="button"
              onClick={() => handleQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={12} aria-hidden />
            </button>
          ) : null}
        </div>

      <FilterSelect
          value={provinsi}
          onChange={handleProvinsi}
          ariaLabel="Filter provinsi"
          minWidth="min-w-[130px]"
          icon={<SlidersHorizontal size={13} aria-hidden />}
          onFocus={ensureInitialOptionsLoaded}
        >
          <option value="">Semua Provinsi</option>
          {options.provinsi.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={kabupaten}
          onChange={handleKabupaten}
          ariaLabel="Filter kabupaten"
          minWidth="min-w-[150px]"
          onFocus={ensureInitialOptionsLoaded}
        >
          <option value="">Semua Kabupaten</option>
          {options.kabupaten.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={kecamatan}
          onChange={handleKecamatan}
          ariaLabel="Filter kecamatan"
          minWidth="min-w-[140px]"
          onFocus={ensureInitialOptionsLoaded}
        >
          <option value="">Semua Kecamatan</option>
          {options.kecamatan.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </FilterSelect>
      </div>

      {hasFilter ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {provinsi ? (
            <FilterChip label={`Provinsi: ${provinsi}`} onRemove={() => handleProvinsi("")} />
          ) : null}
          {kabupaten ? (
            <FilterChip label={`Kab: ${kabupaten}`} onRemove={() => handleKabupaten("")} />
          ) : null}
          {kecamatan ? (
            <FilterChip label={`Kec: ${kecamatan}`} onRemove={() => handleKecamatan("")} />
          ) : null}
          <button
            type="button"
            onClick={clearAll}
            className="px-1 text-[10.5px] text-slate-400 transition-colors hover:text-rose-600"
          >
            Hapus semua filter x
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  minWidth,
  icon,
  onFocus,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  minWidth: string;
  icon?: React.ReactNode;
  onFocus?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        aria-label={ariaLabel}
        className={`select-lux appearance-none text-sm ${minWidth}`}
        style={{
          paddingLeft: icon ? "2.35rem" : "1rem",
          paddingRight: "1.9rem",
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-medium text-indigo-700"
      style={{ boxShadow: "inset 0 0 0 1px rgba(67,56,202,0.12)" }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-indigo-400 hover:text-indigo-700"
      >
        x
      </button>
    </span>
  );
}
