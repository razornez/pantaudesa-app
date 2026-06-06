"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { fetchAdminClaimProfile } from "@/components/profil/admin-claim/api";
import type {
  AdminClaimProfileData,
  AdminClaimProfileSummaryData,
} from "@/lib/data/admin-claim-read";
import {
  canReuseAdminClaimProfile,
  mergeAdminClaimProfileSnapshots,
  type AdminClaimProfileDetail,
  type AdminClaimProfileSnapshot,
} from "@/lib/admin-claim/profile-cache";

interface AdminClaimProfileContextValue {
  data: AdminClaimProfileSnapshot | null;
  loading: boolean;
  loadError: boolean;
  hydrate: (incoming: AdminClaimProfileSnapshot | null | undefined) => void;
  ensure: (detail: AdminClaimProfileDetail) => Promise<AdminClaimProfileSnapshot | null>;
  refresh: (detail: AdminClaimProfileDetail) => Promise<AdminClaimProfileSnapshot | null>;
}

const AdminClaimProfileContext = createContext<AdminClaimProfileContextValue | null>(null);

export function AdminClaimProfileProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AdminClaimProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const dataRef = useRef<AdminClaimProfileSnapshot | null>(null);
  const inflightRef = useRef<Promise<AdminClaimProfileSnapshot | null> | null>(null);
  const inflightDetailRef = useRef<AdminClaimProfileDetail | null>(null);

  const hydrate = useCallback((incoming: AdminClaimProfileSnapshot | null | undefined) => {
    if (!incoming) return;
    setData((current) => {
      const next = mergeAdminClaimProfileSnapshots(current, incoming);
      dataRef.current = next;
      return next;
    });
    setLoadError(false);
  }, []);

  const loadProfile = useCallback(async (detail: AdminClaimProfileDetail, force = false) => {
    const current = dataRef.current;
    if (!force && canReuseAdminClaimProfile(current, detail)) {
      return current;
    }

    const inflight = inflightRef.current;
    if (inflight) {
      const inflightDetail = inflightDetailRef.current;
      if (inflightDetail === "full" || inflightDetail === detail) {
        return inflight;
      }
    }

    setLoading(true);
    setLoadError(false);

    const request = fetchAdminClaimProfile({ detail })
      .then((payload) => {
        setData((currentValue) => {
          const next = mergeAdminClaimProfileSnapshots(currentValue, payload);
          dataRef.current = next;
          return next;
        });
        return dataRef.current;
      })
      .catch((error) => {
        setLoadError(true);
        throw error;
      })
      .finally(() => {
        if (inflightRef.current === request) {
          inflightRef.current = null;
          inflightDetailRef.current = null;
          setLoading(false);
        }
      });

    inflightRef.current = request;
    inflightDetailRef.current = detail;
    return request;
  }, []);

  const value = useMemo<AdminClaimProfileContextValue>(() => ({
    data,
    loading,
    loadError,
    hydrate,
    ensure: (detail) => loadProfile(detail, false),
    refresh: (detail) => loadProfile(detail, true),
  }), [data, hydrate, loadProfile, loadError, loading]);

  return (
    <AdminClaimProfileContext.Provider value={value}>
      {children}
    </AdminClaimProfileContext.Provider>
  );
}

export function useAdminClaimProfileContext() {
  const value = useContext(AdminClaimProfileContext);
  if (!value) {
    throw new Error("useAdminClaimProfileContext must be used inside AdminClaimProfileProvider");
  }
  return value;
}

export type AdminClaimProfileInitialData =
  | AdminClaimProfileSummaryData
  | AdminClaimProfileData;
