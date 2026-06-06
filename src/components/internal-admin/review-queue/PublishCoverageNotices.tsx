import type { TemplateRibbonInfo } from "./types";

interface PublishCoverageNoticesProps {
  templateInfo: TemplateRibbonInfo | null;
}

export function PublishCoverageNotices({
  templateInfo,
}: PublishCoverageNoticesProps) {
  return (
    <>
      {templateInfo ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
            Template aktif untuk desa ini
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[12px] font-semibold text-indigo-900">
              {templateInfo.templateName}
            </span>
            <span className="text-[10.5px] font-mono text-indigo-400">
              {templateInfo.templateKey}
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                templateInfo.source === "db"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {templateInfo.source === "db" ? "DB" : "Fallback"}
            </span>
            {templateInfo.visibleCount > 0 ? (
              <span className="text-[10.5px] text-indigo-500">
                {templateInfo.visibleCount} komponen aktif
              </span>
            ) : null}
            {templateInfo.hiddenCount > 0 ? (
              <span className="text-[10.5px] text-rose-500">
                {templateInfo.hiddenCount} komponen hidden
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
