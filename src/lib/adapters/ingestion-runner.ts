import type { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATE_KEY } from "@/lib/village-data/template-constants";
import { DATA_SOURCE_BY_CODE } from "./data-source-registry";
import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterFieldValue, IngestionSummary } from "./types";

interface SerializedValue {
  valueText: string | null;
  valueJson: AdapterFieldValue | null;
}

function serializeValue(value: AdapterFieldValue): SerializedValue {
  if (value === null || value === undefined) return { valueText: null, valueJson: null };
  if (typeof value === "string") return { valueText: value, valueJson: null };
  if (typeof value === "number" || typeof value === "boolean") {
    return { valueText: String(value), valueJson: value };
  }
  return { valueText: null, valueJson: value };
}

/**
 * fieldKey → { componentId, fieldStandardId } index of publishable fields for a desa.
 * Resolves via Prisma directly (ingestion is an ops/batch job, peer to the seed
 * scripts) so the runner stays runnable from standalone scripts AND server routes —
 * the template-resolver is server-only (Next) and can't load in plain Node.
 */
async function buildFieldIndex(
  desaId: string,
): Promise<{ templateId: string; index: Map<string, { componentId: string; fieldStandardId?: string }> } | null> {
  if (!db) return null;

  // Resolve the desa's template the same way the public resolver does: use the
  // per-desa assignment when active, otherwise fall back to the global DEFAULT
  // template. This lets ingestion run for any desa record without requiring a
  // per-desa assignment row (key for kabupaten-wide rollout).
  const assignment = await db.desaDetailTemplateAssignment.findUnique({
    where: { desaId },
    select: { templateId: true, isActive: true },
  });
  let templateId =
    assignment && assignment.isActive !== false ? assignment.templateId : undefined;
  if (!templateId) {
    const defaultTemplate = await db.villageDetailTemplate.findUnique({
      where: { key: DEFAULT_TEMPLATE_KEY },
      select: { id: true },
    });
    templateId = defaultTemplate?.id;
  }
  if (!templateId) return null;

  const components = await db.villageDetailComponent.findMany({
    where: { templateId, status: "ACTIVE" },
    select: {
      id: true,
      fieldStandards: {
        where: { status: "ACTIVE", isPublishableNow: true },
        select: { id: true, fieldKey: true },
      },
    },
  });

  const index = new Map<string, { componentId: string; fieldStandardId?: string }>();
  for (const component of components) {
    for (const field of component.fieldStandards) {
      index.set(field.fieldKey, { componentId: component.id, fieldStandardId: field.id });
    }
  }
  return { templateId, index };
}

/**
 * Run an adapter and persist its outputs into DataDesa with source attribution
 * (status PUBLISHED, isActive), archiving any prior active row per field.
 * Logs one DataSourceFetchRun for the whole run. Reuses the same write pattern
 * as the internal-admin publish flow.
 */
export async function runIngestion(
  adapter: DataAdapter,
  context: AdapterContext,
  options: { createdByUserId?: string } = {},
): Promise<IngestionSummary> {
  const summary: IngestionSummary = {
    adapterId: adapter.id,
    sourceCode: adapter.sourceCode,
    desaProcessed: 0,
    fieldsUpdated: 0,
    fieldsSkipped: 0,
    errors: [],
  };

  if (!db) {
    summary.errors.push("Database tidak tersedia.");
    return summary;
  }

  const sourceDef = DATA_SOURCE_BY_CODE[adapter.sourceCode];
  const sourceLabel = sourceDef?.sourceName ?? adapter.sourceCode;
  const startedAt = new Date();

  let run;
  try {
    run = await adapter.run(context);
  } catch (error) {
    summary.errors.push(
      `Adapter ${adapter.id} gagal fetch: ${error instanceof Error ? error.message : String(error)}`,
    );
    await logFetchRun(adapter, sourceDef?.sourceUrl ?? "", startedAt, "FAILED", summary, options);
    return summary;
  }

  for (const desaResult of run.results) {
    try {
      const fieldInfo = await buildFieldIndex(desaResult.desaId);
      if (!fieldInfo) {
        summary.errors.push(`Desa ${desaResult.desaId}: tidak ada template aktif.`);
        continue;
      }
      const { templateId, index } = fieldInfo;
      const now = new Date();

      // One short atomic transaction PER FIELD (archive old + write new) instead of
      // a single long interactive transaction over every field — the latter exceeds
      // the default 5s interactive-tx timeout on session-mode connections, so later
      // fields fail with "Transaction not found". A failure on one field is isolated.
      for (const out of desaResult.fields) {
        const target = index.get(out.fieldKey);
        if (!target || out.value === null || out.value === undefined) {
          summary.fieldsSkipped += 1;
          continue;
        }
        const serialized = serializeValue(out.value);
        try {
          await db.$transaction([
            db.dataDesa.updateMany({
              where: {
                desaId: desaResult.desaId,
                componentId: target.componentId,
                fieldKey: out.fieldKey,
                isActive: true,
              },
              data: { isActive: false, status: "ARCHIVED", updatedAt: now },
            }),
            db.dataDesa.create({
              data: {
                desaId: desaResult.desaId,
                templateId,
                componentId: target.componentId,
                fieldStandardId: target.fieldStandardId,
                fieldKey: out.fieldKey,
                valueText: serialized.valueText,
                valueJson:
                  serialized.valueJson === null
                    ? undefined
                    : (serialized.valueJson as Prisma.InputJsonValue),
                sourceId: adapter.sourceCode,
                sourceUrl: sourceDef?.sourceUrl,
                sourceTypeCode: adapter.sourceCode,
                sourceLabel,
                status: "PUBLISHED",
                isActive: true,
                publishedAt: now,
                reviewedById: options.createdByUserId,
              },
            }),
          ]);
          summary.fieldsUpdated += 1;
        } catch (error) {
          summary.errors.push(
            `Desa ${desaResult.desaId} field ${out.fieldKey}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      summary.desaProcessed += 1;
    } catch (error) {
      summary.errors.push(
        `Desa ${desaResult.desaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const status = summary.errors.length === 0 ? "SUCCESS" : summary.desaProcessed > 0 ? "PARTIAL" : "FAILED";
  await logFetchRun(adapter, sourceDef?.sourceUrl ?? "", startedAt, status, summary, options);
  return summary;
}

async function logFetchRun(
  adapter: DataAdapter,
  sourceUrl: string,
  startedAt: Date,
  status: string,
  summary: IngestionSummary,
  options: { createdByUserId?: string },
) {
  if (!db) return;
  try {
    await db.dataSourceFetchRun.create({
      data: {
        inputMode: "SOURCE_INGESTION",
        sourceTypeCode: adapter.sourceCode,
        sourceName: DATA_SOURCE_BY_CODE[adapter.sourceCode]?.sourceName ?? adapter.sourceCode,
        sourceUrl: sourceUrl || adapter.sourceCode,
        requestLabel: `adapter:${adapter.id}`,
        status,
        fetchedAt: startedAt,
        completedAt: new Date(),
        extractedMetaJson: {
          desaProcessed: summary.desaProcessed,
          fieldsUpdated: summary.fieldsUpdated,
          fieldsSkipped: summary.fieldsSkipped,
        },
        errorMessage: summary.errors.length > 0 ? summary.errors.join("; ").slice(0, 4000) : null,
        createdByUserId: options.createdByUserId,
      },
    });
  } catch {
    // logging is best-effort; never block ingestion on it
  }
}
