import { expect, test, type APIRequestContext } from "@playwright/test";
import { login, logout, QA, waitForNoLoadingState } from "./helpers";

const QA_DESA_ID = "qa-desa-a";

async function getJson(request: APIRequestContext, url: string) {
  const response = await request.get(url);
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function postJson(request: APIRequestContext, url: string, data: Record<string, unknown>) {
  const response = await request.post(url, {
    data,
    headers: { "Content-Type": "application/json" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function putJson(request: APIRequestContext, url: string, data: Record<string, unknown>) {
  const response = await request.put(url, {
    data,
    headers: { "Content-Type": "application/json" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function deleteJson(request: APIRequestContext, url: string) {
  const response = await request.delete(url);
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function switchTemplate(request: APIRequestContext, desaId: string, templateId: string) {
  await postJson(request, "/api/internal-admin/village-data/template-assignment", {
    desaId,
    templateId,
  });
}

test.describe("Template runtime contract", () => {
  test("agenda desa propagates to count, admin desa forms, categories, and notifications", async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(test.info().project.name !== "desktop", "Template mutation regression runs once on desktop.");

    let createdTemplateId: string | null = null;
    let originalTemplateId: string | null = null;

    await login(page, QA.INTERNAL_ADMIN);

    try {
      const originalTemplate = await getJson(
        page.context().request,
        `/api/internal-admin/village-data/template-fields?desaId=${QA_DESA_ID}`,
      );
      originalTemplateId = originalTemplate.templateId;
      expect(originalTemplateId).toBeTruthy();

      const created = await postJson(page.context().request, "/api/internal-admin/village-data/templates", {
        name: `QA Agenda Template ${Date.now()}`,
        description: "Template sementara untuk regression agenda desa.",
      });
      createdTemplateId = created.templateId;
      if (!createdTemplateId) throw new Error("Template QA gagal dibuat.");

      await putJson(
        page.context().request,
        `/api/internal-admin/village-data/templates/${createdTemplateId}/components`,
        { componentKeys: ["identitas", "agenda_desa"] },
      );
      await switchTemplate(page.context().request, QA_DESA_ID, createdTemplateId);

      const templateFields = await getJson(
        page.context().request,
        `/api/internal-admin/village-data/template-fields?desaId=${QA_DESA_ID}`,
      );
      const agendaSection = templateFields.visibleComponents.find(
        (component: { componentKey?: string }) => component.componentKey === "agenda_desa",
      );
      expect(templateFields.totalFieldCount).toBe(9);
      expect(agendaSection?.fields.map((field: { fieldKey: string }) => field.fieldKey)).toEqual([
        "agendaDesa",
        "agendaRingkasan",
        "agendaKontak",
      ]);

      await logout(page);
      await login(page, QA.ADMIN_VERIFIED_A);
      await page.goto("/profil/admin-desa/dokumen", { waitUntil: "domcontentloaded" });
      await waitForNoLoadingState(page, 20_000);
      await expect(page.locator('option[value="agenda_desa"]').first()).toHaveText("Agenda Desa");

      const structuredButton = page.getByRole("button", { name: /Isi Data Terstruktur/i });
      await expect(structuredButton).toBeEnabled();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await structuredButton.click();
      await expect(
        page.getByRole("heading", { name: /Isi data desa berdasarkan template aktif/i }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: "Agenda Desa" })).toBeVisible();
      await expect(page.getByText("3 field aktif")).toBeVisible();

      await page.goto("/profil/admin-desa/notifikasi", { waitUntil: "domcontentloaded" });
      await waitForNoLoadingState(page, 20_000);
      await expect(page.getByText("Template desa diganti").first()).toBeVisible();
    } finally {
      await logout(page).catch(() => undefined);
      await login(page, QA.INTERNAL_ADMIN).catch(() => undefined);
      if (originalTemplateId) {
        await switchTemplate(page.context().request, QA_DESA_ID, originalTemplateId).catch(() => undefined);
      }
      if (createdTemplateId) {
        await deleteJson(
          page.context().request,
          `/api/internal-admin/village-data/templates/${createdTemplateId}`,
        ).catch(() => undefined);
      }
      await logout(page).catch(() => undefined);
    }
  });
});
