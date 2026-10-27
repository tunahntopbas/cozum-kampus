import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportAnalysis } from "./ai";
import { buildReportInsert, type ReportForm } from "./report";

// Report row first, then its photos and the first timeline event (RLS lets the reporter write all three).
export async function submitReport(
  db: SupabaseClient,
  form: ReportForm,
  analysis: ReportAnalysis,
  userId: string,
  unitIdBySlug: Record<string, number>,
): Promise<number> {
  const { data, error } = await db
    .from("reports")
    .insert(buildReportInsert(form, analysis, userId, unitIdBySlug))
    .select("id")
    .single();
  if (error || !data) throw new Error("Bildirim kaydedilemedi");
  const reportId = (data as { id: number }).id;

  if (form.imagePaths.length) {
    await db
      .from("report_media")
      .insert(form.imagePaths.map((path) => ({ report_id: reportId, kind: "once", storage_path: path })));
  }
  await db.from("report_events").insert({
    report_id: reportId,
    type: "olusturuldu",
    actor_id: userId,
    payload: { category: analysis.category, urgency: analysis.urgency, ai_pending: analysis.ai_pending },
  });
  return reportId;
}
