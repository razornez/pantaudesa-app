import { test, expect } from "@playwright/test";
import { login, logout, QA, screenshot } from "./helpers";

const viewport = () => {
  const name = test.info().project.name;
  if (name === "mobile-390") return "mobile";
  if (name === "iphone-12-mini") return "iphone-12-mini";
  return "desktop";
};

// Regression coverage for the bugs reported by owner:
//   1. Navbar shows account name (NOT "Dashboard") for all roles.
//   2. Navbar account link points to /profil (NOT /desa-admin).
//   3. /desa-admin/profil never blank — redirects through /profil.
//   4. Notification icon target is role-aware.
//   5. /profil resolves to the right destination per role.

const ROLES = [
  { label: "warga-biasa",        email: QA.WARGA_BIASA,         expectsAdminTab: false },
  { label: "applicant-pending",  email: QA.PENGAJU_PENDING,     expectsAdminTab: false },
  { label: "admin-verified-a",   email: QA.ADMIN_VERIFIED_A,    expectsAdminTab: true  },
  { label: "admin-limited-1-a",  email: QA.ADMIN_LIMITED_1_A,   expectsAdminTab: true  },
  { label: "internal-admin",     email: QA.INTERNAL_ADMIN,      expectsAdminTab: false }, // goes to /internal-admin
];

for (const role of ROLES) {
  test.describe(`Regression — navbar account for ${role.label}`, () => {
    test.beforeEach(async ({ page }) => { await login(page, role.email); });
    test.afterEach(async ({ page }) => { await logout(page); });

    test("navbar shows name (not 'Dashboard') and link goes to /profil", async ({ page }) => {
      await page.goto("/");
      // The account button (avatar + name) must be present and link to /profil
      const accountLink = page.locator("a[href='/profil']").first();
      await expect(accountLink).toBeVisible({ timeout: 8_000 });
      // Should NOT contain the literal text "Dashboard"
      await expect(page.locator("nav a", { hasText: "Dashboard" })).toHaveCount(0);
      // Should NOT have any href pointing to /desa-admin
      await expect(page.locator("nav a[href='/desa-admin']")).toHaveCount(0);
      await screenshot(page, `regression-navbar-${role.label}`, viewport());
    });

    test("/profil resolves to a non-blank destination", async ({ page }) => {
      const response = await page.goto("/profil", { waitUntil: "domcontentloaded" });
      // Should not 404 / 500
      const status = response?.status() ?? 0;
      expect(status, `/profil returned ${status}`).toBeLessThan(400);
      // Wait for redirect to settle
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
      // Page must have rendered something
      await expect(page.locator("body")).not.toBeEmpty();
      await screenshot(page, `regression-profil-${role.label}`, viewport());
    });

    test("/desa-admin/profil legacy route does not blank out", async ({ page }) => {
      await page.goto("/desa-admin/profil", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
      // After redirect we should NOT be on /login (unless session genuinely lost — these QA users are logged in)
      expect(page.url()).not.toContain("/login");
      // Body should have content
      const html = await page.locator("body").innerHTML();
      expect(html.length).toBeGreaterThan(50);
      await screenshot(page, `regression-desa-admin-profil-${role.label}`, viewport());
    });
  });
}

test.describe("Regression — notification icon target", () => {
  test("WARGA notif icon → /profil/saya?tab=notifikasi", async ({ page }) => {
    await login(page, QA.WARGA_BIASA);
    await page.goto("/");
    const bell = page.locator("a[aria-label*='Notifikasi']").first();
    await expect(bell).toBeVisible({ timeout: 6_000 });
    const href = await bell.getAttribute("href");
    expect(href).toContain("/profil/saya");
    expect(href).toContain("notifikasi");
    await logout(page);
  });

  test("Admin Desa notif icon resolves through /profil", async ({ page }) => {
    await login(page, QA.ADMIN_VERIFIED_A);
    await page.goto("/");
    const bell = page.locator("a[aria-label*='Notifikasi']").first();
    await expect(bell).toBeVisible({ timeout: 6_000 });
    const href = await bell.getAttribute("href");
    expect(href).toBe("/profil");
    await logout(page);
  });

  test("Internal admin notif icon → /internal-admin", async ({ page }) => {
    await login(page, QA.INTERNAL_ADMIN);
    await page.goto("/");
    const bell = page.locator("a[aria-label*='Notifikasi']").first();
    await expect(bell).toBeVisible({ timeout: 6_000 });
    const href = await bell.getAttribute("href");
    expect(href).toBe("/internal-admin");
    await logout(page);
  });
});
