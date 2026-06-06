/**
 * Hook for Intake Pipeline - runs the intake process
 */

import { useCallback, useState } from "react";
import type {
  PipelineError,
  PipelineResult,
  SubmitReviewSuccess,
  IntakeMode,
} from "../types";
import {
  requestIntakePipeline,
  requestSubmitReview,
  requestSubmitSourceReview,
  type IntakeSourceSubmitParams,
} from "../api";

interface UseIntakePipelineOptions {
  onSuccess?: (result: PipelineResult) => void;
}

export function useIntakePipeline(options: UseIntakePipelineOptions = {}) {
  const onSuccess = options.onSuccess;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PipelineError | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);

  const runPipeline = useCallback(
    async (params: {
      mode: IntakeMode;
      selectedFile: File | null;
      textValue: string;
      desaIdValue: string;
      useAiMapping: boolean;
    }) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const payload = await requestIntakePipeline(params);
        if ("error" in payload) {
          setError(payload);
          return null;
        }

        const data = payload;
        setResult(data);
        onSuccess?.(data);
        return data;
      } catch {
        setError({ error: "Koneksi bermasalah. Coba lagi." });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const submitToReview = useCallback(
    async (params: {
      mode: IntakeMode;
      selectedFile: File | null;
      textValue: string;
      desaIdValue: string;
      useAiMapping: boolean;
      reviewTitle: string;
    }): Promise<SubmitReviewSuccess | null> => {
      if (!params.textValue.trim() && !params.selectedFile) {
        setError({ error: "Tidak ada input yang dipilih." });
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = await requestSubmitReview(params);
        if ("error" in payload) {
          setError(payload);
          return null;
        }

        return payload;
      } catch {
        setError({ error: "Koneksi bermasalah. Coba lagi." });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const submitSourceReview = useCallback(
    async (params: IntakeSourceSubmitParams): Promise<SubmitReviewSuccess | null> => {
      setLoading(true);
      setError(null);

      try {
        const payload = await requestSubmitSourceReview(params);
        if ("error" in payload) {
          setError(payload);
          return null;
        }

        return payload;
      } catch {
        setError({ error: "Koneksi bermasalah. Coba lagi." });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    result,
    runPipeline,
    submitToReview,
    submitSourceReview,
    reset,
  };
}
