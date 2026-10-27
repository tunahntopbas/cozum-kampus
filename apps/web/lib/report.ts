import type { ReportAnalysis } from "./ai";

export type ReportForm = {
  text: string;
  imagePaths: string[];
  isAnonymous: boolean;
  buildingId: number | null;
  placeId: number | null;
  floor: number | null;
  lat: number | null;
  lng: number | null;
};

export type ReportInsert = {
  reporter_id: string;
  is_anonymous: boolean;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  status: "alindi" | "yonlendirildi";
  unit_id: number | null;
  building_id: number | null;
  place_id: number | null;
  floor: number | null;
  location: string | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  ai_materials: string[] | null;
};

export function buildReportInsert(
  form: ReportForm,
  a: ReportAnalysis,
  userId: string,
  unitIdBySlug: Record<string, number>,
): ReportInsert {
  const analysed = !a.ai_pending;
  return {
    reporter_id: userId,
    is_anonymous: form.isAnonymous,
    title: a.title,
    description: form.text.trim() || null,
    category: a.category,
    urgency: a.urgency,
    status: analysed ? "yonlendirildi" : "alindi",
    unit_id: unitIdBySlug[a.unit] ?? null,
    building_id: form.buildingId,
    place_id: form.placeId,
    floor: form.floor,
    location: form.lat != null && form.lng != null ? `SRID=4326;POINT(${form.lng} ${form.lat})` : null,
    ai_summary: analysed ? a.summary : null,
    ai_confidence: analysed ? a.confidence : null,
    ai_materials: analysed ? a.materials : null,
  };
}

export function canSubmit(
  a: ReportAnalysis | null,
  form: ReportForm,
): { ok: true } | { ok: false; message: string } {
  if (!form.text.trim() && form.imagePaths.length === 0) {
    return { ok: false, message: "Bir fotoğraf ya da kısa bir açıklama ekle." };
  }
  if (form.buildingId == null && form.lat == null) {
    return { ok: false, message: "Sorunun nerede olduğunu seç." };
  }
  if (a && !a.moderation.ok) {
    return {
      ok: false,
      message: "Bu içerik paylaşılamıyor. Fotoğrafın ve açıklamanın kampüsteki sorunu gösterdiğinden emin ol.",
    };
  }
  return { ok: true };
}
