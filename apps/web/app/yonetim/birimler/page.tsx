import { Suspense } from "react";
import { UnitsView, type UnitRequest } from "@/components/admin/UnitsView";
import { createServerClient } from "@/lib/supabase/server";
import { loadAdminData } from "../data";
import { loadPeople } from "../staff";

async function Units() {
  const data = await loadAdminData();
  if (!data) return null;
  const supabase = await createServerClient();
  const [{ nameOf, staff, assignments }, requests, inventory] = await Promise.all([
    loadPeople(),
    supabase
      .from("material_requests")
      .select("id, requester_id, item_id, qty, note, status, created_at")
      .in("status", ["onay_bekliyor", "hazirlaniyor"])
      .order("created_at"),
    supabase.from("inventory").select("id, unit_id, name, qty"),
  ]);
  const items = new Map((inventory.data ?? []).map((i) => [i.id as number, i]));
  const list: UnitRequest[] = (requests.data ?? []).flatMap((r) => {
    const item = items.get(r.item_id);
    if (!item) return [];
    return [
      {
        id: r.id,
        unitId: item.unit_id,
        item: item.name,
        stock: item.qty,
        qty: r.qty,
        note: r.note,
        status: r.status,
        requester: nameOf.get(r.requester_id) ?? "Birim personeli",
        createdAt: r.created_at,
      },
    ];
  });
  return <UnitsView data={data} staff={staff} assignments={assignments} requests={list} />;
}

export default function AdminUnitsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Yükleniyor</p>}>
      <Units />
    </Suspense>
  );
}
