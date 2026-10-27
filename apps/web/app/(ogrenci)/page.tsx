import { Suspense } from "react";
import { CampusMapView } from "@/components/map/CampusMapView";
import { toMapReport, type MapBuilding, type ReportRow } from "@/lib/campus";
import { createServerClient } from "@/lib/supabase/server";

// Signed photo URLs outlive a demo session; the page refetches them on every visit.
const COVER_URL_TTL_S = 60 * 60;

async function CampusMap() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [buildings, reports, units, votes] = await Promise.all([
    supabase.from("building_points").select("id, name, floors, lat, lng").order("name"),
    supabase
      .from("public_reports")
      .select(
        "id, reporter_id, title, description, category, urgency, status, unit_id, building_id, floor, lat, lng, ai_summary, vote_count, created_at, resolved_at, cover_path",
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("units").select("id, name"),
    supabase.from("report_votes").select("report_id").eq("user_id", user.id),
  ]);

  const rows = reports.data ?? [];
  const paths = rows.map((r) => r.cover_path).filter((p): p is string => !!p);
  const signed = paths.length
    ? ((await supabase.storage.from("report-media").createSignedUrls(paths, COVER_URL_TTL_S)).data ?? [])
    : [];
  const urlByPath = new Map(signed.map((x) => [x.path, x.signedUrl]));

  const mapReports = rows.map((r) =>
    toMapReport(r as ReportRow, r.cover_path ? (urlByPath.get(r.cover_path) ?? null) : null),
  );

  return (
    <CampusMapView
      userId={user.id}
      buildings={(buildings.data ?? []) as MapBuilding[]}
      reports={mapReports}
      unitNames={Object.fromEntries((units.data ?? []).map((u) => [u.id, u.name]))}
      votedIds={(votes.data ?? []).map((v) => v.report_id)}
    />
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<p className="relative z-10 p-8 text-sm text-muted">Harita yükleniyor</p>}>
      <CampusMap />
    </Suspense>
  );
}
