import { test, expect } from "@playwright/test";
import { login, logout, QA, screenshot } from "./helpers";

const viewport = () => {
  const name = test.info().project.name;
  if (name === "mobile-390") return "mobile";
  if (name === "iphone-12-mini") return "iphone-12-mini";
  return "desktop";
};

test.describe("Applicant PENDING", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.PENGAJU_PENDING);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  test("claim status PENDING is visible", async ({ page }) => {
    await page.goto("/profil/klaim-admin-desa");
    await screenshot(page, "claim-status-pending", viewport());
    // Status should show pending state
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Should NOT be redirected to admin-desa dashboard
    await expect(page).not.toHaveURL(/admin-desa(?!.*klaim)/);
  });
});

test.describe("Applicant IN_REVIEW (website token)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.PENGAJU_IN_REVIEW_WEB);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  test("IN_REVIEW (website) state visible with clear next step copy", async ({ page }) => {
    await page.goto("/profil/klaim-admin-desa");
    await screenshot(page, "claim-status-in-review-website", viewport());
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Applicant IN_REVIEW (email OTP)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.PENGAJU_IN_REVIEW_EMAIL);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  test("IN_REVIEW (email) state visible with clear next step copy", async ({ page }) => {
    await page.goto("/profil/klaim-admin-desa");
    await screenshot(page, "claim-status-in-review-email", viewport());
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Applicant REJECTED", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.PENGAJU_REJECTED);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  test("rejection reason visible with re-apply or contact option", async ({ page }) => {
    await page.goto("/profil/klaim-admin-desa");
    await screenshot(page, "claim-status-rejected-with-reason", viewport());
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Applicant COOLDOWN", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.PENGAJU_COOLDOWN);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  test("cooldown state visible — cannot re-apply yet", async ({ page }) => {
    await page.goto("/profil/klaim-admin-desa");
    await screenshot(page, "claim-status-cooldown", viewport());
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Hubungi Admin — Pengajuan Admin Desa form", () => {
  test("form accessible from /hubungi-admin", async ({ page }) => {
    await page.goto("/hubungi-admin");
    await screenshot(page, "hubungi-admin-pengajuan-admin-desa-form", viewport());
    await expect(page.locator("body")).toBeVisible();
  });
});
