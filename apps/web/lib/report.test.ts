import { describe, expect, it } from "vitest";
import type { ReportAnalysis } from "./ai";
import { buildReportInsert, canSubmit, type ReportForm } from "./report";

const A: ReportAnalysis = {
  title: "Koridor lambası yanmıyor",
  category: "aydinlatma",
  urgency: "orta",
  unit: "yapi_isleri",
  summary: "Armatür yanmıyor.",
  materials: ["LED tüp 18 W"],
  is_sensitive: false,
  moderation: { ok: true, reasons: [] },
  confidence: 0.94,
  ai_pending: false,
};
const FORM: ReportForm = {
  text: "Koridorda lamba yanmıyor",
  imagePaths: ["u-1/a.jpg"],
  isAnonymous: false,
  buildingId: 2,
  placeId: null,
  floor: 3,
  lat: null,
  lng: null,
};
const UNITS = { yapi_isleri: 1, bilgi_islem: 2, guvenlik: 5 };

describe("buildReportInsert", () => {
  it("quarantines pending rows even when the builder is called directly", () => {
    expect(buildReportInsert(FORM, { ...A, ai_pending: true }, "u-1", UNITS)).toMatchObject({ is_hidden: true, status: "alindi", ai_summary: null });
  });

  it("routes analysed report", () => {
    const row = buildReportInsert(FORM, A, "u-1", UNITS);
    expect(row).toMatchObject({
      reporter_id: "u-1",
      is_hidden: false,
      status: "yonlendirildi",
      unit_id: 1,
      title: "Koridor lambası yanmıyor",
      description: "Koridorda lamba yanmıyor",
      category: "aydinlatma",
      urgency: "orta",
      building_id: 2,
      floor: 3,
      ai_summary: "Armatür yanmıyor.",
      ai_confidence: 0.94,
      ai_materials: ["LED tüp 18 W"],
      location: null,
      is_anonymous: false,
    });
  });

  it("builds WKT location", () => {
    const row = buildReportInsert({ ...FORM, lat: 40.74, lng: 30.33 }, A, "u-1", UNITS);
    expect(row.location).toBe("SRID=4326;POINT(30.33 40.74)");
  });


});

describe("canSubmit", () => {
  it("blocks moderated content", () => {
    const r = canSubmit({ ...A, moderation: { ok: false, reasons: ["küfür"] } }, FORM);
    expect(r).toEqual({
      ok: false,
      message: "Bu içerik paylaşılamıyor. Fotoğrafın ve açıklamanın kampüsteki sorunu gösterdiğinden emin ol.",
    });
  });

  it("requires photo or text", () => {
    expect(canSubmit(A, { ...FORM, text: " ", imagePaths: [] })).toEqual({
      ok: false,
      message: "Bir fotoğraf ya da kısa bir açıklama ekle.",
    });
  });

  it("blocks profanity before anything is sent", () => {
    expect(canSubmit(A, { ...FORM, text: "amk lamba yanmıyor" }).ok).toBe(false);
  });

  it("requires a location", () => {
    expect(canSubmit(A, { ...FORM, buildingId: null, lat: null })).toEqual({
      ok: false,
      message: "Sorunun nerede olduğunu seç.",
    });
  });

  it("never sends a report the AI has not checked", () => {
    const blocked = {
      ok: false,
      message: "Yapay zeka içeriği denetleyemedi. Denetlenmeyen bildirim gönderilmez; birazdan yeniden dene.",
    };
    expect(canSubmit(null, FORM)).toEqual(blocked);
    expect(canSubmit({ ...A, ai_pending: true }, FORM)).toEqual(blocked);
  });
});

it.each([undefined, null, "true", 1])("requires boolean approval (%s)", (ok) => {
 expect(canSubmit({ ...A, moderation: { ok, reasons: [] } } as unknown as ReportAnalysis, FORM).ok).toBe(false);
});

it("quarantines a denied verdict when the builder is called directly", () => {
  expect(buildReportInsert(FORM, { ...A, moderation: { ok: false, reasons: ["portrait"] } }, "u-1", UNITS))
    .toMatchObject({ is_hidden: true, status: "alindi", ai_summary: null });
});
