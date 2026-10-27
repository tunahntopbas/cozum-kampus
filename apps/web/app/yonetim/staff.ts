import type { StaffMember } from "@/components/admin/ReportsView";
import { createServerClient } from "@/lib/supabase/server";

// Staff and admin names, the staff list and current assignments, shared by the reports and units screens.
export async function loadPeople() {
  const supabase = await createServerClient();
  const [profiles, assignments] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, unit_id").in("role", ["staff", "admin"]),
    supabase.from("assignments").select("report_id, staff_id"),
  ]);
  const people = profiles.data ?? [];
  const staff: StaffMember[] = people
    .filter((p) => p.role === "staff")
    .map((p) => ({ id: p.id, name: (p.full_name as string | null) || "Birim personeli", unitId: p.unit_id }));
  return {
    nameOf: new Map(people.map((p) => [p.id as string, (p.full_name as string | null) || "Yönetim"])),
    staff,
    assignments: Object.fromEntries((assignments.data ?? []).map((a) => [a.report_id, a.staff_id])) as Record<number, string>,
  };
}
