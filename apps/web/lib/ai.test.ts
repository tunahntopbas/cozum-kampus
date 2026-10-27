import { describe, expect, it, vi } from "vitest";
import { AiRequestError, analyzeReport, draftReply, verifyResolution } from "./ai";

const OK = {
  title: "Koridor lambası yanmıyor",
  category: "aydinlatma",
  urgency: "orta",
  unit: "yapi_isleri",
  summary: "Armatür yanmıyor.",
  materials: [],
  is_sensitive: false,
  moderation: { ok: true, reasons: [] },
  confidence: 0.94,
  ai_pending: false,
};

const input = { text: "Lamba yanmıyor", imagePaths: [] };

describe("analyzeReport", () => {
  it("returns pending analysis on timeout", async () => {
    const hang = () => new Promise<Response>(() => {});
    const r = await analyzeReport(input, "t", { timeoutMs: 10, fetchImpl: hang as typeof fetch });
    expect(r.ai_pending).toBe(true);
    expect(r.title).toBe("Lamba yanmıyor");
    expect(r.category).toBe("diger");
  });

  it("returns pending analysis on 503", async () => {
    const r = await analyzeReport(input, "t", { fetchImpl: async () => new Response("", { status: 503 }) });
    expect(r.ai_pending).toBe(true);
  });

  it("returns pending analysis when the network fails", async () => {
    const r = await analyzeReport(input, "t", {
      fetchImpl: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    expect(r.ai_pending).toBe(true);
  });

  it("throws AiRequestError on 429", async () => {
    await expect(
      analyzeReport(input, "t", { fetchImpl: async () => new Response("", { status: 429 }) }),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      analyzeReport(input, "t", { fetchImpl: async () => new Response("", { status: 413 }) }),
    ).rejects.toBeInstanceOf(AiRequestError);
  });

  it("sends bearer token and snake_case body", async () => {
    const fetchImpl = vi.fn(async () => Response.json(OK));
    const r = await analyzeReport(
      { text: "x", imagePaths: ["u/a.jpg"], lat: 40.74, lng: 30.33, buildingName: "M1" },
      "tok",
      { fetchImpl, baseUrl: "http://ai.test" },
    );
    expect(r.category).toBe("aydinlatma");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://ai.test/ai/analyze-report");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual({
      text: "x",
      image_paths: ["u/a.jpg"],
      lat: 40.74,
      lng: 30.33,
      building_name: "M1",
    });
  });

  it("uses a generic title when there is no text", async () => {
    const r = await analyzeReport({ text: "  ", imagePaths: [] }, "t", {
      fetchImpl: async () => new Response("", { status: 500 }),
    });
    expect(r.title).toBe("Yeni bildirim");
  });
});

describe("verifyResolution", () => {
  const input = { beforePath: "a/before.jpg", afterPath: "b/after.jpg", category: "aydinlatma" };

  it("sends both paths and returns the verdict", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ resolved: true, confidence: 0.9, note: "Lamba yanıyor", ai_pending: false })),
    );
    const r = await verifyResolution(input, "tok", { fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: "http://ai" });
    expect(r).toEqual({ resolved: true, confidence: 0.9, note: "Lamba yanıyor", ai_pending: false });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://ai/ai/verify-resolution");
    expect(JSON.parse(init.body as string)).toEqual({
      before_path: "a/before.jpg",
      after_path: "b/after.jpg",
      category: "aydinlatma",
    });
  });

  it("degrades to a pending verdict when the service is down", async () => {
    const r = await verifyResolution(input, "tok", { fetchImpl: async () => new Response("", { status: 502 }) });
    expect(r).toMatchObject({ resolved: false, ai_pending: true });
  });

  it("throws on client errors such as a missing staff role", async () => {
    await expect(
      verifyResolution(input, "tok", { fetchImpl: async () => new Response("", { status: 403 }) }),
    ).rejects.toBeInstanceOf(AiRequestError);
  });
});

describe("draftReply", () => {
  const input = { title: "Kütüphane açık kalsın", body: "", category: "Kütüphane", votes: 412, status: "planlandi" as const };

  it("sends the suggestion and returns the draft", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ reply: "Planladık.", ai_pending: false })));
    const r = await draftReply(input, "tok", { fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: "http://ai" });
    expect(r).toEqual({ reply: "Planladık.", ai_pending: false });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://ai/ai/draft-reply");
    expect(JSON.parse(init.body as string)).toEqual(input);
  });

  it("degrades to an empty pending draft when the service is down", async () => {
    const r = await draftReply(input, "tok", { fetchImpl: async () => new Response("", { status: 502 }) });
    expect(r).toEqual({ reply: "", ai_pending: true });
  });
});

it("does not approve fallback content", async () => {
  const result = await analyzeReport(input, "t", { fetchImpl: async () => new Response("", { status: 503 }) });
  expect(result.moderation.ok).toBe(false);
});
it.each([{ ...OK, moderation: { ok: "true", reasons: [] } }, { ...OK, moderation: { ok: true, reasons: ["portrait"] } }, { ...OK, ai_pending: undefined }])("does not trust malformed or contradictory analysis", async (body) => {
  const result = await analyzeReport(input, "t", { fetchImpl: async () => Response.json(body) });
  expect(result.moderation.ok).toBe(false);
});
