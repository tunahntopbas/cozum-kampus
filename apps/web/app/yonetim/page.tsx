import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { OverviewView } from "@/components/admin/OverviewView";
import { loadAdminData } from "./data";

async function Overview() {
  const data = await loadAdminData();
  return data ? <OverviewView data={data} /> : null;
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Genel bakış yükleniyor" stats={4} variant="split" />}>
      <Overview />
    </Suspense>
  );
}
