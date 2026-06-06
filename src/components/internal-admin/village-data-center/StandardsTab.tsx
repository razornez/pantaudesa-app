"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookTemplate,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CopyPlus,
  GripVertical,
  Layers3,
  LayoutTemplate,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  createTemplateWorkspace,
  deleteTemplateWorkspace,
  fetchTemplateWorkspace,
  saveTemplateWorkspaceComponents,
  updateTemplateWorkspaceMeta,
} from "./api";
import { renderTemplateComponentPreview } from "@/components/desa/public-template-preview-registry";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import type {
  TemplateCatalogComponent,
  TemplateDetail,
  TemplateEditorComponent,
  TemplateSummary,
  TemplateWorkspaceData,
} from "./types";
import { EmptyState, ErrorNotice, SkeletonCards, StatPill } from "./shared";

const EMPTY_TEMPLATE_COMPONENTS: TemplateCatalogComponent[] = [];

type MobileWorkspaceStep = "template" | "catalog" | "preview";

type DragPayload =
  | {
      source: "catalog";
      componentKey: string;
    }
  | {
      source: "canvas";
      componentKey: string;
    };

function moveKeyToIndex(keys: string[], componentKey: string, index: number) {
  const filtered = keys.filter((key) => key !== componentKey);
  const next = [...filtered];
  const targetIndex = Math.max(0, Math.min(index, next.length));
  next.splice(targetIndex, 0, componentKey);
  return next;
}

export function uniqueTemplateCanvasKeys(keys: string[]) {
  const uniqueKeys: string[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueKeys.push(key);
  }

  return uniqueKeys;
}

function moveKeyByOffset(keys: string[], componentKey: string, offset: -1 | 1) {
  const currentIndex = keys.indexOf(componentKey);
  if (currentIndex === -1) return keys;
  const nextIndex = currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= keys.length) return keys;
  return moveKeyToIndex(keys, componentKey, nextIndex);
}

function syncEditorFromTemplate(template: TemplateDetail | null) {
  return {
    name: template?.name ?? "",
    description: template?.description ?? "",
    componentKeys: uniqueTemplateCanvasKeys(
      template?.components.map((component) => component.componentKey) ?? [],
    ),
  };
}

function renderTemplatePreview(
  component: Pick<
    TemplateCatalogComponent,
    | "componentKey"
    | "label"
    | "description"
    | "fields"
    | "highlightFieldKeys"
    | "previewVariant"
  >,
) {
  return renderTemplateComponentPreview({
    componentKey: component.componentKey,
    label: component.label,
    description: component.description,
    fields: component.fields,
    highlightFieldKeys: component.highlightFieldKeys,
  });
}

function TemplateCatalogCard({
  component,
  onAdd,
}: {
  component: TemplateCatalogComponent;
  onAdd: (componentKey: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        const payload: DragPayload = {
          source: "catalog",
          componentKey: component.componentKey,
        };
        event.dataTransfer.setData("application/json", JSON.stringify(payload));
        event.dataTransfer.effectAllowed = "copyMove";
      }}
      className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-3"
      style={{ boxShadow: "0 10px 28px -22px rgba(15,23,42,0.28)" }}
    >
      <div className="flex items-start justify-between gap-3 px-1 pt-1">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Slot {component.detailSlot.replaceAll("_", " ")}
          </p>
          <h3 className="mt-1 text-[12px] font-semibold text-slate-900">
            {component.label}
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            {component.description}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-semibold text-indigo-700">
          {component.fieldCount} field
        </span>
      </div>

      {renderTemplatePreview(component)}

      <button
        type="button"
        onClick={() => onAdd(component.componentKey)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
      >
        <Plus size={12} aria-hidden />
        Tambah ke canvas
      </button>
    </div>
  );
}

