/**
 * village-template-read.ts
 *
 * Reads published template data for the public desa detail page.
 * Enforces: ONLY PUBLISHED DataDesa from VISIBLE components is returned.
 * Hidden components and non-published data are NEVER exposed here.
 */

import { db } from "@/lib/db";
import {
  getPublishedDataDesa,
  resolveDesaTemplate,
} from "@/lib/village-data/template-resolver";
import type { ResolvedTemplate } from "@/lib/village-data/template-resolver";

export type { ResolvedTemplate };

export interface PublishedTemplateSourceSummary {
  componentId: string;
  componentKey: string;
  componentLabel: string;
  sourceLabel: string | null;
  sourceTypeCode: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
}

export interface PublishedTemplateData {
  resolvedTemplate: ResolvedTemplate;
  publishedValues: Record<string, unknown>;
  sourceSummaries: PublishedTemplateSourceSummary[];
}

/**
 * Get the resolved template and all published DataDesa values for a desa.
 * Safe to call from public pages and never leaks draft/rejected/hidden data.
 *
 * Falls back gracefully before migration: returns empty publishedValues
 * and uses DETAIL_FIELD_STANDARDS as the template.
 */
export async function getPublishedTemplateData(
  desaId: string,
): Promise<PublishedTemplateData> {
  const resolvedTemplate = await resolveDesaTemplate(desaId);
  const publishedValues = await getPublishedDataDesa(desaId, resolvedTemplate);
  const sourceSummaries = await getPublishedTemplateSourceSummaries(
    desaId,
    resolvedTemplate,
  );

  return { resolvedTemplate, publishedValues, sourceSummaries };
}

async function getPublishedTemplateSourceSummaries(
  desaId: string,
  resolvedTemplate: ResolvedTemplate,
): Promise<PublishedTemplateSourceSummary[]> {
  if (!db) return [];

  const visibleComponents = resolvedTemplate.visibleComponents.filter(
    (component) => !component.componentId.startsWith("fallback-"),
  );
  if (visibleComponents.length === 0) return [];

  const componentMap = new Map(
    visibleComponents.map((component) => [
      component.componentId,
      { componentKey: component.componentKey, componentLabel: component.label },
    ]),
  );

  try {
    const rows = await db.dataDesa.findMany({
      where: {
        desaId,
        status: "PUBLISHED",
        isActive: true,
        componentId: { in: visibleComponents.map((component) => component.componentId) },
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        componentId: true,
        sourceLabel: true,
        sourceTypeCode: true,
        sourceUrl: true,
        publishedAt: true,
      },
    });

    const deduped = new Map<string, PublishedTemplateSourceSummary>();
    for (const row of rows) {
      if (deduped.has(row.componentId)) continue;
      const componentMeta = componentMap.get(row.componentId);
      if (!componentMeta) continue;

      deduped.set(row.componentId, {
        componentId: row.componentId,
        componentKey: componentMeta.componentKey,
        componentLabel: componentMeta.componentLabel,
        sourceLabel: row.sourceLabel,
        sourceTypeCode: row.sourceTypeCode,
        sourceUrl: row.sourceUrl,
        publishedAt: row.publishedAt?.toISOString() ?? null,
      });
    }

    return [...deduped.values()];
  } catch {
    return [];
  }
}
