import { describe, expect, it } from "vitest";
import { hasProfanity } from "./profanity";

describe("hasProfanity", () => {
  it.each([
    "bu oç gay herhalde",
    "amk lambası yine yanmıyor",
    "Siktir et bu tuvaleti",
    "s1kt1r",
    "siiiiktir",
    "ORUSPU değil ama orospu çocuğu",
    "göt gibi koku",
    "aptal tasarım",
  ])("catches %s", (text) => {
    expect(hasProfanity(text)).toBe(true);
  });

  it.each([
    "Koridor lambası yanmıyor",
    "Malzeme deposu kapalı",
    "Yemeği götürmek için tepsi yok",
    "Sıkıntılı bir durum, sıcak su yok",
    "Amfide klima çalışmıyor",
    "Kapı kolu kırık, sıkışıyor",
    "Akademik takvim",
  ])("allows %s", (text) => {
    expect(hasProfanity(text)).toBe(false);
  });
});
