import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ReportsView, type ReportNote } from "@/components/admin/ReportsView";
import { ADMIN_FILTERS, type AdminFilter } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";
import { loadAdminData } from "../data";
import { loadPeople } from "../staff";

type Search = Promise<{ filtre?: string; q?: string }>;

async function Reports({ searchParams }: { searchParams: Search }) {
  const [data, params] = await Promise.all([loadAdminData(), searchParams]);
  if (!data) return null;
  const supabase = await createServerClient();
  const [{ nameOf, staff, assignments }, notes] = await Promise.all([
    loadPeople(),
    supabase.from("report_notes").select("report_id, author_id, body, created_at").order("created_at", { ascending: false }),
  ]);
  const noteList: ReportNote[] = (notes.data ?? []).map((n) => ({
    reportId: n.report_id,
    body: n.body,
    createdAt: n.created_at,
    author: nameOf.get(n.author_id) ?? "Yönetim",
  }));
  const filter = ADMIN_FILTERS.find((f) => f === params.filtre) ?? "Tümü";

  return (
    <ReportsView
      data={data}
      staff={staff}
      assignments={assignments}
      notes={noteList}
      initialFilter={filter as AdminFilter}
      initialQuery={params.q ?? ""}
    />
  );
}

export default function AdminReportsPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<PageSkeleton label="Bildirimler yükleniyor" variant="split" />}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}
