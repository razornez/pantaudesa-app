"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminDesaFilterBar, {
  type AdminDesaFilter,
} from "@/components/internal-admin/AdminDesaFilterBar";
import type { DesaRow, TemplateSummary } from "./types";
import { fetchDesaData, fetchTemplateWorkspace } from "./api";
import { ErrorNotice } from "./shared";
import { DesaDataResults } from "./DesaDataResults";

export function DesaDataTab() {
  const [desa, setDesa] = useState<DesaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<AdminDesaFilter>({
    q: "",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateReloadToken, setTemplateReloadToken] = useState(0);
  const didLoadInitialRef = useRef(false);
  const latestInitialRequestRef = useRef(0);
  const templateLoadPromiseRef = useRef<Promise<void> | null>(null);

  const fetchData = useCallback((nextFilter: AdminDesaFilter, nextPage: number) => {
    setLoading(true);
    fetchDesaData(nextFilter, nextPage)
      .then((payload) => {
        setDesa(payload.desa ?? []);
        setTotal(payload.total ?? 0);
        setError(null);
        setLoading(false);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat data desa.");
        setLoading(false);
      });
  }, []);

  const ensureTemplatesLoaded = useCallback(async (force = false) => {
    if (!force && templates.length > 0) return;
    if (templateLoadPromiseRef.current) {
      await templateLoadPromiseRef.current;
      if (!force) return;
    }

    setTemplatesLoading(true);
    const loadPromise = fetchTemplateWorkspace()
      .then((payload) => {
        setTemplates(payload.templates ?? []);
      })
      .catch(() => {})
      .finally(() => {
        templateLoadPromiseRef.current = null;
        setTemplatesLoading(false);
      });

    templateLoadPromiseRef.current = loadPromise;
    await loadPromise;
  }, [templates.length]);

  useEffect(() => {
    if (didLoadInitialRef.current) return;
    didLoadInitialRef.current = true;
    const requestId = latestInitialRequestRef.current + 1;
    latestInitialRequestRef.current = requestId;

    fetchDesaData({ q: "", provinsi: "", kabupaten: "", kecamatan: "" }, 1)
      .then((payload) => {
        if (latestInitialRequestRef.current !== requestId) return;
        setDesa(payload.desa ?? []);
        setTotal(payload.total ?? 0);
        setError(null);
        setLoading(false);
      })
      .catch((loadError) => {
        if (latestInitialRequestRef.current !== requestId) return;
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat data desa.");
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (nextFilter: AdminDesaFilter) => {
    setFilter(nextFilter);
    setPage(1);
    fetchData(nextFilter, 1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    fetchData(filter, nextPage);
  };

  const handleTemplateMutation = () => {
    setTemplateReloadToken((token) => token + 1);
    fetchData(filter, page);
    void ensureTemplatesLoaded(true);
  };

  if (error) return <ErrorNotice message={error} />;

  return (
    <div className="space-y-4">
      <AdminDesaFilterBar onChange={handleFilterChange} loadOptionsOnMount={false} />
      <DesaDataResults
        desa={desa}
        filter={filter}
        page={page}
        total={total}
        loading={loading}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onPageChange={handlePageChange}
        templateOptions={templates}
        templatesLoading={templatesLoading}
        templateReloadToken={templateReloadToken}
        onTemplateSwitchOpen={ensureTemplatesLoaded}
        onTemplateMutation={handleTemplateMutation}
      />
    </div>
  );
}
