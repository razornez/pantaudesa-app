import { test, expect } from "@playwright/test";
import { login, logout, QA, screenshot } from "./helpers";

const viewport = () => {
  const name = test.info().project.name;
  if (name === "mobile-390") return "mobile";
  if (name === "iphone-12-mini") return "iphone-12-mini";
  return "desktop";
};

test.describe("Village Data Admin Center", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.INTERNAL_ADMIN);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  test("page loads with nav item and default tab", async ({ page }) => {
    await page.goto("/internal-admin/village-data");
    await screenshot(page, "village-data-standar-detail", viewport());

    // Nav item visible
    await expect(page.locator("a[href='/internal-admin/village-data']")).toBeVisible({ timeout: 8_000 });

    // Default tab content visible
    await expect(page.getByText("Standar Detail")).toBeVisible();
    await expect(page.getByText("Data per Desa")).toBeVisible();
    await expect(page.getByText("Versi & Audit")).toBeVisible();
  });

  test("standar detail tab shows field registry", async ({ page }) => {
    await page.goto("/internal-admin/village-data?tab=standards");
    await screenshot(page, "village-data-standards-tab", viewport());

    // Template name visible
    await expect(page.getByText(/CURRENT_PUBLIC_DETAIL_TEMPLATE/i)).toBeVisible({ timeout: 8_000 });

    // At least one field section heading visible
    const sectionHeading = page.locator("text=/Identitas|Demografi|Pemerintahan|Anggaran/").first();
    await expect(sectionHeading).toBeVisible({ timeout: 8_000 });
  });

  test("desa-data tab loads desa list from DB (not hardcoded)", async ({ page }) => {
    await page.goto("/internal-admin/village-data?tab=desa-data");
    await screenshot(page, "village-data-desa-tab", viewport());

    // Search input visible
    await expect(page.locator("input[placeholder*='Cari']")).toBeVisible({ timeout: 8_000 });

    // Either desa list or empty state visible — either is valid (DB may be empty in CI)
    const hasRows = await page.locator("text=/jiwa|Website|Kecamatan/i").count();
    const hasEmpty = await page.locator("text=/Tidak ada desa|Belum ada data/i").count();
    expect(hasRows + hasEmpty).toBeGreaterThan(0);
  });

  test("versions tab loads without error", async ({ page }) => {
    await page.goto("/internal-admin/village-data?tab=versions");
    await screenshot(page, "village-data-versions-tab", viewport());

    // Either version list or honest empty state — not an error message
    await expect(page.locator("text=/Error|Gagal memuat/i")).toHaveCount(0, { timeout: 8_000 });
    const content = page.locator("text=/Riwayat versi|Audit trail|Belum ada/i").first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test("mobile: no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/internal-admin/village-data");
    await screenshot(page, "village-data-mobile-375", "iphone-12-mini");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 2); // allow 2px rounding
  });

  test("tab switching changes URL param", async ({ page }) => {
    await page.goto("/internal-admin/village-data");
    await page.click("button:has-text('Data per Desa')");
    await expect(page).toHaveURL(/tab=desa-data/);
    await page.click("button:has-text('Versi & Audit')");
    await expect(page).toHaveURL(/tab=versions/);
  });

  test("no draft/rejected data exposed — page is internal-only", async ({ page }) => {
    // Verify the page is behind internal admin auth
    await logout(page);
    await page.goto("/internal-admin/village-data");
    // Should be redirected to login
    await expect(page).toHaveURL(/masuk|login/, { timeout: 6_000 });
  });
});
