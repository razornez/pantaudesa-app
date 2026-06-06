import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSourceIngestionPreview,
  validateSourceUrlForIngestion,
} from "@/lib/internal-admin/source-ingestion";

describe("source ingestion safeguards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("blocks invalid, local, and login-protected URLs", () => {
    expect(validateSourceUrlForIngestion("not-a-url")).toEqual({
      ok: false,
      error: "URL sumber tidak valid.",
    });
    expect(validateSourceUrlForIngestion("http://localhost:3000/source")).toEqual({
      ok: false,
      error: "URL lokal/private tidak boleh dipakai untuk ingestion.",
    });
    expect(validateSourceUrlForIngestion("https://desa.example.id/login")).toEqual({
      ok: false,
      error: "Halaman login/protected tidak boleh dipakai untuk ingestion.",
    });
  });

  it("extracts readable text and auto-mapped suggestions from html", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get(name: string) {
            return name.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : null;
          },
        },
        async text() {
          return `
            <html>
              <body>
                <h1>Profil Desa</h1>
                <p>Website: https://desa.example.id</p>
                <p>Jumlah Penduduk: 3786 jiwa</p>
                <script>window.secret = "ignore me"</script>
              </body>
            </html>
          `;
        },
      }),
    );

    const result = await fetchSourceIngestionPreview("https://desa.example.id/profil");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sourceUrl).toBe("https://desa.example.id/profil");
    expect(result.contentType).toContain("text/html");
    expect(result.extractedText).toContain("Profil Desa");
    expect(result.extractedText).not.toContain("ignore me");
    expect(result.suggestedValues.websiteUrl).toBe("https://desa.example.id");
    expect(result.suggestedValues.jumlahPenduduk).toBe(3786);
  });

  it("returns honest failure when upstream source is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: { get: () => "text/html" },
        async text() {
          return "temporary outage";
        },
      }),
    );

    await expect(fetchSourceIngestionPreview("https://desa.example.id/status")).resolves.toEqual({
      ok: false,
      error: "Sumber merespons 503. Cek URL atau coba lagi nanti.",
    });
  });
});
