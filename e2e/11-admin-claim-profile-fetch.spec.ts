import { expect, test } from "@playwright/test";
import { login, logout, QA, waitForNoLoadingState } from "./helpers";

test.describe("Admin claim profile fetch dedupe", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA.ADMIN_LIMITED_1_A);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("profil and klaim pages do not spam admin-claim profile api", async ({ page }) => {
    let profileRequestCount = 0;

    page.on("request", (request) => {
      if (request.url().includes("/api/admin-claim/profile")) {
        profileRequestCount += 1;
      }
    });

    const routeSequence = [
      "/profil/saya",
      "/profil/klaim-admin-desa",
      "/profil/saya",
      "/profil/klaim-admin-desa",
    ];

    for (const route of routeSequence) {
      await page.goto(route);
      await waitForNoLoadingState(page);
      await expect(page.locator("body")).toBeVisible();
    }

    expect(profileRequestCount).toBeLessThanOrEqual(1);
  });
});
