import type { MapReport } from "./campus";
import type { ReportEvent } from "./my-reports";
import type { ReportStatus } from "./status";

export const JOB_STEPS = ["Yola çıktı", "Başladı", "Çözüm fotoğrafı", "Tamamla"] as const;

const URGENCY_RANK = { acil: 0, orta: 1, dusuk: 2 } as const;

export const isActiveJob = (status: ReportStatus) => status !== "cozuldu" && status !== "geri_cekildi";

// No staff location yet, so the "route" is urgency first, then the oldest report.
export function sortJobs<T extends MapReport>(jobs: T[]): T[] {
  return [...jobs].sort(
    (a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.createdAt.localeCompare(b.createdAt),
  );
}

export function nextAction(status: ReportStatus): { label: string; to: ReportStatus } | null {
  if (status === "alindi" || status === "yonlendirildi" || status === "yeniden_acildi") {
    return { label: "Yola çık", to: "atandi" };
  }
  if (status === "atandi") return { label: "İşe başla", to: "islemde" };
  return null;
}

export function completedSteps(status: ReportStatus, hasPhoto: boolean): number {
  if (status === "cozuldu") return 4;
  if (status === "islemde") return hasPhoto ? 3 : 2;
  if (status === "atandi") return 1;
  return 0;
}

const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" });

export function isSameDay(iso: string, now: Date = new Date()): boolean {
  return DAY.format(new Date(iso)) === DAY.format(now);
}

export type StockStatus = "Yeterli" | "Düşük" | "Kritik";

// Full bar at twice the minimum; below half the minimum is critical.
export function stockLevel(qty: number, min: number): { status: StockStatus; fill: number } {
  const fill = min > 0 ? Math.min(100, Math.round((qty / (min * 2)) * 100)) : qty > 0 ? 100 : 0;
  const status: StockStatus = qty === 0 || qty < min / 2 ? "Kritik" : qty < min ? "Düşük" : "Yeterli";
  return { status, fill };
}

export type NeededMaterial = { name: string; count: number; itemId: number | null; available: number };

const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

// The AI writes free-text material names per report; match them to stock in either direction.
export function neededMaterials(perJob: string[][], stock: { id: number; name: string; qty: number }[]): NeededMaterial[] {
  const needed = new Map<string, NeededMaterial>();
  for (const names of perJob) {
    for (const raw of new Set(names.map((n) => n.trim()).filter(Boolean))) {
      const item = stock.find((i) => norm(i.name).includes(norm(raw)) || norm(raw).includes(norm(i.name)));
      const key = item ? `#${item.id}` : norm(raw);
      const entry = needed.get(key) ?? { name: item?.name ?? raw, count: 0, itemId: item?.id ?? null, available: item?.qty ?? 0 };
      entry.count += 1;
      needed.set(key, entry);
    }
  }
  return [...needed.values()].sort((a, b) => b.count - a.count || (a.itemId == null ? 1 : 0) - (b.itemId == null ? 1 : 0));
}

const statusAt = (events: ReportEvent[], to: string) =>
  events.find((e) => e.type === "durum" && e.payload.to === to)?.createdAt ?? null;

// From "İşe başla" to completion; without status events, from the report to its resolution.
export function jobMinutes(events: ReportEvent[], createdAt: string, resolvedAt: string | null): number | null {
  const end = statusAt(events, "cozuldu") ?? resolvedAt;
  if (!end) return null;
  const start = statusAt(events, "islemde") ?? createdAt;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
}

export function completionVerdict(events: ReportEvent[]): { confidence: number | null; resolved: boolean | null; note: string | null } {
  const done = events.find((e) => e.type === "durum" && e.payload.to === "cozuldu");
  const ai = done?.payload.ai as { resolved?: boolean; confidence?: number; ai_pending?: boolean } | null | undefined;
  const scored = ai && !ai.ai_pending && typeof ai.confidence === "number";
  return {
    confidence: scored ? Math.round((ai.confidence as number) * 100) : null,
    resolved: scored ? Boolean(ai.resolved) : null,
    note: typeof done?.payload.note === "string" ? done.payload.note : null,
  };
}

export type StockItem = { id: number; name: string; qty: number; min: number };
export type MaterialRequest = { id: number; itemId: number; qty: number; note: string | null; status: string; createdAt: string };
export type RequestRow = { id: number; item_id: number; qty: number; note: string | null; status: string; created_at: string };

export const REQUEST_COLUMNS = "id, item_id, qty, note, status, created_at";

export const toRequest = (r: RequestRow): MaterialRequest => ({
  id: r.id,
  itemId: r.item_id,
  qty: r.qty,
  note: r.note,
  status: r.status,
  createdAt: r.created_at,
});
