import { describe, expect, it } from "vitest";
import { statusMeta } from "./status";

describe("statusMeta", () => {
  it("maps islemde to its label and tone", () => {
    expect(statusMeta("islemde")).toEqual({ label: "İşlemde", tone: "islemde" });
  });

  it("groups yonlendirildi under the alindi tone", () => {
    expect(statusMeta("yonlendirildi").tone).toBe("alindi");
  });

  it("labels cozuldu", () => {
    expect(statusMeta("cozuldu").label).toBe("Çözüldü");
  });

  it("groups yeniden_acildi under the islemde tone", () => {
    expect(statusMeta("yeniden_acildi")).toEqual({ label: "Yeniden açıldı", tone: "islemde" });
  });
});
