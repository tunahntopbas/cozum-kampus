import { describe, expect, it, vi } from "vitest";
import type { ReportAnalysis } from "./ai";
import type { ReportForm } from "./report";
import { submitReport } from "./submit";

const A: ReportAnalysis = {
  title: "Lamba", category: "aydinlatma", urgency: "orta", unit: "yapi_isleri",
  summary: "s", materials: [], is_sensitive: false,
  moderation: { ok: true, reasons: [] }, confidence: 0.9, ai_pending: false,
};
const FORM: ReportForm = {
  text: "Lamba yanmıyor", imagePaths: ["u-1/a.jpg", "u-1/b.jpg"], isAnonymous: true,
  buildingId: 1, placeId: null, floor: 2, lat: null, lng: null,
};
function db(token: string | null = "test-token") {
  // No from()/rpc(): publication must work without any browser write capability.
  return { auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) } } as never;
}

describe("submitReport", () => {
  it("sends only exact form inputs to the trusted publication endpoint", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ id: 42 }));
    expect(await submitReport(db(), FORM, A, "forged-user", { yapi_isleri: 999 }, { fetchImpl, baseUrl: "http://ai" })).toBe(42);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://ai/reports/submit");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-token" });
    expect(JSON.parse(init.body as string)).toEqual({
      text: "Lamba yanmıyor", image_paths: ["u-1/a.jpg", "u-1/b.jpg"], is_anonymous: true,
      building_id: 1, place_id: null, floor: 2, lat: null, lng: null, category: "aydinlatma",
    });
  });

  it.each([401, 403, 422, 503])("fails closed on server rejection %s", async (status) => {
    await expect(submitReport(db(), FORM, A, "u-1", {}, {
      fetchImpl: async () => Response.json({ detail: "İçerik paylaşılamıyor" }, { status }),
    })).rejects.toThrow();
  });

  it("never falls back to a direct DB insert when the service is down", async () => {
    await expect(submitReport(db(), FORM, A, "u-1", {}, {
      fetchImpl: async () => { throw new TypeError("offline"); },
    })).rejects.toThrow();
  });

  it("requires an authenticated session", async () => {
    const fetchImpl = vi.fn();
    await expect(submitReport(db(null), FORM, A, "u-1", {}, { fetchImpl })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([{ ...A, ai_pending: true }, { ...A, moderation: { ok: false, reasons: ["portrait"] } }])("rejects unsafe old helper calls", async (analysis) => {
    const fetchImpl = vi.fn();
    await expect(submitReport(db(), FORM, analysis, "u-1", {}, { fetchImpl })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
