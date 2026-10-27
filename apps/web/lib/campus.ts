import type { Urgency } from "./labels";
import { statusMeta, type ReportStatus, type StatusTone } from "./status";

export type MapBuilding = { id: number; name: string; floors: number | null; lat: number; lng: number };

export type MapReport = {
  id: number;
  title: string;
  description: string;
  category: string;
  urgency: Urgency;
  status: ReportStatus;
  unitId: number | null;
  buildingId: number | null;
  floor: number | null;
  lat: number | null;
  lng: number | null;
  aiSummary: string | null;
  voteCount: number;
  createdAt: string;
  resolvedAt: string | null;
  reporterId: string | null;
  coverUrl: string | null;
};

// A row from public_reports (or reports for the owner); the views carry no generated types yet.
export type ReportRow = {
  id: number;
  reporter_id: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  urgency: Urgency | null;
  status: ReportStatus | null;
  unit_id: number | null;
  building_id: number | null;
  floor: number | null;
  lat?: number | null;
  lng?: number | null;
  ai_summary: string | null;
  vote_count: number | null;
  created_at: string | null;
  resolved_at: string | null;
};

export function toMapReport(r: ReportRow, coverUrl: string | null = null): MapReport {
  return {
    id: r.id,
    title: r.title ?? "Bildirim",
    description: r.description ?? "",
    category: r.category ?? "diger",
    urgency: r.urgency ?? "orta",
    status: r.status ?? "alindi",
    unitId: r.unit_id,
    buildingId: r.building_id,
    floor: r.floor,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    aiSummary: r.ai_summary,
    voteCount: r.vote_count ?? 1,
    createdAt: r.created_at ?? new Date(0).toISOString(),
    resolvedAt: r.resolved_at,
    reporterId: r.reporter_id,
    coverUrl,
  };
}

export const QUICK_FILTERS = ["Tümü", "Acil", "Benimkiler", "Erişilebilirlik"] as const;
export type QuickFilter = (typeof QUICK_FILTERS)[number];
export type MapFilters = { query: string; filter: QuickFilter; category: string; status: StatusTone | "" };

const lower = (s: string) => s.toLocaleLowerCase("tr");

export function filterReports(
  reports: MapReport[],
  buildingsById: Map<number, MapBuilding>,
  { query, filter, category, status }: MapFilters,
  userId: string,
): MapReport[] {
  const q = lower(query.trim());
  return reports.filter((r) => {
    if (r.status === "geri_cekildi") return false;
    const building = r.buildingId != null ? (buildingsById.get(r.buildingId)?.name ?? "") : "";
    if (q && !lower(`${r.title} ${building} ${floorLabel(r.floor)}`).includes(q)) return false;
    if (filter === "Acil" && r.urgency !== "acil") return false;
    if (filter === "Benimkiler" && r.reporterId !== userId) return false;
    if (filter === "Erişilebilirlik" && r.category !== "asansor_erisilebilirlik") return false;
    if (category && r.category !== category) return false;
    if (status && statusMeta(r.status).tone !== status) return false;
    return true;
  });
}

export type BuildingGroup = { building: MapBuilding; reports: MapReport[] };

function nearest(buildings: MapBuilding[], lat: number, lng: number): MapBuilding | undefined {
  // Campus-scale distances: an equirectangular approximation is enough to pick the closest building.
  const k = Math.cos((lat * Math.PI) / 180);
  let best: MapBuilding | undefined;
  let bestD = Infinity;
  for (const b of buildings) {
    const d = ((b.lng - lng) * k) ** 2 + (b.lat - lat) ** 2;
    if (d < bestD) [best, bestD] = [b, d];
  }
  return best;
}

export function groupByBuilding(reports: MapReport[], buildings: MapBuilding[]): BuildingGroup[] {
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const groups = new Map<number, BuildingGroup>();
  for (const r of reports) {
    const building =
      (r.buildingId != null ? byId.get(r.buildingId) : undefined) ??
      (r.lat != null && r.lng != null ? nearest(buildings, r.lat, r.lng) : undefined);
    if (!building) continue;
    const group = groups.get(building.id) ?? { building, reports: [] };
    group.reports.push(r);
    groups.set(building.id, group);
  }
  return [...groups.values()].sort(
    (a, b) => b.reports.length - a.reports.length || a.building.name.localeCompare(b.building.name, "tr"),
  );
}

export function floorLabel(floor: number | null): string {
  if (floor == null) return "";
  return floor === 0 ? "Zemin kat" : `${floor}. kat`;
}

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });

export function relativeTime(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} sa önce`;
  if (minutes < 48 * 60) return "Dün";
  return DATE.format(new Date(iso));
}

const STEP_INDEX: Record<ReportStatus, number> = {
  alindi: 0,
  yonlendirildi: 1,
  atandi: 1,
  islemde: 2,
  yeniden_acildi: 2,
  cozuldu: 3,
  geri_cekildi: 0,
};

export type TimelineStep = { label: string; done: boolean };

export function timeline(report: MapReport): TimelineStep[] {
  const reached = STEP_INDEX[report.status];
  return ["Bildirim alındı", "Birime yönlendirildi", "İşlemde", "Çözüldü"].map((label, i) => ({
    label,
    done: i <= reached,
  }));
}
