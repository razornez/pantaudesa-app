import { useCallback, useEffect, useState } from "react";
import { requestIntakeHistory } from "../api";
import type { IntakeHistoryResponse } from "../types";

function readPipelineErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function useIntakeHistory() {
  const [history, setHistory] = useState<IntakeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await requestIntakeHistory();
      if ("error" in payload) {
        throw new Error(payload.error || "Gagal memuat riwayat intake.");
      }
      setHistory(payload);
    } catch (err) {
      setError(readPipelineErrorMessage(err, "Gagal memuat riwayat intake."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialHistory = async () => {
      try {
        const payload = await requestIntakeHistory();
        if ("error" in payload) {
          throw new Error(payload.error || "Gagal memuat riwayat intake.");
        }

        if (!cancelled) {
          setHistory(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(readPipelineErrorMessage(err, "Gagal memuat riwayat intake."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    refetch: fetchHistory,
  };
}
