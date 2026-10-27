const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" });
const STOP = new Set(["daha", "olsun", "için", "kadar", "fazla", "bütün", "eklensin", "açık", "kalsın", "yapılsın", "olmalı"]);

const words = (text: string) =>
  new Set(
    text
      .toLocaleLowerCase("tr")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 4 && !STOP.has(w))
      .map((w) => w.slice(0, 6)),
  );

// A suggestion sharing two meaningful word stems with the draft (one for drafts of up to three words) counts as similar.
export function findSimilar<T extends { title: string; votes: number }>(text: string, items: T[]): T | undefined {
  const draft = words(text);
  if (!draft.size) return undefined;
  const need = draft.size <= 3 ? 1 : 2;
  return items
    .map((item) => ({ item, hits: [...words(item.title)].filter((w) => draft.has(w)).length }))
    .filter((x) => x.hits >= need)
    .sort((a, b) => b.hits - a.hits || b.item.votes - a.item.votes)[0]?.item;
}

export type DayGroup = "Bugün" | "Dün" | "Daha eski";

export function dayGroup(iso: string, now: Date = new Date()): DayGroup {
  const day = DAY.format(new Date(iso));
  if (day === DAY.format(now)) return "Bugün";
  if (day === DAY.format(new Date(now.getTime() - 86_400_000))) return "Dün";
  return "Daha eski";
}
