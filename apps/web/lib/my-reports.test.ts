import { describe, expect, it } from "vitest";
import type { MapReport } from "./campus";
import { eventTimeline, filterMyReports, myStats, type ReportEvent } from "./my-reports";

function report(over: Partial<MapReport>): MapReport {
  return {
    id: 1,
    title: "Lamba yanmıyor",
    description: "",
    category: "aydinlatma",
    urgency: "orta",
    status: "alindi",
    unitId: 1,
    buildingId: 1,
    floor: 2,
    lat: null,
    lng: null,
    aiSummary: null,
    voteCount: 1,
    createdAt: "2026-10-27T09:00:00Z",
    resolvedAt: null,
    reporterId: "me",
    coverUrl: null,
    ...over,
  };
}

const ev = (type: string, createdAt: string, payload: Record<string, unknown> = {}): ReportEvent => ({
  type,
  payload,
  createdAt,
});

describe("filterMyReports", () => {
  const mine = [
    report({ id: 1, status: "islemde" }),
    report({ id: 2, status: "cozuldu" }),
    report({ id: 3, status: "geri_cekildi" }),
  ];
  const supported = [report({ id: 9, reporterId: "other", status: "alindi" })];
  const ids = (tab: "Açtıklarım" | "Desteklediklerim", filter: "Tümü" | "Açık" | "Çözüldü") =>
    filterMyReports(mine, supported, tab, filter).map((r) => r.id);

  it("splits own and supported reports", () => {
    expect(ids("Açtıklarım", "Tümü")).toEqual([1, 2, 3]);
    expect(ids("Desteklediklerim", "Tümü")).toEqual([9]);
  });

  it("treats withdrawn reports as neither open nor resolved", () => {
    expect(ids("Açtıklarım", "Açık")).toEqual([1]);
    expect(ids("Açtıklarım", "Çözüldü")).toEqual([2]);
  });
});

describe("myStats", () => {
  it("counts open, urgent, resolved this month and supported", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    const stats = myStats(
      [
        report({ id: 1, status: "islemde", urgency: "acil" }),
        report({ id: 2, status: "alindi" }),
        report({ id: 3, status: "cozuldu", resolvedAt: "2026-10-20T10:00:00Z" }),
        report({ id: 4, status: "cozuldu", resolvedAt: "2026-09-20T10:00:00Z" }),
        report({ id: 5, status: "geri_cekildi" }),
      ],
      2,
      now,
    );
    expect(stats).toEqual({ open: 2, urgentOpen: 1, resolvedThisMonth: 1, supported: 2 });
  });
});

describe("eventTimeline", () => {
  it("puts event times on the status steps", () => {
    const steps = eventTimeline(report({ status: "islemde" }), [
      ev("olusturuldu", "2026-10-27T09:00:00Z"),
      ev("durum", "2026-10-27T09:05:00Z", { to: "yonlendirildi" }),
      ev("durum", "2026-10-27T11:00:00Z", { to: "islemde" }),
    ]);
    expect(steps.map((s) => [s.label, s.done, s.at])).toEqual([
      ["Bildirim alındı", true, "2026-10-27T09:00:00Z"],
      ["Birime yönlendirildi", true, "2026-10-27T09:05:00Z"],
      ["İşlemde", true, "2026-10-27T11:00:00Z"],
      ["Çözüldü", false, null],
    ]);
  });

  it("uses the creation time when the report was routed on creation", () => {
    const steps = eventTimeline(report({ status: "yonlendirildi" }), [ev("olusturuldu", "2026-10-27T09:00:00Z")]);
    expect(steps[1]).toMatchObject({ done: true, at: "2026-10-27T09:00:00Z" });
  });

  it("falls back to the report dates without events", () => {
    const steps = eventTimeline(report({ status: "cozuldu", resolvedAt: "2026-10-28T08:00:00Z" }), []);
    expect(steps[0].at).toBe("2026-10-27T09:00:00Z");
    expect(steps[3]).toMatchObject({ done: true, at: "2026-10-28T08:00:00Z" });
  });

  it("appends withdrawal and extra photos in time order", () => {
    const steps = eventTimeline(report({ status: "geri_cekildi" }), [
      ev("olusturuldu", "2026-10-27T09:00:00Z"),
      ev("geri_cekildi", "2026-10-27T12:00:00Z"),
      ev("ek_fotograf", "2026-10-27T10:00:00Z"),
    ]);
    expect(steps.slice(-2).map((s) => [s.label, s.at])).toEqual([
      ["Ek fotoğraf eklendi", "2026-10-27T10:00:00Z"],
      ["Bildirimi geri çektin", "2026-10-27T12:00:00Z"],
    ]);
  });
});
