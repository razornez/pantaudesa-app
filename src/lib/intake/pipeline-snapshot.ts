import type { IntakePipelineResult } from "@/lib/intake/pipeline";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePersistedPipelineSnapshot(
  value: unknown,
): IntakePipelineResult | null {
  if (!isRecord(value)) return null;
  if (value.ok !== undefined && value.ok !== true) return null;
  if (!isRecord(value.extract)) return null;
  if (!isRecord(value.mapping)) return null;
  if (!isRecord(value.validation)) return null;
  if (!isRecord(value.openai)) return null;

  return {
    ...value,
    ok: true,
  } as unknown as IntakePipelineResult;
}
