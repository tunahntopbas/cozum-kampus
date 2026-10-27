import { describe, expect, it } from "vitest";
import { dayGroup, findSimilar } from "./campus-voice";

const items = [
  { title: "Yurt çamaşırhanesi 24 saat açık olsun", votes: 64 },
  { title: "Kütüphane final haftasında sabaha kadar açık kalsın", votes: 412 },
];

describe("findSimilar", () => {
  it("matches on shared word stems", () => {
    expect(findSimilar("Çamaşırhane gece de açık kalsın", items)?.votes).toBe(64);
    expect(findSimilar("Kütüphanede final haftası", items)?.votes).toBe(412);
    expect(findSimilar("Otoparka gölgelik", items)).toBeUndefined();
    expect(findSimilar("", items)).toBeUndefined();
  });
});

describe("dayGroup", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  it("groups by Istanbul day", () => {
    expect(dayGroup("2026-10-27T21:30:00Z", now)).toBe("Bugün");
    expect(dayGroup("2026-10-27T10:00:00Z", now)).toBe("Dün");
    expect(dayGroup("2026-10-20T10:00:00Z", now)).toBe("Daha eski");
  });
});
