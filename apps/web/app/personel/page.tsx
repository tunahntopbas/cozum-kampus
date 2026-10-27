import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StaffJobsView } from "@/components/staff/StaffJobsView";
import type { StaffJob } from "@/components/staff/types";
import { floorLabel, toMapReport, type ReportRow } from "@/lib/campus";
import { isActiveJob, isSameDay, sortJobs } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_S = 60 * 60;
const REPORT_COLUMNS =
  "id, reporter_id, title, description, category, urgency, status, unit_id, building_id, floor, ai_summary, vote_count, created_at, resolved_at";

async function Jobs() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS limits staff to reports routed to their own unit (admin sees all).
  const [profile, reportsRes, buildings, units] = await Promise.all([
    supabase.from("profiles").select("full_name, unit_id").eq("id", user.id).single(),
    supabase.from("reports").select(REPORT_COLUMNS).order("created_at", { ascending: true }).limit(200),
    supabase.from("building_points").select("id, name, lat, lng"),
    supabase.from("units").select("id, name").order("name"),
  ]);
  const rows = ((reportsRes.data ?? []) as ReportRow[]).map((r) => toMapReport(r));
  const active = rows.filter((r) => isActiveJob(r.status));
  const ids = active.map((r) => r.id);

  const media = ids.length
    ? ((await supabase.from("report_media").select("report_id, kind, storage_path").in("report_id", ids).order("id")).data ?? [])
    : [];
  const paths = media.map((m) => m.storage_path as string);
  const signed = paths.length
    ? ((await supabase.storage.from("report-media").createSignedUrls(paths, SIGNED_URL_TTL_S)).data ?? [])
    : [];
  const url = new Map(signed.map((x) => [x.path, x.signedUrl]));
  const firstPath = (id: number, kind: string) =>
    (media.find((m) => m.report_id === id && m.kind === kind)?.storage_path as string | undefined) ?? null;
  const lastPath = (id: number, kind: string) =>
    (media.filter((m) => m.report_id === id && m.kind === kind).at(-1)?.storage_path as string | undefined) ?? null;

  const buildingById = new Map((buildings.data ?? []).map((b) => [b.id as number, b]));
  const jobs: StaffJob[] = sortJobs(active).map((r) => {
    const b = r.buildingId != null ? buildingById.get(r.buildingId) : undefined;
    const before = firstPath(r.id, "once");
    const after = lastPath(r.id, "sonra");
    return {
      ...r,
      place: [b?.name, floorLabel(r.floor)].filter(Boolean).join(", ") || "Konum belirtilmemiş",
      buildingLat: b?.lat ?? r.lat,
      buildingLng: b?.lng ?? r.lng,
      beforePath: before,
      beforeUrl: before ? (url.get(before) ?? null) : null,
      afterUrl: after ? (url.get(after) ?? null) : null,
    };
  });
  const completedToday = rows
    .filter((r) => r.status === "cozuldu" && r.resolvedAt && isSameDay(r.resolvedAt))
    .map((r) => ({ id: r.id, title: r.title, resolvedAt: r.resolvedAt as string }));

  const unitId = (profile.data?.unit_id as number | null) ?? null;
  const unitList = (units.data ?? []) as { id: number; name: string }[];
  return (
    <StaffJobsView
      staffId={user.id}
      staffName={(profile.data?.full_name as string | null) || "Birim personeli"}
      unitName={unitList.find((u) => u.id === unitId)?.name ?? "Tüm birimler"}
      jobs={jobs}
      completedToday={completedToday}
      units={unitList}
      ownUnitId={unitId}
    />
  );
}

export default function StaffJobsPage() {
  return (
    <Suspense fallback={<PageSkeleton label="İşler yükleniyor" stats={4} variant="split" />}>
      <Jobs />
    </Suspense>
  );
}
