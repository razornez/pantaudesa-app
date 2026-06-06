import { test, expect } from "@playwright/test";
import { login, logout, QA, screenshot } from "./helpers";

const viewport = () => {
  const name = test.info().project.name;
  if (name === "mobile-390") return "mobile";
  if (name === "iphone-12-mini") return "iphone-12-mini";
  return "desktop";
};

test.describe("Public page — unauthenticated", () => {
  test("homepage loads and lists desa", async ({ page }) => {
    await page.goto("/desa");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "public-desa-list", viewport());
  });

  test("desa detail page loads", async ({ page }) => {
    await page.goto("/desa");
    const firstLink = page.locator("a[href^='/desa/']").first();
    const href = await firstLink.getAttribute("href");
    if (href) {
      await page.goto(href);
      await expect(page.locator("h1").first()).toBeVisible();
      await screenshot(page, "public-desa-detail-no-source-indicator", viewport());
      // Source indicator only renders when internal admin has published — we capture either state.
    }
  });
});

test.describe("Warga biasa — no Admin Desa access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.WARGA_BIASA);
  });
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("no admin-desa tabs visible on profile", async ({ page }) => {
    await page.goto("/profil/saya");
    await screenshot(page, "warga-profil-saya", viewport());
    // Admin Desa nav should not exist
    await expect(page.locator("a[href='/profil/admin-desa']")).toHaveCount(0);
  });

  test("cannot access /profil/admin-desa — redirected", async ({ page }) => {
    await page.goto("/profil/admin-desa");
    // Should be redirected to claim flow or login
    await expect(page).not.toHaveURL(/\/profil\/admin-desa$/);
    await screenshot(page, "warga-admin-desa-blocked", viewport());
  });

  test("cannot access internal admin — redirected", async ({ page }) => {
    await page.goto("/internal-admin");
    await expect(page).not.toHaveURL(/\/internal-admin/);
    await screenshot(page, "warga-internal-admin-blocked", viewport());
  });

  test("public desa page still accessible", async ({ page }) => {
    await page.goto("/desa");
    await expect(page.locator("body")).toBeVisible();
    await screenshot(page, "warga-public-desa-accessible", viewport());
  });
});
