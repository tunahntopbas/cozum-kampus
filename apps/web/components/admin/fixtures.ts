import type { PanelReport } from "./types";

export const NOW = Date.parse("2026-10-28T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

export function panelReport(over: Partial<PanelReport>): PanelReport {
  return {
    id: 1,
    title: "Koridor lambası yanmıyor",
    description: "İkinci kat koridorunda",
    category: "aydinlatma",
    urgency: "orta",
    status: "islemde",
    unitId: 1,
    buildingId: 10,
    floor: 2,
    lat: null,
    lng: null,
    aiSummary: "Koridor aydınlatması arızalı.",
    voteCount: 0,
    createdAt: ago(1),
    resolvedAt: null,
    reporterId: null,
    coverUrl: null,
    place: "Mühendislik Fakültesi, 2. kat",
    ...over,
  };
}

export const adminData = {
  userId: "admin",
  reports: [
    panelReport({ id: 1 }),
    panelReport({ id: 2, title: "Su sızıntısı", urgency: "acil", status: "alindi", unitId: null, category: "su_tesisat", place: "Yemekhane", buildingId: 11, createdAt: ago(3) }),
    panelReport({ id: 3, status: "cozuldu", createdAt: ago(4), resolvedAt: ago(2) }),
    panelReport({ id: 4, status: "cozuldu", urgency: "acil", createdAt: ago(5), resolvedAt: ago(1) }),
  ],
  buildings: [
    { id: 10, name: "Mühendislik Fakültesi", floors: 4, lat: 40.74, lng: 30.33 },
    { id: 11, name: "Yemekhane", floors: 1, lat: 40.741, lng: 30.332 },
  ],
  units: [
    { id: 1, name: "Yapı İşleri" },
    { id: 2, name: "Bilgi İşlem" },
  ],
  unverified: [4],
};
