import { Suspense } from "react";
import { MaterialsView } from "@/components/staff/MaterialsView";
import { isActiveJob, neededMaterials, REQUEST_COLUMNS, toRequest, type RequestRow, type StockItem } from "@/lib/staff";
import type { ReportStatus } from "@/lib/status";
import { createServerClient } from "@/lib/supabase/server";

async function Materials() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS limits stock and reports to the staff member's unit, and requests to their own.
  const [inventory, reports, requests] = await Promise.all([
    supabase.from("inventory").select("id, name, qty, min_qty").order("name"),
    supabase.from("reports").select("status, ai_materials").limit(200),
    supabase.from("material_requests").select(REQUEST_COLUMNS).eq("requester_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const stock: StockItem[] = (inventory.data ?? []).map((i) => ({ id: i.id, name: i.name, qty: i.qty, min: i.min_qty }));
  const active = (reports.data ?? []).filter((r) => isActiveJob(r.status as ReportStatus));
  const needed = neededMaterials(
    active.map((r) => (r.ai_materials as string[] | null) ?? []),
    stock,
  );

  return (
    <MaterialsView
      staffId={user.id}
      stock={stock}
      needed={needed}
      activeJobs={active.length}
      initialRequests={((requests.data ?? []) as RequestRow[]).map(toRequest)}
    />
  );
}

export default function StaffMaterialsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Yükleniyor</p>}>
      <Materials />
    </Suspense>
  );
}
