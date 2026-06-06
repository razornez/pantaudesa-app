import { type Page, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

export const QA = {
  PIN: "246810",
  INTERNAL_ADMIN:          "internal.admin.qa@pantaudesa.local",
  WARGA_BIASA:             "warga.biasa.qa@pantaudesa.local",
  PENGAJU_PENDING:         "pengaju.pending.qa@pantaudesa.local",
  PENGAJU_IN_REVIEW_WEB:   "pengaju.in-review.website.qa@pantaudesa.local",
  PENGAJU_IN_REVIEW_EMAIL: "pengaju.in-review.email.qa@pantaudesa.local",
  PENGAJU_REJECTED:        "pengaju.rejected.qa@pantaudesa.local",
  PENGAJU_COOLDOWN:        "pengaju.cooldown.qa@pantaudesa.local",
  ADMIN_VERIFIED_A:        "admin.verified.desa-a.qa@pantaudesa.local",
  ADMIN_LIMITED_1_A:       "admin.limited-1.desa-a.qa@pantaudesa.local",
  ADMIN_LIMITED_2_A:       "admin.limited-2.desa-a.qa@pantaudesa.local",
  ADMIN_VERIFIED_B:        "admin.verified.desa-b.qa@pantaudesa.local",
  ADMIN_LIMITED_1_B:       "admin.limited-1.desa-b.qa@pantaudesa.local",
};

const BASE_URL = "http://127.0.0.1:3000";
const SCREENSHOT_DIR = path.join(process.cwd(), "docs/bmad/screenshots/sprint-04-008-back-office-ux-mobile-qa");

export async function login(page: Page, email: string, pin = QA.PIN): Promise<boolean> {
  const ctx = page.context().request;

  const pinRes = await ctx.post(`${BASE_URL}/api/auth/login`, {
    data: { email, pin },
    headers: { "Content-Type": "application/json" },
  });
  if (!pinRes.ok()) {
    const body = await pinRes.text();
    throw new Error(`PIN check failed for ${email}: ${pinRes.status()} ${body}`);
  }
  const pinJson = await pinRes.json();
  const loginToken = pinJson.loginToken;
  if (!loginToken) throw new Error(`No loginToken returned for ${email}: ${JSON.stringify(pinJson)}`);

  const csrfRes = await ctx.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  const callbackRes = await ctx.post(`${BASE_URL}/api/auth/callback/pin`, {
    form: { email, loginToken, csrfToken, callbackUrl: BASE_URL, json: "true" },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    maxRedirects: 0,
  });
  if (callbackRes.status() !== 200 && callbackRes.status() !== 302) {
    const body = await callbackRes.text();
    throw new Error(`NextAuth callback failed: ${callbackRes.status()} ${body}`);
  }

  const cookies = await page.context().cookies(BASE_URL);
  const sessionCookie = cookies.find((c) => c.name.includes("session-token"));
  if (!sessionCookie) {
    throw new Error(`Session cookie not set after login for ${email}. Got cookies: ${cookies.map((c) => c.name).join(", ")}`);
  }
  return true;
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}

export async function assertAuthenticated(page: Page) {
  await expect(page).not.toHaveURL(/\/login|\/masuk/);
  await expect(page.getByTestId("navbar-account-link")).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk" })).toHaveCount(0);
}

export async function waitForNoLoadingState(page: Page, timeoutMs = 15000) {
  await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => {});
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: timeoutMs });
  await expect(page.getByText(/Memuat|Loading/i)).toHaveCount(0, { timeout: timeoutMs });
}

export async function waitForRouteReady(page: Page, expectedUrlPattern: RegExp) {
  await expect(page).toHaveURL(expectedUrlPattern);
  await expect(page).not.toHaveURL(/\/login|\/masuk/);
}

export async function waitForRoleContent(page: Page, roleOrPage: string) {
  const markers: Record<string, string> = {
    ADMIN_VERIFIED: '[data-testid="admin-desa-shell"]',
    ADMIN_LIMITED: '[data-testid="admin-desa-shell"]',
    INTERNAL_ADMIN: '[data-testid="internal-admin-shell"]',
    CLAIM_STATUS: '[data-testid="claim-status-card"]',
    DOCUMENT_UPLOAD: '[data-testid="document-upload-form"]',
    NOTIFICATION_TAB: '[data-testid="notification-tab"]',
    INTERNAL_DOCUMENTS: '[data-testid="internal-documents-queue"]',
    INTERNAL_CLAIMS: '[data-testid="internal-claims-queue"]',
  };
  const selector = markers[roleOrPage];
  if (!selector) throw new Error(`No role/page marker registered for ${roleOrPage}`);
  await page.locator(selector).first().waitFor({ state: "visible", timeout: 15000 });
}

export async function assertLayoutUsable(page: Page, viewportName: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, `${viewportName} has horizontal overflow`).toBe(false);
  await expect(page.locator("button, a").first()).toBeVisible();
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function writeDebugScreenshot(page: Page, fileName: string) {
  const debugDir = path.join(SCREENSHOT_DIR, "debug");
  ensureDir(debugDir);
  const filePath = path.join(debugDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

export async function safeScreenshot(
  page: Page,
  pathName: string,
  opts: {
    viewportName: "desktop" | "mobile-390" | "iphone-12-mini";
    expectedUrlPattern: RegExp;
    roleOrPage: string;
  },
) {
  try {
    await assertAuthenticated(page);
    await waitForNoLoadingState(page);
    await waitForRouteReady(page, opts.expectedUrlPattern);
    await waitForRoleContent(page, opts.roleOrPage);
    await assertLayoutUsable(page, opts.viewportName);
  } catch (error) {
    const debugName = `debug-failed-readiness-${path.basename(pathName)}.png`;
    await writeDebugScreenshot(page, debugName);
    throw error;
  }

  const dir = path.dirname(path.join(SCREENSHOT_DIR, pathName));
  ensureDir(dir);
  const filePath = path.join(SCREENSHOT_DIR, pathName);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

export async function waitForContentReady(page: Page, opts?: { contentSelector?: string; timeoutMs?: number }) {
  const timeout = opts?.timeoutMs ?? 15000;
  await waitForNoLoadingState(page, timeout);
  if (opts?.contentSelector) {
    await page.locator(opts.contentSelector).first().waitFor({ state: "visible", timeout });
  }
  await page.waitForTimeout(250);
}

export async function screenshot(
  page: Page,
  name: string,
  viewport: "desktop" | "mobile" | "iphone-12-mini" = "desktop",
  opts?: { contentSelector?: string },
) {
  await waitForContentReady(page, opts);
  const folder = viewport === "mobile" ? "mobile-390" : viewport;
  const dir = path.join(SCREENSHOT_DIR, folder);
  ensureDir(dir);
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
