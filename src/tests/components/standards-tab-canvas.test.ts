import { describe, expect, it } from "vitest";
import { uniqueTemplateCanvasKeys } from "@/components/internal-admin/village-data-center/StandardsTab";

describe("StandardsTab canvas helpers", () => {
  it("keeps the first component order while removing duplicate component keys", () => {
    expect(
      uniqueTemplateCanvasKeys([
        "identitas",
        "agenda_desa",
        "perangkat",
        "agenda_desa",
        "suara_warga",
      ]),
    ).toEqual(["identitas", "agenda_desa", "perangkat", "suara_warga"]);
  });
});
