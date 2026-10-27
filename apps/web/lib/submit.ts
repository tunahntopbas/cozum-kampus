import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportAnalysis } from "./ai";
import { canSubmit, type ReportForm } from "./report";

type Options = { fetchImpl?: typeof fetch; baseUrl?: string };

// The browser never publishes a report or attaches media directly. The server authenticates the
// caller, reanalyses the exact inputs and commits through a service-only transactional function.
async function trustedRequest(
  db: SupabaseClient,
  path: string,
  body: unknown,
  { fetchImpl = fetch, baseUrl = process.env.NEXT_PUBLIC_AI_API_URL ?? "" }: Options,
): Promise<{ id: number; storage_path?: string }> {
  const { data, error } = await db.auth.getSession();
  if (error || !data.session) throw new Error("Lütfen yeniden giriş yap.");
  const res = await fetchImpl(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("İçerik denetlenemedi veya paylaşıma uygun değil. Lütfen yeniden dene.");
  const result: unknown = await res.json();
  if (!result || typeof result !== "object" || !("id" in result) ||
      typeof result.id !== "number" || !Number.isSafeInteger(result.id) || result.id <= 0) {
    throw new Error("Bildirim işlemi tamamlanamadı.");
  }
  return result as { id: number; storage_path?: string };
}

export async function submitReport(
  db: SupabaseClient,
  form: ReportForm,
  analysis: ReportAnalysis,
  _userId: string,
  _unitIdBySlug: Record<string, number>,
  options: Options = {},
): Promise<number> {
  // Retain the old call signature so stale callers cannot accidentally regain direct-write behavior.
  const check = canSubmit(analysis, form);
  if (!check.ok) throw new Error(check.message);
  return (await trustedRequest(db, "/reports/submit", {
    text: form.text, image_paths: form.imagePaths, is_anonymous: form.isAnonymous,
    building_id: form.buildingId, place_id: form.placeId, floor: form.floor,
    lat: form.lat, lng: form.lng, category: analysis.category,
  }, options)).id;
}

export async function attachReportPhoto(
  db: SupabaseClient,
  reportId: number,
  imagePath: string,
  kind: "ek" | "sonra",
  options: Options = {},
): Promise<string> {
  const result = await trustedRequest(db, `/reports/${reportId}/media`, { image_path: imagePath, kind }, options);
  if (typeof result.storage_path !== "string" || !/^moderated\/[0-9a-f-]{36}\.jpg$/.test(result.storage_path)) {
    throw new Error("Fotoğraf işlemi tamamlanamadı.");
  }
  return result.storage_path;
}
