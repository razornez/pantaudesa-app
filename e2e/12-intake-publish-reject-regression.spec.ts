import { expect, test, type Page } from "@playwright/test";
import {
  login,
  logout,
  QA,
  screenshot,
  waitForNoLoadingState,
} from "./helpers";

const VALID_INTAKE_TEXT = [
  "Website: https://desa-contoh-maju.desa.id",
  "Jumlah Penduduk: 3210 jiwa",
  "Tahun Data: 2025",
  "Kategori Desa: Maju",
  "Kecamatan: Cibungbulang",
  "Kabupaten: Bogor",
  "Provinsi: Jawa Barat",
].join("\n");

function uniqueTitle(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function fetchAdminDesaDocuments(page: Page) {
  const response = await page.context().request.get("/api/admin-claim/documents");
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return Array.isArray(payload.documents) ? payload.documents : [];
}

async function fetchInternalDocuments(page: Page, status?: string) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await page.context().request.get(`/api/internal-admin/documents${suffix}`);
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return Array.isArray(payload.documents) ? payload.documents : [];
}

async function uploadAdminDesaDocument(page: Page, input: {
  title: string;
  fileName: string;
  mimeType: string;
  content: string;
}) {
  const response = await page.context().request.post("/api/admin-claim/documents/upload", {
    multipart: {
      title: input.title,
      category: "PROFIL_DESA",
      responsibilityAck: "true",
      file: {
        name: input.fileName,
        mimeType: input.mimeType,
        buffer: Buffer.from(input.content, "utf8"),
      },
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();

  const docs = await fetchAdminDesaDocuments(page);
  const doc = docs.find((item: { title?: string }) => item.title === input.title);
  expect(doc, `Uploaded doc not found for title ${input.title}`).toBeTruthy();
  return doc as {
    id: string;
    title: string;
    status: string;
    rejectedReason: string | null;
  };
}

async function submitInternalIntakeReview(page: Page, input: {
  title: string;
  desaId: string;
  text: string;
}) {
  const response = await page.context().request.post("/api/internal-admin/intake/submit-review", {
    data: {
      title: input.title,
      desaId: input.desaId,
      text: input.text,
      useAiMapping: false,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return await response.json() as {
    ok: true;
    documentId: string;
    newStatus: string;
  };
}

test.describe("Intake publish/reject regression", () => {
  test("verified reject flow enforces reason, blocks limited, and persists final state", async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(test.info().project.name !== "desktop", "Runs once on desktop for business-flow regression.");

    const title = uniqueTitle("QA Verified Reject");
    const rejectReason = `Dokumen QA ditolak karena metadata belum konsisten ${Date.now()}`;

    await login(page, QA.ADMIN_LIMITED_1_A);
    const uploaded = await uploadAdminDesaDocument(page, {
      title,
      fileName: "qa-verified-reject.txt",
      mimeType: "text/plain",
      content: VALID_INTAKE_TEXT,
    });
    expect(uploaded.status).toBe("WAITING_VERIFIED_APPROVAL");

    const limitedReject = await page.context().request.post(
      `/api/admin-claim/documents/${uploaded.id}/reject`,
      {
        data: { reason: "Saya tidak berhak" },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(limitedReject.status()).toBe(403);
    await logout(page);

    await login(page, QA.ADMIN_VERIFIED_A);
    const missingReason = await page.context().request.post(
      `/api/admin-claim/documents/${uploaded.id}/reject`,
      {
        data: { reason: "" },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(missingReason.status()).toBe(400);

    await page.goto("/profil/admin-desa/dokumen", { waitUntil: "domcontentloaded" });
    await waitForNoLoadingState(page);
    const card = page.locator("article").filter({ hasText: title }).first();
    await expect(card).toBeVisible();
    await expect(card.getByRole("button", { name: "Tolak" })).toBeVisible();
    const verifiedReject = await page.context().request.post(
      `/api/admin-claim/documents/${uploaded.id}/reject`,
      {
        data: { reason: rejectReason },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(verifiedReject.ok(), await verifiedReject.text()).toBeTruthy();
    await page.reload();
    await waitForNoLoadingState(page);
    const rejectedCard = page.locator("article").filter({ hasText: title }).first();
    await expect(rejectedCard).toContainText("Ditolak");
    await expect(rejectedCard).toContainText(rejectReason);
    await screenshot(page, "verified-reject-document-final", "desktop");

    await logout(page);
    await login(page, QA.ADMIN_LIMITED_1_A);
    await page.goto("/profil/admin-desa/dokumen", { waitUntil: "domcontentloaded" });
    await waitForNoLoadingState(page);
    const limitedCard = page.locator("article").filter({ hasText: title }).first();
    await expect(limitedCard).toContainText("Ditolak");
    await expect(limitedCard).toContainText(rejectReason);
  });

  test("internal intake can publish from step 2 and blocks repeat publish afterward", async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(test.info().project.name !== "desktop", "Runs once on desktop for business-flow regression.");

    const title = uniqueTitle("QA Intake Publish");
    await login(page, QA.INTERNAL_ADMIN);

    const submission = await submitInternalIntakeReview(page, {
      title,
      desaId: "qa-desa-a",
      text: VALID_INTAKE_TEXT,
    });
    expect(submission.newStatus).toBe("PROCESSING");

    await page.goto(`/internal-admin/intake/${submission.documentId}`, { waitUntil: "domcontentloaded" });
    await waitForNoLoadingState(page, 20000);
    await expect(page.getByText("Publish atau reject dari halaman ini")).toBeVisible();
    await expect(page.getByText("Preview review belum bisa dibangun")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publikasikan" })).toBeVisible();
    await screenshot(page, "intake-step2-before-publish", "desktop");

    const publishResponse = await page.context().request.post(
      `/api/internal-admin/documents/${submission.documentId}/publish`,
      {
        data: {
          fields: {
            websiteUrl: "https://desa-contoh-maju.desa.id",
            jumlahPenduduk: 3210,
            tahunData: 2025,
            kategori: "Maju",
            kecamatan: "Cibungbulang",
            kabupaten: "Bogor",
            provinsi: "Jawa Barat",
          },
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(publishResponse.ok(), await publishResponse.text()).toBeTruthy();

    const publishedDocs = await fetchInternalDocuments(page, "PUBLISHED");
    const published = publishedDocs.find((item: { id?: string }) => item.id === submission.documentId);
    expect(published).toBeTruthy();

    const repeatPublish = await page.context().request.post(
      `/api/internal-admin/documents/${submission.documentId}/publish`,
      {
        data: {
          fields: {
            websiteUrl: "https://desa-contoh-maju.desa.id",
            jumlahPenduduk: 3210,
            tahunData: 2025,
            kategori: "Maju",
            kecamatan: "Cibungbulang",
            kabupaten: "Bogor",
            provinsi: "Jawa Barat",
          },
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(repeatPublish.status()).toBe(422);

    await page.goto(`/internal-admin/intake/${submission.documentId}`, { waitUntil: "domcontentloaded" });
    await waitForNoLoadingState(page, 20000);
    await expect(page.getByText(/read-only karena keputusan final sudah tercatat/i)).toBeVisible();
  });

  test("internal intake failed flow requires reason and lands in final failed state", async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(test.info().project.name !== "desktop", "Runs once on desktop for business-flow regression.");

    const title = uniqueTitle("QA Intake Failed");
    await login(page, QA.INTERNAL_ADMIN);

    const submission = await submitInternalIntakeReview(page, {
      title,
      desaId: "qa-desa-b",
      text: VALID_INTAKE_TEXT,
    });
    expect(submission.newStatus).toBe("PROCESSING");

    const missingReason = await page.context().request.post(
      `/api/internal-admin/documents/${submission.documentId}/mark-failed`,
      {
        data: { reason: "" },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(missingReason.status()).toBe(400);

    await page.goto(`/internal-admin/intake/${submission.documentId}`, { waitUntil: "domcontentloaded" });
    await waitForNoLoadingState(page, 20000);
    await expect(page.getByRole("button", { name: /Reject \/ tandai gagal/i })).toBeVisible();
    const failedReason = `Dokumen QA gagal dipakai ${Date.now()}`;
    const failedResponse = await page.context().request.post(
      `/api/internal-admin/documents/${submission.documentId}/mark-failed`,
      {
        data: { reason: failedReason },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(failedResponse.ok(), await failedResponse.text()).toBeTruthy();

    const failedDocs = await fetchInternalDocuments(page, "FAILED");
    const failed = failedDocs.find((item: { id?: string; failedReason?: string | null }) => item.id === submission.documentId);
    expect(failed).toBeTruthy();
    expect(failed?.failedReason).toContain(failedReason);
    await page.goto(`/internal-admin/intake/${submission.documentId}`, { waitUntil: "domcontentloaded" });
    await waitForNoLoadingState(page, 20000);
    await expect(page.getByText(/read-only karena keputusan final sudah tercatat/i)).toBeVisible();
    await screenshot(page, "intake-step2-after-failed-redirect", "desktop");
  });
});
