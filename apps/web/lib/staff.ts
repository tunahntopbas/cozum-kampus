import type { MapReport } from "./campus";
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
