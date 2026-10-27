import { floorLabel, toMapReport, type MapBuilding, type ReportRow } from "@/lib/campus";
import { unverifiedReportIds } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { AdminData } from "@/components/admin/types";

const REPORT_COLUMNS =
  "id, reporter_id, title, description, category, urgency, status, unit_id, building_id, floor, ai_summary, vote_count, is_hidden, created_at, resolved_at";

// Admin reads every report through RLS; the panel works on the latest 500.
export async function loadAdminData(): Promise<AdminData | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [reports, buildings, units, events] = await Promise.all([
    supabase.from("reports").select(REPORT_COLUMNS).neq("status", "geri_cekildi").order("created_at", { ascending: false }).limit(500),
    supabase.from("building_points").select("id, name, floors, lat, lng").order("name"),
    supabase.from("units").select("id, name").order("id"),
    supabase.from("report_events").select("report_id, type, payload").eq("type", "durum").eq("payload->>to", "cozuldu"),
  ]);
  const buildingList = (buildings.data ?? []) as MapBuilding[];
  const name = new Map(buildingList.map((b) => [b.id, b.name]));
  return {
    userId: user.id,
    reports: ((reports.data ?? []) as ReportRow[]).map((row) => {
      const r = toMapReport(row);
      return {
        ...r,
        isHidden: (row as ReportRow & { is_hidden?: boolean }).is_hidden === true,
        place: [r.buildingId != null ? name.get(r.buildingId) : null, floorLabel(r.floor)].filter(Boolean).join(", "),
      };
    }),
    buildings: buildingList,
    units: (units.data ?? []) as { id: number; name: string }[],
    unverified: [
      ...unverifiedReportIds(
        (events.data ?? []).map((e) => ({ reportId: e.report_id as number, type: e.type as string, payload: e.payload ?? {} })),
      ),
    ],
  };
}
