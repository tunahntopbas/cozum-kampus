import { describe, expect, it } from "vitest";
import {
  type MapBuilding,
  type MapReport,
  type MapFilters,
  filterReports,
  floorLabel,
  groupByBuilding,
  relativeTime,
  timeline,
} from "./campus";

const buildings: MapBuilding[] = [
  { id: 1, name: "Süleyman Demirel Kütüphanesi", floors: 3, lat: 40.7417, lng: 30.3321 },
  { id: 2, name: "Mühendislik Fakültesi Dekanlığı", floors: 4, lat: 40.7425, lng: 30.3306 },
  { id: 3, name: "Hukuk Fakültesi", floors: 4, lat: 40.7409, lng: 30.3367 },
];

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
    reporterId: "other",
    coverUrl: null,
    ...over,
  };
}

const all: MapFilters = { query: "", filter: "Tümü", category: "", status: "" };

describe("filterReports", () => {
  const reports = [
    report({ id: 1, title: "Wi-Fi çekmiyor", category: "internet_ag", buildingId: 1 }),
    report({ id: 2, urgency: "acil", category: "asansor_erisilebilirlik", buildingId: 2, status: "islemde" }),
    report({ id: 3, reporterId: "me", buildingId: 3, status: "cozuldu" }),
    report({ id: 4, status: "geri_cekildi" }),
  ];
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const ids = (f: Partial<MapFilters>) => filterReports(reports, byId, { ...all, ...f }, "me").map((r) => r.id);

  it("hides withdrawn reports", () => {
    expect(ids({})).toEqual([1, 2, 3]);
  });

  it("searches title and building name with Turkish casing", () => {
    expect(ids({ query: "wi-fi" })).toEqual([1]);
    expect(ids({ query: "HUKUK" })).toEqual([3]);
    expect(ids({ query: "kütüphanesi" })).toEqual([1]);
  });

  it("applies the quick filters", () => {
    expect(ids({ filter: "Acil" })).toEqual([2]);
    expect(ids({ filter: "Benimkiler" })).toEqual([3]);
    expect(ids({ filter: "Erişilebilirlik" })).toEqual([2]);
  });

  it("combines category and status tone", () => {
    expect(ids({ category: "internet_ag" })).toEqual([1]);
    expect(ids({ status: "islemde" })).toEqual([2]);
    expect(ids({ status: "cozuldu", category: "internet_ag" })).toEqual([]);
  });
});

describe("groupByBuilding", () => {
  it("groups by building, falls back to the nearest building, busiest first", () => {
    const groups = groupByBuilding(
      [
        report({ id: 1, buildingId: 1 }),
        report({ id: 2, buildingId: null, lat: 40.741, lng: 30.3366 }),
        report({ id: 3, buildingId: 3 }),
        report({ id: 4, buildingId: null, lat: null, lng: null }),
      ],
      buildings,
    );
    expect(groups.map((g) => [g.building.id, g.reports.map((r) => r.id)])).toEqual([
      [3, [2, 3]],
      [1, [1]],
    ]);
  });
});

describe("labels", () => {
  it("labels floors", () => {
    expect(floorLabel(0)).toBe("Zemin kat");
    expect(floorLabel(3)).toBe("3. kat");
    expect(floorLabel(null)).toBe("");
  });

  it("formats relative time in Turkish", () => {
    const now = new Date("2026-10-27T12:00:00Z");
    expect(relativeTime("2026-10-27T11:59:30Z", now)).toBe("Az önce");
    expect(relativeTime("2026-10-27T11:20:00Z", now)).toBe("40 dk önce");
    expect(relativeTime("2026-10-27T07:00:00Z", now)).toBe("5 sa önce");
    expect(relativeTime("2026-10-26T09:00:00Z", now)).toBe("Dün");
    expect(relativeTime("2026-10-19T09:00:00Z", now)).toBe("19 Eki");
  });
});

describe("timeline", () => {
  it("marks steps done up to the current status", () => {
    const steps = (status: MapReport["status"]) => timeline(report({ status })).map((s) => s.done);
    expect(steps("alindi")).toEqual([true, false, false, false]);
    expect(steps("yonlendirildi")).toEqual([true, true, false, false]);
    expect(steps("islemde")).toEqual([true, true, true, false]);
    expect(steps("cozuldu")).toEqual([true, true, true, true]);
    expect(timeline(report({ status: "cozuldu" })).map((s) => s.label)).toEqual([
      "Bildirim alındı",
      "Birime yönlendirildi",
      "İşlemde",
      "Çözüldü",
    ]);
  });
});
