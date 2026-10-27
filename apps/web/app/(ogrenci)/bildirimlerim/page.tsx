import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyReportsView } from "@/components/my-reports/MyReportsView";
import type { MyReportItem, ReportPhotos } from "@/components/my-reports/types";
import { toMapReport, type ReportRow } from "@/lib/campus";
import { createServerClient } from "@/lib/supabase/server";
import s from "@/components/student-demo/StudentDemo.module.css";

const SIGNED_URL_TTL_S = 60 * 60;
const REPORT_COLUMNS =
  "id, reporter_id, title, description, category, urgency, status, unit_id, building_id, floor, ai_summary, vote_count, created_at, resolved_at";

async function MyReports({ searchParams }: { searchParams: PageProps<"/bildirimlerim">["searchParams"] }) {
  const { yeni } = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [mineRes, votesRes, buildings, units, prefs] = await Promise.all([
    supabase.from("reports").select(REPORT_COLUMNS).eq("reporter_id", user.id).order("created_at", { ascending: false }),
    supabase.from("report_votes").select("report_id").eq("user_id", user.id),
    supabase.from("building_points").select("id, name"),
    supabase.from("units").select("id, name"),
    supabase.from("notification_prefs").select("types").eq("user_id", user.id).maybeSingle(),
  ]);
  const mineRows = (mineRes.data ?? []) as ReportRow[];
  const mineIds = mineRows.map((r) => r.id);
  const votedIds = (votesRes.data ?? []).map((v) => v.report_id as number).filter((id) => !mineIds.includes(id));

  const [events, media, supportedRes] = await Promise.all([
    mineIds.length
      ? supabase.from("report_events").select("report_id, type, payload, created_at").in("report_id", mineIds)
      : Promise.resolve({ data: [] }),
    mineIds.length
      ? supabase.from("report_media").select("report_id, kind, storage_path").in("report_id", mineIds).order("id")
      : Promise.resolve({ data: [] }),
    votedIds.length
      ? supabase
          .from("public_reports")
          .select(`${REPORT_COLUMNS}, cover_path`)
          .in("id", votedIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  type MediaRow = { report_id: number; kind: keyof ReportPhotos; storage_path: string };
  type SupportedRow = ReportRow & { cover_path: string | null };
  const mediaRows = (media.data ?? []) as MediaRow[];
  const supportedRows = (supportedRes.data ?? []) as SupportedRow[];
  const paths = [
    ...mediaRows.map((m) => m.storage_path),
    ...supportedRows.map((r) => r.cover_path).filter((p): p is string => !!p),
  ];
  const signed = paths.length
    ? ((await supabase.storage.from("report-media").createSignedUrls(paths, SIGNED_URL_TTL_S)).data ?? [])
    : [];
  const url = new Map(signed.map((x) => [x.path, x.signedUrl]));

  const mine: MyReportItem[] = mineRows.map((r) => {
    const photos: ReportPhotos = { once: [], sonra: [], ek: [] };
    for (const m of mediaRows) {
      const u = m.report_id === r.id ? url.get(m.storage_path) : undefined;
      if (u) photos[m.kind].push(u);
    }
    return {
      ...toMapReport(r, photos.once[0] ?? null),
      events: (events.data ?? [])
        .filter((e) => e.report_id === r.id)
        .map((e) => ({ type: e.type, payload: e.payload ?? {}, createdAt: e.created_at })),
      photos,
    };
  });
  const supported: MyReportItem[] = supportedRows.map((r) => {
    const cover = r.cover_path ? (url.get(r.cover_path) ?? null) : null;
    return { ...toMapReport(r, cover), events: [], photos: { once: cover ? [cover] : [], sonra: [], ek: [] } };
  });

  const prefTypes = (prefs.data?.types ?? {}) as Record<string, unknown>;
  const newId = typeof yeni === "string" && /^\d+$/.test(yeni) ? Number(yeni) : null;

  return (
    <MyReportsView
      userId={user.id}
      mine={mine}
      supported={supported}
      buildingNames={Object.fromEntries((buildings.data ?? []).map((b) => [b.id, b.name]))}
      unitNames={Object.fromEntries((units.data ?? []).map((u) => [u.id, u.name]))}
      mutedIds={Array.isArray(prefTypes.muted_reports) ? (prefTypes.muted_reports as number[]) : []}
      prefTypes={prefTypes}
      newId={newId}
    />
  );
}

export default function MyReportsPage({ searchParams }: PageProps<"/bildirimlerim">) {
  return (
    <div className={s.root}>
      <PageContent>
        <PageHeader title="Bildirimlerim" description="Açtığın ve desteklediğin bildirimlerin durumu, çözülene kadar burada." />
        <Suspense fallback={<PageSkeleton label="Bildirimlerin yükleniyor" stats={3} variant="split" standalone />}>
          <MyReports searchParams={searchParams} />
        </Suspense>
      </PageContent>
    </div>
  );
}
