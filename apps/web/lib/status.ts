export type ReportStatus =
  | "alindi"
  | "yonlendirildi"
  | "atandi"
  | "islemde"
  | "cozuldu"
  | "yeniden_acildi"
  | "geri_cekildi";

export type StatusTone = "alindi" | "islemde" | "cozuldu";

const META: Record<ReportStatus, { label: string; tone: StatusTone }> = {
  alindi: { label: "Alındı", tone: "alindi" },
  yonlendirildi: { label: "Yönlendirildi", tone: "alindi" },
  atandi: { label: "Atandı", tone: "islemde" },
  islemde: { label: "İşlemde", tone: "islemde" },
  cozuldu: { label: "Çözüldü", tone: "cozuldu" },
  yeniden_acildi: { label: "Yeniden açıldı", tone: "islemde" },
  geri_cekildi: { label: "Geri çekildi", tone: "alindi" },
};

export function statusMeta(status: ReportStatus): { label: string; tone: StatusTone } {
  return META[status];
}
