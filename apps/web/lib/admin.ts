import type { Urgency } from "./labels";
import { isOpen } from "./my-reports";
import type { ReportStatus } from "./status";

export type AdminReport = {
  id: number;
  title: string;
  category: string;
  urgency: Urgency;
  status: ReportStatus;
  unitId: number | null;
  buildingId: number | null;
  place: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type Period = "today" | "week" | "month";

const DAY_MS = 86_400_000;
// Resolution targets by urgency, in days.
export const TARGET_DAYS: Record<Urgency, number> = { acil: 1, orta: 3, dusuk: 7 };
const ISTANBUL_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" });

export function periodStart(period: Period, now: Date = new Date()): Date {
  // Istanbul has no DST, so its midnight is always 21:00 UTC.
  if (period === "today") return new Date(`${ISTANBUL_DAY.format(now)}T00:00:00+03:00`);
  return new Date(now.getTime() - (period === "week" ? 7 : 30) * DAY_MS);
}

const days = (from: string, to: string | Date) => (new Date(to).getTime() - new Date(from).getTime()) / DAY_MS;

export function isOverdue(r: AdminReport, now: Date = new Date()): boolean {
  return isOpen(r.status) && days(r.createdAt, now) > TARGET_DAYS[r.urgency];
}

const onTime = (r: AdminReport) => days(r.createdAt, r.resolvedAt as string) <= TARGET_DAYS[r.urgency];
const round1 = (n: number) => Math.round(n * 10) / 10;

function resolution(resolved: AdminReport[]) {
  if (!resolved.length) return { avgDays: null, onTimeRate: null };
  return {
    avgDays: round1(resolved.reduce((a, r) => a + days(r.createdAt, r.resolvedAt as string), 0) / resolved.length),
    onTimeRate: Math.round((resolved.filter(onTime).length / resolved.length) * 100),
  };
}

const resolvedSince = (reports: AdminReport[], since: Date) =>
  reports.filter((r) => r.status === "cozuldu" && r.resolvedAt && new Date(r.resolvedAt) >= since);

export type AdminKpis = {
  open: number;
  urgentOpen: number;
  overdue: number;
  avgDays: number | null;
  onTimeRate: number | null;
  unverified: number;
};

export function adminKpis(reports: AdminReport[], unverified: Set<number>, period: Period, now: Date = new Date()): AdminKpis {
  const open = reports.filter((r) => isOpen(r.status));
  const resolved = resolvedSince(reports, periodStart(period, now));
  return {
    open: open.length,
    urgentOpen: open.filter((r) => r.urgency === "acil").length,
    overdue: open.filter((r) => isOverdue(r, now)).length,
    ...resolution(resolved),
    unverified: resolved.filter((r) => unverified.has(r.id)).length,
  };
}

type EventLike = { reportId: number; type: string; payload: Record<string, unknown> };

// Staff can complete a job with "Yine de tamamla" when the AI rejects the after photo; the verdict stays in the event.
export function unverifiedReportIds(events: EventLike[]): Set<number> {
  const ids = new Set<number>();
  for (const e of events) {
    const ai = e.payload.ai as { resolved?: unknown } | undefined;
    if (e.type === "durum" && e.payload.to === "cozuldu" && ai?.resolved === false) ids.add(e.reportId);
  }
  return ids;
}

function top<T>(items: T[]): [T, number] | null {
  const counts = new Map<T, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  let best: [T, number] | null = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  return best;
}

export type UnitPerformance = {
  id: number;
  name: string;
  open: number;
  avgDays: number | null;
  onTimeRate: number | null;
  topCategory: string | null;
  overdue: number;
};

export function unitPerformance(reports: AdminReport[], units: { id: number; name: string }[], now: Date = new Date()): UnitPerformance[] {
  return units.map((u) => {
    const mine = reports.filter((r) => r.unitId === u.id && r.status !== "geri_cekildi");
    const open = mine.filter((r) => isOpen(r.status));
    return {
      id: u.id,
      name: u.name,
      open: open.length,
      ...resolution(mine.filter((r) => r.status === "cozuldu" && r.resolvedAt)),
      topCategory: top(mine.map((r) => r.category))?.[0] ?? null,
      overdue: open.filter((r) => isOverdue(r, now)).length,
    };
  });
}

export const ADMIN_FILTERS = ["Tümü", "Acil", "Yönlendirilmedi", "Gecikmiş", "Yeniden açılan"] as const;
export type AdminFilter = (typeof ADMIN_FILTERS)[number];

export function filterAdminReports<T extends AdminReport>(
  reports: T[],
  { query, filter, unitId }: { query: string; filter: AdminFilter; unitId: number | null },
  now: Date = new Date(),
): T[] {
  const q = query.trim().toLocaleLowerCase("tr");
  return reports.filter((r) => {
    if (unitId != null && r.unitId !== unitId) return false;
    if (filter === "Acil" && !(r.urgency === "acil" && isOpen(r.status))) return false;
    if (filter === "Yönlendirilmedi" && !(r.unitId == null && isOpen(r.status))) return false;
    if (filter === "Gecikmiş" && !isOverdue(r, now)) return false;
    if (filter === "Yeniden açılan" && r.status !== "yeniden_acildi") return false;
    return !q || `#${r.id} ${r.title} ${r.place}`.toLocaleLowerCase("tr").includes(q);
  });
}

export type DigestLine = { kind: "place" | "category" | "reopened" | "unverified"; text: string };

// A rule-based weekly summary from the same data as the KPIs (no AI call).
export function weeklyDigest(
  reports: AdminReport[],
  unverified: Set<number>,
  categoryLabels: Record<string, string>,
  now: Date = new Date(),
): DigestLine[] {
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const twoWeeksAgo = weekAgo - 7 * DAY_MS;
  const created = (r: AdminReport) => new Date(r.createdAt).getTime();
  const thisWeek = reports.filter((r) => created(r) >= weekAgo);
  const lastWeek = reports.filter((r) => created(r) >= twoWeeksAgo && created(r) < weekAgo);
  const lines: DigestLine[] = [];

  const place = top(thisWeek.filter((r) => r.place).map((r) => r.place));
  if (place) lines.push({ kind: "place", text: `En çok bildirim ${place[0]} için geldi: bu hafta ${place[1]} bildirim.` });

  let rising: { label: string; now: number; before: number } | null = null;
  for (const category of new Set(thisWeek.map((r) => r.category))) {
    const n = thisWeek.filter((r) => r.category === category).length;
    const before = lastWeek.filter((r) => r.category === category).length;
    if (n > before && (!rising || n - before > rising.now - rising.before)) {
      rising = { label: categoryLabels[category] ?? category, now: n, before };
    }
  }
  if (rising) {
    const change = !rising.before
      ? `geçen hafta hiç yoktu, bu hafta ${rising.now}`
      : rising.now >= rising.before * 2
        ? `geçen haftanın ${Math.floor(rising.now / rising.before)} katına çıktı (${rising.before} → ${rising.now})`
        : `%${Math.round(((rising.now - rising.before) / rising.before) * 100)} arttı (${rising.before} → ${rising.now})`;
    lines.push({ kind: "category", text: `${rising.label} bildirimleri ${change}.` });
  }

  const reopened = reports.filter((r) => r.status === "yeniden_acildi").length;
  if (reopened) lines.push({ kind: "reopened", text: `${reopened} bildirim yeniden açıldı; çözüm kalitesi kontrol edilmeli.` });

  const unchecked = reports.filter((r) => unverified.has(r.id)).length;
  if (unchecked) lines.push({ kind: "unverified", text: `${unchecked} iş yapay zeka çözümü doğrulayamadığı hâlde tamamlandı.` });
  return lines;
}
