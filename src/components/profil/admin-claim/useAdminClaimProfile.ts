"use client";

import { useCallback, useEffect, useMemo } from "react";
import type {
  AdminClaimProfileData,
  AdminClaimProfileSummaryData,
} from "@/lib/data/admin-claim-read";
import {
  canReuseAdminClaimProfile,
  isFullAdminClaimProfile,
  type AdminClaimProfileDetail,
  type AdminClaimProfileSnapshot,
} from "@/lib/admin-claim/profile-cache";
import {
  getSelectedDesa,
  isDemoSession,
} from "@/components/profil/admin-claim/adminClaimCopy";
import { useAdminClaimProfileContext } from "@/components/profil/admin-claim/AdminClaimProfileProvider";

type DetailToData<T extends AdminClaimProfileDetail> = T extends "full"
  ? AdminClaimProfileData
  : AdminClaimProfileSummaryData;

export function useAdminClaimProfile<T extends AdminClaimProfileDetail = "summary">({
  requiredDetail = "summary" as T,
  initialData = null,
}: {
  requiredDetail?: T;
  initialData?: DetailToData<T> | null;
} = {}) {
  const store = useAdminClaimProfileContext();

  useEffect(() => {
    if (initialData) {
      store.hydrate(initialData);
    }
  }, [initialData, store]);

  useEffect(() => {
    if (initialData && canReuseAdminClaimProfile(initialData, requiredDetail)) {
      return;
    }

    void store.ensure(requiredDetail).catch(() => {});
  }, [initialData, requiredDetail, store]);

  const data = useMemo(() => {
    const current = store.data;
    if (!canReuseAdminClaimProfile(current, requiredDetail)) {
      return null;
    }
    return current as DetailToData<T>;
  }, [requiredDetail, store.data]);

  const fullData = isFullAdminClaimProfile(data as AdminClaimProfileSnapshot | null)
    ? data as AdminClaimProfileData
    : null;
  const defaultDesaId = fullData?.selectedDesaId ?? fullData?.desaOptions?.[0]?.id ?? null;
  const defaultDesa = useMemo(
    () => getSelectedDesa(fullData?.desaOptions ?? [], defaultDesaId),
    [fullData?.desaOptions, defaultDesaId],
  );

  const refresh = useCallback(async () => {
    await store.refresh(requiredDetail);
  }, [requiredDetail, store]);

  return {
    data,
    loading: !data && store.loading,
    loadError: store.loadError,
    defaultDesaId,
    defaultDesa,
    isDemoAccount: isDemoSession(data as AdminClaimProfileSnapshot | null),
    refresh,
  };
}
