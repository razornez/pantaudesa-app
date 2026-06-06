import { useCallback, useEffect, useState } from "react";
import { requestVersionHistory } from "../api";
import type { DesaVersionHistoryResponse } from "../types";

function readPipelineErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function useVersionHistory(selectedDesaId: string | null) {
  const [versionHistory, setVersionHistory] =
    useState<DesaVersionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setVersionHistory(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!selectedDesaId) {
      return;
    }

    let cancelled = false;

    const loadVersionHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await requestVersionHistory(selectedDesaId);
        if ("error" in payload) {
          throw new Error(payload.error || "Gagal memuat riwayat versi desa.");
        }

        if (!cancelled) {
          setVersionHistory(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(readPipelineErrorMessage(err, "Gagal memuat riwayat versi desa."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadVersionHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedDesaId]);

  return {
    versionHistory,
    loading,
    error,
    reset,
  };
}
