import { timeline, type MapReport } from "./campus";
import type { ReportStatus } from "./status";

// report_events.type values. "durum" carries { to: ReportStatus } and is written by staff (Plan 3).
export type ReportEvent = { type: string; payload: Record<string, unknown>; createdAt: string };

export const MY_TABS = ["Açtıklarım", "Desteklediklerim"] as const;
export type MyTab = (typeof MY_TABS)[number];
export const MY_FILTERS = ["Tümü", "Açık", "Çözüldü"] as const;
export type MyFilter = (typeof MY_FILTERS)[number];

export const isOpen = (status: ReportStatus) => status !== "cozuldu" && status !== "geri_cekildi";

export function filterMyReports<T extends MapReport>(mine: T[], supported: T[], tab: MyTab, filter: MyFilter): T[] {
  const list = tab === "Açtıklarım" ? mine : supported;
  if (filter === "Açık") return list.filter((r) => isOpen(r.status));
  if (filter === "Çözüldü") return list.filter((r) => r.status === "cozuldu");
  return list;
}

export function myStats(mine: MapReport[], supportedCount: number, now: Date = new Date()) {
  const open = mine.filter((r) => isOpen(r.status));
  const sameMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  };
  return {
    open: open.length,
    urgentOpen: open.filter((r) => r.urgency === "acil").length,
    resolvedThisMonth: mine.filter((r) => r.status === "cozuldu" && r.resolvedAt && sameMonth(r.resolvedAt)).length,
    supported: supportedCount,
  };
}

export type TimelineEntry = { label: string; done: boolean; at: string | null };

const STEP_STATUSES: ReportStatus[][] = [[], ["yonlendirildi", "atandi"], ["islemde", "yeniden_acildi"], ["cozuldu"]];
const EXTRA_LABELS: Record<string, string> = {
  ek_fotograf: "Ek fotoğraf eklendi",
  geri_cekildi: "Bildirimi geri çektin",
};

export function eventTimeline(report: MapReport, events: ReportEvent[]): TimelineEntry[] {
  const sorted = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const created = sorted.find((e) => e.type === "olusturuldu")?.createdAt ?? report.createdAt;
  const reachedAt = (statuses: ReportStatus[]) =>
    sorted.find((e) => e.type === "durum" && statuses.includes(e.payload.to as ReportStatus))?.createdAt ?? null;

  const steps = timeline(report).map((step, i): TimelineEntry => {
    let at: string | null = null;
    if (i === 0) at = created;
    else if (step.done) at = reachedAt(STEP_STATUSES[i]);
    // Routed by the AI while the report was created: no separate status event.
    if (i === 1 && step.done && !at) at = created;
    if (i === 3 && step.done && !at) at = report.resolvedAt;
    return { label: step.label, done: step.done, at };
  });
  const extras = sorted
    .filter((e) => e.type in EXTRA_LABELS)
    .map((e): TimelineEntry => ({ label: EXTRA_LABELS[e.type], done: true, at: e.createdAt }));
  return [...steps, ...extras];
}
