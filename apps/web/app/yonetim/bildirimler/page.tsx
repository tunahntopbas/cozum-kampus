import { Suspense } from "react";
import { ReportsView, type ReportNote, type StaffMember } from "@/components/admin/ReportsView";
import { ADMIN_FILTERS, type AdminFilter } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";
import { loadAdminData } from "../data";

type Search = Promise<{ filtre?: string; q?: string }>;

async function Reports({ searchParams }: { searchParams: Search }) {
  const [data, params] = await Promise.all([loadAdminData(), searchParams]);
  if (!data) return null;
  const supabase = await createServerClient();
  const [profiles, assignments, notes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, unit_id").in("role", ["staff", "admin"]),
    supabase.from("assignments").select("report_id, staff_id"),
    supabase.from("report_notes").select("report_id, author_id, body, created_at").order("created_at", { ascending: false }),
  ]);
  const people = profiles.data ?? [];
  const nameOf = new Map(people.map((p) => [p.id as string, (p.full_name as string | null) || "Yönetim"]));
  const staff: StaffMember[] = people
    .filter((p) => p.role === "staff")
    .map((p) => ({ id: p.id, name: (p.full_name as string | null) || "Birim personeli", unitId: p.unit_id }));
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
      assignments={Object.fromEntries((assignments.data ?? []).map((a) => [a.report_id, a.staff_id]))}
      notes={noteList}
      initialFilter={filter as AdminFilter}
      initialQuery={params.q ?? ""}
    />
  );
}

export default function AdminReportsPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Yükleniyor</p>}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}
