import { describe, expect, it, vi } from "vitest";
import type { ReportAnalysis } from "./ai";
import type { ReportForm } from "./report";
import { submitReport } from "./submit";

const A = {
  title: "Lamba",
  category: "aydinlatma",
  urgency: "orta",
  unit: "yapi_isleri",
  summary: "s",
  materials: [],
  is_sensitive: false,
  moderation: { ok: true, reasons: [] },
  confidence: 0.9,
  ai_pending: false,
} as ReportAnalysis;
const FORM: ReportForm = {
  text: "Lamba yanmıyor",
  imagePaths: ["u-1/a.jpg", "u-1/b.jpg"],
  isAnonymous: true,
  buildingId: 1,
  placeId: null,
  floor: 2,
  lat: null,
  lng: null,
};

function fakeDb(reportResult: { data: unknown; error: unknown }) {
  const inserts: Record<string, unknown> = {};
  const from = vi.fn((table: string) => ({
    insert: (row: unknown) => {
      inserts[table] = row;
      if (table === "reports") return { select: () => ({ single: async () => reportResult }) };
      return Promise.resolve({ error: null });
    },
  }));
  return { db: { from } as never, inserts };
}

describe("submitReport", () => {
  it("inserts the report, its photos and the first timeline event", async () => {
    const { db, inserts } = fakeDb({ data: { id: 42 }, error: null });
    const id = await submitReport(db, FORM, A, "u-1", { yapi_isleri: 1 });
    expect(id).toBe(42);
    expect(inserts.reports).toMatchObject({ reporter_id: "u-1", is_anonymous: true, unit_id: 1 });
    expect(inserts.report_media).toEqual([
      { report_id: 42, kind: "once", storage_path: "u-1/a.jpg" },
      { report_id: 42, kind: "once", storage_path: "u-1/b.jpg" },
    ]);
    expect(inserts.report_events).toEqual({
      report_id: 42,
      type: "olusturuldu",
      actor_id: "u-1",
      payload: { category: "aydinlatma", urgency: "orta", ai_pending: false },
    });
  });

  it("skips the media insert when there are no photos", async () => {
    const { db, inserts } = fakeDb({ data: { id: 7 }, error: null });
    await submitReport(db, { ...FORM, imagePaths: [] }, A, "u-1", { yapi_isleri: 1 });
    expect(inserts.report_media).toBeUndefined();
  });

  it("fails loudly when the report cannot be saved", async () => {
    const { db } = fakeDb({ data: null, error: { message: "rls" } });
    await expect(submitReport(db, FORM, A, "u-1", {})).rejects.toThrow("Bildirim kaydedilemedi");
  });
});
