import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryLabel, initials, resolutionEstimate, roleLabel, unitLabel, urgencyLabel } from "./labels";

describe("labels", () => {
  it("labels every analysis category in Turkish", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(categoryLabel("aydinlatma")).toBe("Aydınlatma");
    expect(categoryLabel("asansor_erisilebilirlik")).toBe("Asansör ve erişilebilirlik");
    expect(categoryLabel("bilinmeyen")).toBe("Diğer");
  });

  it("labels urgency, units and roles", () => {
    expect(urgencyLabel("acil")).toBe("Acil");
    expect(unitLabel("yapi_isleri")).toBe("Yapı İşleri");
    expect(unitLabel("bilgi_islem")).toBe("Bilgi İşlem");
    expect(roleLabel("staff")).toBe("Birim personeli");
    expect(roleLabel("student")).toBe("Öğrenci");
  });

  it("estimates resolution time from urgency", () => {
    expect(resolutionEstimate("acil")).toBe("Aynı gün");
    expect(resolutionEstimate("orta")).toBe("1 ile 2 gün");
    expect(resolutionEstimate("dusuk")).toBe("3 ile 5 gün");
  });

  it("builds initials with Turkish casing", () => {
    expect(initials("zeynep kaya")).toBe("ZK");
    expect(initials("İsmail Ünal Işık")).toBe("İI");
    expect(initials("  ")).toBe("?");
  });
});
