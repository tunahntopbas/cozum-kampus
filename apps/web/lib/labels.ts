import type { Role } from "./auth";

export const CATEGORIES = [
  "aydinlatma",
  "su_tesisat",
  "asansor_erisilebilirlik",
  "internet_ag",
  "temizlik",
  "mobilya",
  "isitma_sogutma",
  "guvenlik",
  "diger",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Urgency = "dusuk" | "orta" | "acil";
export type UnitSlug = "yapi_isleri" | "bilgi_islem" | "temizlik" | "yemekhane" | "guvenlik";

const CATEGORY_LABELS: Record<Category, string> = {
  aydinlatma: "Aydınlatma",
  su_tesisat: "Su ve tesisat",
  asansor_erisilebilirlik: "Asansör ve erişilebilirlik",
  internet_ag: "İnternet ve ağ",
  temizlik: "Temizlik",
  mobilya: "Mobilya",
  isitma_sogutma: "Isıtma ve soğutma",
  guvenlik: "Güvenlik",
  diger: "Diğer",
};

const URGENCY_LABELS: Record<Urgency, string> = { dusuk: "Düşük", orta: "Orta", acil: "Acil" };

const UNIT_LABELS: Record<UnitSlug, string> = {
  yapi_isleri: "Yapı İşleri",
  bilgi_islem: "Bilgi İşlem",
  temizlik: "Temizlik",
  yemekhane: "Yemekhane",
  guvenlik: "Güvenlik",
};

const ROLE_LABELS: Record<Role, string> = {
  student: "Öğrenci",
  staff: "Birim personeli",
  admin: "Yönetim",
  security: "Güvenlik birimi",
};

const ESTIMATES: Record<Urgency, string> = { acil: "Aynı gün", orta: "1 ile 2 gün", dusuk: "3 ile 5 gün" };

export function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c as Category] ?? CATEGORY_LABELS.diger;
}

export function urgencyLabel(u: Urgency): string {
  return URGENCY_LABELS[u];
}

export function unitLabel(u: string): string {
  return UNIT_LABELS[u as UnitSlug] ?? u;
}

export function roleLabel(r: Role): string {
  return ROLE_LABELS[r];
}

export function resolutionEstimate(u: Urgency): string {
  return ESTIMATES[u];
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const picked = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
  return picked.map((w) => w[0].toLocaleUpperCase("tr")).join("");
}

// Same routing as services/ai/app/schemas/report.py unit_for().
const CATEGORY_TO_UNIT: Partial<Record<Category, UnitSlug>> = {
  internet_ag: "bilgi_islem",
  temizlik: "temizlik",
  guvenlik: "guvenlik",
};

export function unitForCategory(category: Category, isSensitive: boolean): UnitSlug {
  if (isSensitive) return "guvenlik";
  return CATEGORY_TO_UNIT[category] ?? "yapi_isleri";
}
