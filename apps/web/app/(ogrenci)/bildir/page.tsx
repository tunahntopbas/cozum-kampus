import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import type { QrPlace } from "@/components/report/LocationPicker";
import { ReportComposer } from "@/components/report/ReportComposer";
import { createServerClient, getAuthUser } from "@/lib/supabase/server";

async function Composer({ searchParams }: { searchParams: PageProps<"/bildir">["searchParams"] }) {
  const { yer } = await searchParams;
  const supabase = await createServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return null;

  const qrCode = typeof yer === "string" ? yer : null;
  const [buildings, units, place] = await Promise.all([
    supabase.from("buildings").select("id, name, floors").order("name"),
    supabase.from("units").select("id, slug"),
    qrCode
      ? supabase.from("places").select("id, name, floor, building_id, buildings(name)").eq("qr_code", qrCode).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const p = place.data as
    | { id: number; name: string; floor: number | null; building_id: number; buildings: { name: string } | null }
    | null;
  const qrPlace: QrPlace | null = p
    ? { id: p.id, name: p.name, floor: p.floor, buildingId: p.building_id, buildingName: p.buildings?.name ?? "" }
    : null;

  return (
    <ReportComposer
      userId={user.id}
      buildings={buildings.data ?? []}
      unitIdBySlug={Object.fromEntries((units.data ?? []).map((u) => [u.slug, u.id]))}
      qrPlace={qrPlace}
    />
  );
}

export default function ReportPage({ searchParams }: PageProps<"/bildir">) {
  return (
    <PageContent>
      <PageHeader
        title="Sorun bildir"
        description="Bir fotoğraf yeterli. Kategoriyi, aciliyeti ve sorumlu birimi yapay zeka belirler."
      />
      <Suspense fallback={<PageSkeleton label="Form hazırlanıyor" variant="form" />}>
        <Composer searchParams={searchParams} />
      </Suspense>
    </PageContent>
  );
}
