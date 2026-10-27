import { describe, expect, it, vi } from "vitest";
import { AiRequestError, analyzeReport } from "./ai";

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
