import { Suspense } from "react";
import { OverviewView } from "@/components/admin/OverviewView";
import { loadAdminData } from "./data";

async function Overview() {
  const data = await loadAdminData();
  return data ? <OverviewView data={data} /> : null;
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Yükleniyor</p>}>
      <Overview />
    </Suspense>
  );
}