function TemplateCanvasCard({
  component,
  index,
  onRemove,
  onDropAt,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  component: TemplateEditorComponent;
  index: number;
  onRemove: (componentKey: string) => void;
  onDropAt: (payload: DragPayload, index: number) => void;
  onMoveUp: (componentKey: string) => void;
  onMoveDown: (componentKey: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        const payload: DragPayload = {
          source: "canvas",
          componentKey: component.componentKey,
        };
        event.dataTransfer.setData("application/json", JSON.stringify(payload));
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
          onDropAt(JSON.parse(raw) as DragPayload, index);
        } catch {}
      }}
      className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-4"
      style={{
        boxShadow:
          "0 14px 30px -24px rgba(15,23,42,0.3), inset 0 0 0 1px rgba(15,23,42,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
          <GripVertical size={15} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Slot {component.detailSlot.replaceAll("_", " ")}
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-700">
              Urutan {index + 1}
            </span>
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">
                {component.label}
              </h3>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                {component.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => onMoveUp(component.componentKey)}
                  disabled={!canMoveUp}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
                  aria-label={`Naikkan ${component.label}`}
                >
                  <ChevronUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(component.componentKey)}
                  disabled={!canMoveDown}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
                  aria-label={`Turunkan ${component.label}`}
                >
                  <ChevronDown size={14} aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(component.componentKey)}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                style={{ boxShadow: "inset 0 0 0 1px rgba(225,29,72,0.10)" }}
              >
                <Trash2 size={12} aria-hidden />
                Lepas
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderTemplatePreview(component)}
    </div>
  );
}

