import type { AiMappableDesaField } from "@/lib/admin-claim/ai-mapping";
import type { DiffEntry } from "./types";
import { FIELD_SECTION_MAP, FIELD_SECTION_ORDER } from "./constants";

export type DiffFilter = "all" | "added" | "updated" | "removed" | "unchanged";

export function getFilteredDiffEntries(
  entries: DiffEntry[],
  filter: DiffFilter,
  showUnchanged: boolean
) {
  const changedEntries = entries.filter((entry) => entry.deltaType !== "unchanged");

  if (filter === "all") {
    return showUnchanged ? entries : changedEntries;
  }

  return entries.filter((entry) => {
    if (filter === "added") return entry.deltaType === "added";
    if (filter === "updated") return entry.deltaType === "updated";
    if (filter === "removed") return entry.deltaType === "removed";
    if (filter === "unchanged") return entry.deltaType === "unchanged";
    return true;
  });
}

export function getOrderedDiffSections(filteredEntries: DiffEntry[]) {
  const grouped = new Map<string, DiffEntry[]>();
  const otherKey = "Lainnya";

  for (const entry of filteredEntries) {
    const section = FIELD_SECTION_MAP[entry.field as AiMappableDesaField] ?? otherKey;
    const bucket = grouped.get(section);
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(section, [entry]);
    }
  }

  const orderedSections: Array<[string, DiffEntry[]]> = [];
  for (const section of [...FIELD_SECTION_ORDER, otherKey]) {
    const bucket = grouped.get(section);
    if (bucket) orderedSections.push([section, bucket]);
  }

  return orderedSections;
}
