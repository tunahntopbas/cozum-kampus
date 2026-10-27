import { describe, expect, it } from "vitest";
import type { MapReport } from "./campus";
import { completedSteps, isActiveJob, isSameDay, nextAction, sortJobs } from "./staff";

function job(over: Partial<MapReport>): MapReport {
  return {
    id: 1,
    title: "İş",
    description: "",
    category: "aydinlatma",
    urgency: "orta",
    status: "yonlendirildi",
    unitId: 1,
    buildingId: 1,
    floor: null,
    lat: null,
    lng: null,
    aiSummary: null,
    voteCount: 1,
    createdAt: "2026-10-28T08:00:00Z",
    resolvedAt: null,
    reporterId: null,
    coverUrl: null,
    ...over,
  };
}

describe("staff jobs", () => {
  it("orders urgent first, then oldest first", () => {
    const sorted = sortJobs([
      job({ id: 1, urgency: "dusuk", createdAt: "2026-10-27T08:00:00Z" }),
      job({ id: 2, urgency: "acil", createdAt: "2026-10-28T09:00:00Z" }),
      job({ id: 3, urgency: "orta", createdAt: "2026-10-28T07:00:00Z" }),
      job({ id: 4, urgency: "acil", createdAt: "2026-10-28T06:00:00Z" }),
    ]);
    expect(sorted.map((j) => j.id)).toEqual([4, 2, 3, 1]);
  });

  it("keeps only open jobs", () => {
    expect(isActiveJob("yonlendirildi")).toBe(true);
    expect(isActiveJob("yeniden_acildi")).toBe(true);
    expect(isActiveJob("alindi")).toBe(true);
    expect(isActiveJob("cozuldu")).toBe(false);
    expect(isActiveJob("geri_cekildi")).toBe(false);
  });

  it("offers the next status change", () => {
    expect(nextAction("yonlendirildi")).toEqual({ label: "Yola çık", to: "atandi" });
    expect(nextAction("alindi")).toEqual({ label: "Yola çık", to: "atandi" });
    expect(nextAction("yeniden_acildi")).toEqual({ label: "Yola çık", to: "atandi" });
    expect(nextAction("atandi")).toEqual({ label: "İşe başla", to: "islemde" });
    expect(nextAction("islemde")).toBeNull();
    expect(nextAction("cozuldu")).toBeNull();
  });

  it("counts finished steps, the photo counting once work has started", () => {
    expect(completedSteps("yonlendirildi", false)).toBe(0);
    expect(completedSteps("atandi", false)).toBe(1);
    expect(completedSteps("islemde", false)).toBe(2);
    expect(completedSteps("islemde", true)).toBe(3);
    expect(completedSteps("cozuldu", true)).toBe(4);
  });

  it("compares days in Istanbul time", () => {
    const now = new Date("2026-10-28T10:00:00Z");
    expect(isSameDay("2026-10-27T22:30:00Z", now)).toBe(true); // 01:30 on the 28th in Istanbul
    expect(isSameDay("2026-10-27T20:00:00Z", now)).toBe(false);
  });
});