export function StandardsTab() {
  const [workspace, setWorkspace] = useState<TemplateWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [canvasKeys, setCanvasKeys] = useState<string[]>([]);
  const [mobileStep, setMobileStep] = useState<MobileWorkspaceStep>("template");
  const [templateLoadingId, setTemplateLoadingId] = useState<string | null>(null);
  const [activeMutation, setActiveMutation] = useState<null | "create" | "save" | "delete">(null);
  const { toasts, toast, removeToast } = useToast();
  const topPreviewScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomPreviewScrollRef = useRef<HTMLDivElement | null>(null);
  const syncingScrollRef = useRef<"top" | "bottom" | null>(null);

  const reloadWorkspace = async (templateId?: string | null) => {
    setLoading(true);
    setTemplateLoadingId(templateId ?? null);
    setError(null);
    try {
      const payload = await fetchTemplateWorkspace(templateId);
      setWorkspace(payload);
      setSelectedTemplateId(payload.selectedTemplateId);
      const editor = syncEditorFromTemplate(payload.selectedTemplate);
      setDraftName(editor.name);
      setDraftDescription(editor.description);
      setCanvasKeys(editor.componentKeys);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat workspace template.",
      );
    } finally {
      setLoading(false);
      setTemplateLoadingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void fetchTemplateWorkspace()
      .then((payload) => {
        if (cancelled) return;
        setWorkspace(payload);
        setSelectedTemplateId(payload.selectedTemplateId);
        const editor = syncEditorFromTemplate(payload.selectedTemplate);
        setDraftName(editor.name);
        setDraftDescription(editor.description);
        setCanvasKeys(editor.componentKeys);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat workspace template.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTemplate = workspace?.selectedTemplate ?? null;
  const availableComponents = workspace?.availableComponents ?? EMPTY_TEMPLATE_COMPONENTS;
  const readOnly = Boolean(workspace?.readOnly);
  const readOnlyReason =
    workspace?.readOnlyReason ??
    "Workspace template sedang read-only. Pulihkan koneksi database untuk menyimpan perubahan.";
  const componentMap = useMemo(
    () =>
      new Map(
        availableComponents.map((component) => [component.componentKey, component]),
      ),
    [availableComponents],
  );

  const canvasComponents = useMemo(() => {
    return uniqueTemplateCanvasKeys(canvasKeys)
      .map((key) => {
        const liveComponent =
          selectedTemplate?.components.find((component) => component.componentKey === key) ??
          null;
        if (liveComponent) return liveComponent;
        const catalogComponent = componentMap.get(key);
        if (!catalogComponent) return null;
        return {
          componentId: null,
          ...catalogComponent,
        } satisfies TemplateEditorComponent;
      })
      .filter((component): component is TemplateEditorComponent => Boolean(component));
  }, [canvasKeys, componentMap, selectedTemplate]);

  const normalizedCanvasKeys = useMemo(
    () => uniqueTemplateCanvasKeys(canvasKeys),
    [canvasKeys],
  );
  const canvasKeySet = useMemo(() => new Set(normalizedCanvasKeys), [normalizedCanvasKeys]);
  const unusedCatalogComponents = availableComponents.filter(
    (component) => !canvasKeySet.has(component.componentKey),
  );

  const dirty =
    draftName.trim() !== (selectedTemplate?.name ?? "") ||
    draftDescription !== (selectedTemplate?.description ?? "") ||
    normalizedCanvasKeys.join("|") !==
      (selectedTemplate?.components.map((component) => component.componentKey).join("|") ?? "");

  const applyTemplateSelection = (template: TemplateSummary) => {
    if (templateLoadingId || activeMutation) return;
    setSelectedTemplateId(template.id);
    void reloadWorkspace(template.id);
  };

  const syncPreviewScroll = (source: "top" | "bottom") => {
    if (syncingScrollRef.current && syncingScrollRef.current !== source) {
      return;
    }

    const sourceElement =
      source === "top" ? topPreviewScrollRef.current : bottomPreviewScrollRef.current;
    const targetElement =
      source === "top" ? bottomPreviewScrollRef.current : topPreviewScrollRef.current;

    if (!sourceElement || !targetElement) return;

    syncingScrollRef.current = source;
    targetElement.scrollLeft = sourceElement.scrollLeft;
    requestAnimationFrame(() => {
      syncingScrollRef.current = null;
    });
  };

  const handleAddComponent = (componentKey: string) => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    setCanvasKeys((current) =>
      current.includes(componentKey) ? current : [...current, componentKey],
    );
  };

  const handleRemoveComponent = (componentKey: string) => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    setCanvasKeys((current) => current.filter((key) => key !== componentKey));
  };

  const handleDropOnCanvas = (payload: DragPayload, index: number) => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    if (payload.source === "catalog" && !canvasKeys.includes(payload.componentKey)) {
      setCanvasKeys((current) => moveKeyToIndex(current, payload.componentKey, index));
      return;
    }

    setCanvasKeys((current) => moveKeyToIndex(current, payload.componentKey, index));
  };

  const handleDropAtCanvasEnd = (payload: DragPayload) => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    if (payload.source === "catalog") {
      setCanvasKeys((current) =>
        current.includes(payload.componentKey)
          ? moveKeyToIndex(current, payload.componentKey, current.length)
          : [...current, payload.componentKey],
      );
      return;
    }

    setCanvasKeys((current) => moveKeyToIndex(current, payload.componentKey, current.length));
  };

  const handleMoveComponentUp = (componentKey: string) => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    setCanvasKeys((current) => moveKeyByOffset(current, componentKey, -1));
  };

  const handleMoveComponentDown = (componentKey: string) => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    setCanvasKeys((current) => moveKeyByOffset(current, componentKey, 1));
  };

  const handleCreateTemplate = () => {
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    const seedNumber = (workspace?.templates.length ?? 0) + 1;
    setActiveMutation("create");
    setError(null);
    void createTemplateWorkspace({
      name: `Template baru ${seedNumber}`,
      description: "",
    })
      .then((result) => {
        toast(result.message, "success");
        return reloadWorkspace(result.templateId);
      })
      .catch((mutationError) => {
        toast(
          mutationError instanceof Error
            ? mutationError.message
            : "Gagal membuat template baru.",
          "error",
        );
      })
      .finally(() => {
        setActiveMutation(null);
      });
  };

  const handleSave = () => {
    if (!selectedTemplateId) return;
    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }
    setActiveMutation("save");
    setError(null);
    const componentKeysToSave = uniqueTemplateCanvasKeys(canvasKeys);
    if (componentKeysToSave.length !== canvasKeys.length) {
      setCanvasKeys(componentKeysToSave);
    }
    void updateTemplateWorkspaceMeta({
      templateId: selectedTemplateId,
      name: draftName,
      description: draftDescription,
    })
      .then((metaResult) =>
        saveTemplateWorkspaceComponents({
          templateId: selectedTemplateId,
          componentKeys: componentKeysToSave,
        }).then((componentResult) => ({
          metaResult,
          componentResult,
        })),
      )
      .then(async ({ metaResult, componentResult }) => {
        await reloadWorkspace(selectedTemplateId);
        toast(componentResult.message || metaResult.message || "Template berhasil disimpan.", "success");
      })
      .catch((mutationError) => {
        toast(
          mutationError instanceof Error
            ? mutationError.message
            : "Gagal menyimpan template.",
          "error",
        );
      })
      .finally(() => {
        setActiveMutation(null);
      });
  };

  const handleDelete = () => {
    if (!selectedTemplateId || !selectedTemplate) {
      return;
    }

    if (readOnly) {
      toast(readOnlyReason, "warning");
      return;
    }

    if (selectedTemplate.deleteBlockedReason) {
      toast(selectedTemplate.deleteBlockedReason, "warning");
      return;
    }

    const confirmed = window.confirm(
      `Hapus template "${selectedTemplate.name}" secara permanen?`,
    );
    if (!confirmed) return;

    setActiveMutation("delete");
    setError(null);
    void deleteTemplateWorkspace(selectedTemplateId)
      .then((result) => {
        toast(result.message, "success");
        return reloadWorkspace(null);
      })
      .catch((mutationError) => {
        toast(
          mutationError instanceof Error
            ? mutationError.message
            : "Gagal menghapus template.",
          "error",
        );
      })
      .finally(() => {
        setActiveMutation(null);
      });
  };

  if (loading && !workspace) return <SkeletonCards count={3} height="h-36" />;
  if (error && !workspace) return <ErrorNotice message={error} />;

  const templateSelectionLoading = Boolean(templateLoadingId);
  const templateSelectionLoadingCard = (
    <section
      className="rounded-3xl bg-white p-4 sm:p-5"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/70 px-4 py-3 text-indigo-800">
        <Loader2 size={15} className="animate-spin" aria-hidden />
        <div>
          <p className="text-[12px] font-semibold">Memuat komponen template...</p>
          <p className="mt-0.5 text-[11px] text-indigo-700/75">
            Editor sedang mengambil urutan, metadata, dan canvas terbaru.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
      </div>
    </section>
  );

  const templateListPanel = (
    <aside
      className="rounded-3xl bg-white p-4 sm:p-5"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">Daftar template</p>
          <p className="text-[11px] leading-relaxed text-slate-500 sm:text-[12px]">
            Pilih template untuk diedit atau buat canvas baru dari nol.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateTemplate}
          disabled={Boolean(activeMutation) || Boolean(templateLoadingId) || readOnly}
          title={readOnly ? readOnlyReason : "Buat template"}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E1B4B] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#15123a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {activeMutation === "create" ? (
            <Loader2 size={12} className="animate-spin" aria-hidden />
          ) : (
            <CopyPlus size={12} aria-hidden />
          )}
          {activeMutation === "create" ? "Membuat..." : "Buat"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {(workspace?.templates ?? []).map((template) => {
          const active = template.id === selectedTemplateId;
          const templateIsLoading = templateLoadingId === template.id;
          const blockedReason =
            template.id === selectedTemplate?.id
              ? selectedTemplate.deleteBlockedReason
              : template.assignedDesaCount > 0
                ? `Dipakai ${template.assignedDesaCount} desa`
                : null;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplateSelection(template)}
              disabled={Boolean(activeMutation) || Boolean(templateLoadingId)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition-colors ${
                active
                  ? "bg-indigo-50 text-slate-900"
                  : "bg-slate-50/70 text-slate-700 hover:bg-slate-100"
              } disabled:cursor-wait disabled:opacity-70`}
              style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold sm:text-[13px]">
                    {template.name}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-mono text-slate-400">
                    {template.key}
                  </p>
                </div>
                {templateIsLoading ? (
                  <Loader2 size={14} className="animate-spin text-indigo-600" aria-hidden />
                ) : (
                  <ChevronRight
                    size={14}
                    className={active ? "text-indigo-600" : "text-slate-400"}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  {template.componentCount} komponen
                </span>
                <span className="inline-flex rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  v{template.version}
                </span>
                {blockedReason ? (
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                    {blockedReason}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}

        {workspace?.templates.length === 0 ? (
          <EmptyState
            icon={<BookTemplate size={18} />}
            title="Belum ada template"
            note="Mulai dari canvas kosong, lalu tarik komponen resmi ke area editor."
          />
        ) : null}
      </div>
    </aside>
  );

  const templateEditorHeader = templateSelectionLoading ? (
    templateSelectionLoadingCard
  ) : selectedTemplate ? (
    <div className="space-y-4 rounded-3xl bg-white p-4 sm:p-5"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
      }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="block">
              <span className="eyebrow mb-1.5 block">Nama template</span>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                readOnly={readOnly}
                className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-900 outline-none transition-colors focus:bg-white"
                style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
              />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Ringkasan template</span>
              <input
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                readOnly={readOnly}
                className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-900 outline-none transition-colors focus:bg-white"
                style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
                placeholder="Misalnya: Template umum untuk detail desa publik."
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {selectedTemplate.key}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              v{selectedTemplate.version}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {selectedTemplate.assignedDesaCount} desa aktif
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              catalog {workspace?.catalogSource ?? "manifest"}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={Boolean(activeMutation) || readOnly}
            title={readOnly ? readOnlyReason : selectedTemplate.deleteBlockedReason ?? "Hapus template"}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            style={{ boxShadow: "inset 0 0 0 1px rgba(225,29,72,0.10)" }}
          >
            {activeMutation === "delete" ? (
              <Loader2 size={12} className="animate-spin" aria-hidden />
            ) : (
              <Trash2 size={12} aria-hidden />
            )}
            {activeMutation === "delete" ? "Menghapus..." : "Hapus"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={Boolean(activeMutation) || !dirty || readOnly}
            title={readOnly ? readOnlyReason : "Simpan template"}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1E1B4B] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#15123a] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {activeMutation === "save" ? (
              <Loader2 size={12} className="animate-spin" aria-hidden />
            ) : (
              <Save size={12} aria-hidden />
            )}
            {activeMutation === "save" ? "Menyimpan..." : "Simpan template"}
          </button>
        </div>
      </div>

      {selectedTemplate.deleteBlockedReason ? (
        <div
          className="rounded-2xl bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800"
          style={{ boxShadow: "inset 0 0 0 1px rgba(217,119,6,0.14)" }}
        >
          {selectedTemplate.deleteBlockedReason}
        </div>
      ) : null}

      {readOnly ? (
        <div
          className="rounded-2xl bg-sky-50 px-4 py-3 text-[12px] leading-relaxed text-sky-800"
          style={{ boxShadow: "inset 0 0 0 1px rgba(14,165,233,0.14)" }}
        >
          {readOnlyReason} Preview tetap memakai manifest lokal agar urutan dan bentuk komponen bisa dicek.
        </div>
      ) : null}
    </div>
  ) : (
    <section
      className="rounded-3xl bg-white p-4 sm:p-5"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
      }}
    >
      <EmptyState
        icon={<AlertCircle size={18} />}
        title="Template belum dipilih"
        note="Pilih template dari panel daftar untuk mulai mengatur metadata, komponen, dan urutan publik."
      />
    </section>
  );

  const catalogPanel = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers3 size={14} className="text-indigo-600" aria-hidden />
        <div>
          <p className="text-[12px] font-semibold text-slate-900">Komponen siap pakai</p>
          <p className="text-[11px] text-slate-500">Tarik ke canvas atau klik tambah.</p>
        </div>
      </div>
      <div className="pb-2 sm:overflow-x-auto">
        <div className="grid gap-3 sm:min-w-[340px]">
          {unusedCatalogComponents.map((component) => (
            <TemplateCatalogCard
              key={component.componentKey}
              component={component}
              onAdd={handleAddComponent}
            />
          ))}
          {unusedCatalogComponents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-[12px] leading-relaxed text-slate-500">
              Semua komponen catalog sudah masuk ke canvas template ini.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const previewPanel = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-slate-900">
            Preview urutan komponen publik
          </p>
          <p className="text-[11px] text-slate-500">
            Canvas ini menentukan urutan tampil di halaman detail desa.
          </p>
        </div>
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
          {canvasComponents.length} komponen
        </span>
      </div>

      <div
        ref={topPreviewScrollRef}
        onScroll={() => syncPreviewScroll("top")}
        className="hidden overflow-x-auto sm:block"
      >
        <div className="h-3 w-full rounded-full bg-slate-100/90 sm:min-w-[720px]" />
      </div>

      <div
        ref={bottomPreviewScrollRef}
        onScroll={() => syncPreviewScroll("bottom")}
        className="pb-3 sm:overflow-x-auto"
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const raw = event.dataTransfer.getData("application/json");
            if (!raw) return;
            try {
              handleDropAtCanvasEnd(JSON.parse(raw) as DragPayload);
            } catch {}
          }}
          className="w-full space-y-3 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-2.5 sm:min-w-[720px] sm:rounded-[28px] sm:p-4"
        >
          {templateSelectionLoading ? (
            <div className="space-y-3 rounded-[22px] bg-white p-4 sm:rounded-[24px]">
              <div className="flex items-center gap-2 text-indigo-700">
                <Loader2 size={14} className="animate-spin" aria-hidden />
                <p className="text-[12px] font-semibold">Memuat preview urutan...</p>
              </div>
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-[22px] border border-slate-100 bg-slate-50"
                />
              ))}
            </div>
          ) : canvasComponents.length > 0 ? (
            canvasComponents.map((component, index) => (
              <TemplateCanvasCard
                key={`${component.componentKey}-${index}`}
                component={component}
                index={index}
                onRemove={handleRemoveComponent}
                onDropAt={handleDropOnCanvas}
                onMoveUp={handleMoveComponentUp}
                onMoveDown={handleMoveComponentDown}
                canMoveUp={index > 0}
                canMoveDown={index < canvasComponents.length - 1}
              />
            ))
          ) : (
            <div className="rounded-[22px] bg-white px-4 py-10 text-center sm:rounded-[24px] sm:px-5 sm:py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                <LayoutTemplate size={22} aria-hidden />
              </div>
              <p className="mt-4 text-[14px] font-semibold text-slate-900">Canvas masih kosong</p>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                Tarik komponen dari catalog kiri untuk mulai merakit urutan detail desa publik.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <section
        className="rounded-3xl bg-white p-4 sm:p-6"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-indigo-600 mb-1.5">Kelola template</p>
            <h2 className="text-[17px] font-semibold leading-tight text-slate-900 sm:text-[18px]">
              Canvas komponen untuk detail desa publik
            </h2>
            <p className="mt-1 max-w-2xl text-[11px] text-slate-500 sm:text-[12px]">
              Susun komponen publik dari catalog resmi. Urutan di sini akan dipakai
              oleh halaman detail publik, panel per-desa, dan intake field resolver.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatPill
              color="emerald"
              count={workspace?.templates.length ?? 0}
              label="template"
            />
            <StatPill
              color="slate"
              count={workspace?.availableComponents.length ?? 0}
              label="komponen catalog"
            />
            <StatPill
              color="amber"
              count={selectedTemplate?.components.length ?? 0}
              label="komponen aktif"
            />
          </div>
        </div>
      </section>

      {error ? <ErrorNotice message={error} /> : null}

      <div className="space-y-4 sm:hidden">
        <div
          className="rounded-3xl bg-white p-2"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
          }}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {([
              ["template", "Template"],
              ["catalog", "Catalog"],
              ["preview", "Preview"],
            ] as const).map(([stepKey, label]) => {
              const active = mobileStep === stepKey;
              return (
                <button
                  key={stepKey}
                  type="button"
                  onClick={() => setMobileStep(stepKey)}
                  className={`rounded-2xl px-3 py-2.5 text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-[#1E1B4B] text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {mobileStep === "template" ? (
          <div className="space-y-4">
            {templateListPanel}
            {templateEditorHeader}
          </div>
        ) : null}

        {mobileStep === "catalog" ? (
          <section
            className="rounded-3xl bg-white p-4"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
            }}
          >
            {catalogPanel}
          </section>
        ) : null}

        {mobileStep === "preview" ? (
          <section
            className="rounded-3xl bg-white p-4"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
            }}
          >
            {previewPanel}
          </section>
        ) : null}
      </div>

      <div className="hidden gap-5 sm:grid xl:grid-cols-[320px_minmax(0,1fr)]">
        {templateListPanel}

        <section
          className="rounded-3xl bg-white p-4 sm:p-5"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03), 0 2px 4px rgba(15,23,42,0.04), 0 8px 20px -8px rgba(15,23,42,0.06)",
          }}
        >
          <div className="space-y-5">
            {templateEditorHeader}

            {selectedTemplate ? (
              <div className="grid gap-5 2xl:grid-cols-[340px_minmax(0,1fr)]">
                {catalogPanel}
                {previewPanel}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
