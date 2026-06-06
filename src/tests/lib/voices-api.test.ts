import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchVoices, submitVoice, submitVote, submitHelpful } from "@/lib/voices-api";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => mockFetch.mockReset());

describe("fetchVoices", () => {
  it("calls /api/voices when no desaId", async () => {
    mockFetch.mockResolvedValue(makeResponse([]));
    await fetchVoices();
    expect(mockFetch).toHaveBeenCalledWith("/api/voices", expect.any(Object));
  });

  it("includes desaId in query string", async () => {
    mockFetch.mockResolvedValue(makeResponse([]));
    await fetchVoices("desa-1");
    expect(mockFetch).toHaveBeenCalledWith("/api/voices?desaId=desa-1", expect.any(Object));
  });

  it("revives createdAt as Date", async () => {
    const raw = [{
      id: "v1", desaId: "1", category: "infrastruktur",
      text: "test", author: "Budi", isAnon: false,
      createdAt: "2024-01-15T00:00:00.000Z",
      helpful: 0, photos: [],
      votes: { benar: 0, bohong: 0 },
      status: "open", replies: [],
    }];
    mockFetch.mockResolvedValue(makeResponse(raw));
    const voices = await fetchVoices();
    expect(voices[0].createdAt).toBeInstanceOf(Date);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: "Server error" }, 500));
    await expect(fetchVoices()).rejects.toThrow("Gagal mengambil data suara warga");
  });
});

describe("submitVoice", () => {
  it("posts to /api/voices with correct payload", async () => {
    const payload = { desaId: "1", category: "anggaran", text: "Jalan rusak parah", isAnon: false };
    const responseBody = { ...payload, id: "new-id", createdAt: new Date().toISOString(), replies: [] };
    mockFetch.mockResolvedValue(makeResponse(responseBody, 201));

    await submitVoice(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/voices",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("throws with server error message on failure", async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: "Cerita terlalu pendek" }, 400));
    await expect(submitVoice({ desaId: "1", category: "anggaran", text: "ok", isAnon: false }))
      .rejects.toThrow("Cerita terlalu pendek");
  });
});

describe("submitVote", () => {
  it("posts to /api/voices/[id]/vote", async () => {
    mockFetch.mockResolvedValue(makeResponse({ benar: 5, bohong: 1 }));
    const result = await submitVote("v1", "BENAR");
    expect(result).toEqual({ benar: 5, bohong: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/voices/v1/vote",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ type: "BENAR" }) })
    );
  });

  it("throws on 401 unauthorized", async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: "Login diperlukan untuk vote" }, 401));
    await expect(submitVote("v1", "BOHONG")).rejects.toThrow("Login diperlukan untuk vote");
  });
});

describe("submitHelpful", () => {
  it("posts to /api/voices/[id]/helpful", async () => {
    mockFetch.mockResolvedValue(makeResponse({ helpful: 10 }));
    const result = await submitHelpful("v1");
    expect(result).toEqual({ helpful: 10 });
    expect(mockFetch).toHaveBeenCalledWith("/api/voices/v1/helpful", expect.objectContaining({ method: "POST" }));
  });
});
