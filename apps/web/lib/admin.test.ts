import { describe, expect, it } from "vitest";
import {
  adminKpis,
  filterAdminReports,
  isOverdue,
  periodStart,
  unitPerformance,
  unverifiedReportIds,
  weeklyDigest,
  type AdminReport,
} from "./admin";

const NOW = new Date("2026-10-28T12:00:00Z");
const DAY = 86_400_000;
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

function report(over: Partial<AdminReport>): AdminReport {
  return {
    id: 1,
    title: "Koridor lambası yanmıyor",
    category: "aydinlatma",
    urgency: "orta",
    status: "islemde",
    unitId: 1,
    buildingId: 10,
    place: "Mühendislik Fakültesi",
    createdAt: ago(1),
    resolvedAt: null,
    ...over,
  };
}

describe("periodStart", () => {
  it("starts today at Istanbul midnight and other periods by days", () => {
    expect(periodStart("today", NOW).toISOString()).toBe("2026-10-27T21:00:00.000Z");
    expect(periodStart("week", NOW).getTime()).toBe(NOW.getTime() - 7 * DAY);
    expect(periodStart("month", NOW).getTime()).toBe(NOW.getTime() - 30 * DAY);
  });
});

describe("isOverdue", () => {
  it("compares open report age with the urgency target", () => {
    expect(isOverdue(report({ urgency: "acil", createdAt: ago(2) }), NOW)).toBe(true);
    expect(isOverdue(report({ urgency: "orta", createdAt: ago(2) }), NOW)).toBe(false);
    expect(isOverdue(report({ urgency: "dusuk", createdAt: ago(8) }), NOW)).toBe(true);
    expect(isOverdue(report({ urgency: "acil", createdAt: ago(5), status: "cozuldu", resolvedAt: ago(1) }), NOW)).toBe(false);
  });
});

describe("adminKpis", () => {
  it("counts open reports and measures resolutions inside the period", () => {
    const reports = [
      report({ id: 1 }),
      report({ id: 2, status: "alindi", urgency: "acil", createdAt: ago(3) }),
      report({ id: 3, status: "cozuldu", createdAt: ago(4), resolvedAt: ago(2) }),
      report({ id: 4, status: "cozuldu", urgency: "acil", createdAt: ago(5), resolvedAt: ago(1) }),
      report({ id: 5, status: "cozuldu", createdAt: ago(60), resolvedAt: ago(40) }),
      report({ id: 6, status: "geri_cekildi" }),
    ];
    expect(adminKpis(reports, new Set([4]), "week", NOW)).toEqual({
      open: 2,
      urgentOpen: 1,
      overdue: 1,
      avgDays: 3,
      onTimeRate: 50,
      unverified: 1,
    });
  });

  it("returns nulls without resolutions", () => {
    const k = adminKpis([report({})], new Set(), "today", NOW);
    expect(k.avgDays).toBeNull();
    expect(k.onTimeRate).toBeNull();
  });
});

describe("unverifiedReportIds", () => {
  it("finds completions the AI could not verify", () => {
    const events = [
      { reportId: 1, type: "durum", payload: { to: "cozuldu", ai: { resolved: false } } },
      { reportId: 2, type: "durum", payload: { to: "cozuldu", ai: { resolved: true } } },
      { reportId: 3, type: "durum", payload: { to: "islemde" } },
    ];
    expect([...unverifiedReportIds(events)]).toEqual([1]);
  });
});

describe("unitPerformance", () => {
  it("summarises each unit", () => {
    const reports = [
      report({ id: 1, category: "su" }),
      report({ id: 2, category: "su" }),
      report({ id: 3, status: "cozuldu", createdAt: ago(3), resolvedAt: ago(1) }),
      report({ id: 4, unitId: 2, category: "internet" }),
    ];
    const units = [
      { id: 1, name: "Yapı İşleri" },
      { id: 2, name: "Bilgi İşlem" },
      { id: 3, name: "Temizlik" },
    ];
    expect(unitPerformance(reports, units, NOW)).toEqual([
      { id: 1, name: "Yapı İşleri", open: 2, avgDays: 2, onTimeRate: 100, topCategory: "su", overdue: 0 },
      { id: 2, name: "Bilgi İşlem", open: 1, avgDays: null, onTimeRate: null, topCategory: "internet", overdue: 0 },
      { id: 3, name: "Temizlik", open: 0, avgDays: null, onTimeRate: null, topCategory: null, overdue: 0 },
    ]);
  });
});

describe("filterAdminReports", () => {
  const reports = [
    report({ id: 1, urgency: "acil" }),
    report({ id: 2, unitId: null, title: "Sıcak su yok", place: "Yurt" }),
    report({ id: 3, status: "yeniden_acildi", unitId: 2 }),
    report({ id: 4, urgency: "dusuk", createdAt: ago(9) }),
    report({ id: 5, status: "cozuldu", resolvedAt: ago(0), isHidden: true }),
  ];
  const ids = (f: Parameters<typeof filterAdminReports>[1]) => filterAdminReports(reports, f, NOW).map((r) => r.id);

  it("applies quick filters, unit and search", () => {
    expect(ids({ query: "", filter: "Acil", unitId: null })).toEqual([1]);
    expect(ids({ query: "", filter: "Yönlendirilmedi", unitId: null })).toEqual([2]);
    expect(ids({ query: "", filter: "Gecikmiş", unitId: null })).toEqual([4]);
    expect(ids({ query: "", filter: "Yeniden açılan", unitId: null })).toEqual([3]);
    expect(ids({ query: "", filter: "Tümü", unitId: 2 })).toEqual([3]);
    expect(ids({ query: "yurt", filter: "Tümü", unitId: null })).toEqual([2]);
    expect(ids({ query: "#4", filter: "Tümü", unitId: null })).toEqual([4]);
    expect(ids({ query: "", filter: "Yayında değil", unitId: null })).toEqual([5]);
  });
});

describe("weeklyDigest", () => {
  it("highlights the busiest place, rising categories, reopened and unverified jobs", () => {
    const reports = [
      report({ id: 1, createdAt: ago(1) }),
      report({ id: 2, createdAt: ago(2) }),
      report({ id: 3, createdAt: ago(3), category: "su", place: "Yemekhane", buildingId: 11 }),
      report({ id: 4, createdAt: ago(10) }),
      report({ id: 5, status: "yeniden_acildi", category: "su", createdAt: ago(9) }),
    ];
    const lines = weeklyDigest(reports, new Set([3]), { aydinlatma: "Aydınlatma", su: "Su" }, NOW);
    expect(lines.map((l) => l.kind)).toEqual(["place", "category", "reopened", "unverified"]);
    expect(lines[0].text).toContain("Mühendislik Fakültesi");
    expect(lines[1].text).toContain("Aydınlatma");
    expect(lines[1].text).toContain("2 kat");
  });

  it("is empty without activity", () => {
    expect(weeklyDigest([], new Set(), {}, NOW)).toEqual([]);
  });
});
