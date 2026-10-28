import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { HistoryView, type HistoryRecord } from "@/components/staff/HistoryView";
import { floorLabel } from "@/lib/campus";
import type { ReportEvent } from "@/lib/my-reports";
import { completionVerdict, jobMinutes } from "@/lib/staff";
import { statusMeta, type ReportStatus } from "@/lib/status";
import { createServerClient, getAuthUser } from "@/lib/supabase/server";

const SIGNED_URL_TTL_S = 60 * 60;

function stepLabel(e: ReportEvent): string | null {
  if (e.type === "olusturuldu") return "Bildirim alındı";
  if (e.type === "devredildi") return "Birim değişti";
  if (e.type === "durum" && typeof e.payload.to === "string") return statusMeta(e.payload.to as ReportStatus).label;
  return null;
}

async function History() {
  const supabase = await createServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return null;

  // RLS limits staff to their unit's reports.
  const [reports, buildings] = await Promise.all([
    supabase
      .from("reports")
      .select("id, title, status, building_id, floor, created_at, resolved_at")
      .in("status", ["cozuldu", "yeniden_acildi"])
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(200),
    supabase.from("building_points").select("id, name"),
  ]);
  const rows = reports.data ?? [];
  const ids = rows.map((r) => r.id as number);
  const [events, media] = ids.length
    ? await Promise.all([
        supabase.from("report_events").select("report_id, type, payload, created_at").in("report_id", ids).order("created_at"),
        supabase.from("report_media").select("report_id, kind, storage_path").in("report_id", ids).order("id"),
      ])
    : [{ data: [] }, { data: [] }];
  const mediaRows = media.data ?? [];
  const paths = mediaRows.map((m) => m.storage_path as string);
  const signed = paths.length
    ? ((await supabase.storage.from("report-media").createSignedUrls(paths, SIGNED_URL_TTL_S)).data ?? [])
    : [];
  const url = new Map(signed.map((x) => [x.path, x.signedUrl]));
  const photo = (id: number, kind: string, last = false) => {
    const list = mediaRows.filter((m) => m.report_id === id && m.kind === kind);
    const m = last ? list.at(-1) : list[0];
    return m ? (url.get(m.storage_path as string) ?? null) : null;
  };
  const buildingName = new Map((buildings.data ?? []).map((b) => [b.id as number, b.name as string]));

  const records: HistoryRecord[] = rows.map((r) => {
    const evs: ReportEvent[] = (events.data ?? [])
      .filter((e) => e.report_id === r.id)
      .map((e) => ({ type: e.type, payload: e.payload ?? {}, createdAt: e.created_at }));
    const verdict = completionVerdict(evs);
    return {
      id: r.id,
      title: r.title ?? "Bildirim",
      place: [r.building_id != null ? buildingName.get(r.building_id) : null, floorLabel(r.floor)].filter(Boolean).join(", "),
      resolvedAt: r.resolved_at,
      minutes: jobMinutes(evs, r.created_at, r.resolved_at),
      ...verdict,
      reopened: r.status === "yeniden_acildi",
      beforeUrl: photo(r.id, "once"),
      afterUrl: photo(r.id, "sonra", true),
      steps: evs.flatMap((e) => {
        const label = stepLabel(e);
        return label ? [{ label, at: e.createdAt }] : [];
      }),
    };
  });

  return <HistoryView records={records} />;
}

export default function StaffHistoryPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Geçmiş yükleniyor" stats={4} variant="split" />}>
      <History />
    </Suspense>
  );
}
