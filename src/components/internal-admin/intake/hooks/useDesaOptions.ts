/**
 * Hook for Desa Options - search and select desa
 */

import { useCallback, useEffect, useState } from "react";
import type { DesaOption } from "../types";
import { requestDesaOptions } from "../api";
import { formatDesaSearchValue } from "../constants";

export function useDesaOptions() {
  const [desaSearch, setDesaSearch] = useState("");
  const [desaOptions, setDesaOptions] = useState<DesaOption[]>([]);
  const [selectedDesa, setSelectedDesa] = useState<DesaOption | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await requestDesaOptions(desaSearch);
        if ("error" in payload) {
          throw new Error(payload.error || "Gagal memuat daftar desa.");
        }

        if (!cancelled) {
          setDesaOptions(payload.desa);
          // Keep selectedDesa in sync if still in new options
          if (selectedDesa) {
            const nextSelection = payload.desa.find((item) => item.id === selectedDesa.id);
            if (nextSelection) {
              setSelectedDesa(nextSelection);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat daftar desa.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [desaSearch, selectedDesa]);

  const selectDesa = useCallback((option: DesaOption) => {
    setSelectedDesa(option);
    setDesaSearch(formatDesaSearchValue(option));
    setIsPickerOpen(false);
  }, []);

  const clearSelectedDesa = useCallback(() => {
    setSelectedDesa(null);
    setDesaSearch("");
    setIsPickerOpen(true);
  }, []);

  const openPicker = useCallback(() => {
    setIsPickerOpen(true);
  }, []);

  return {
    // State
    desaSearch,
    setDesaSearch,
    desaOptions,
    selectedDesa,
    isPickerOpen,
    loading,
    error,
    
    // Computed
    selectedDesaId: selectedDesa?.id ?? null,
    
    // Actions
    selectDesa,
    clearSelectedDesa,
    openPicker,
  };
}
