import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { NotificationsView, type AppNotification } from "@/components/notifications/NotificationsView";
import { createServerClient, getAuthUser } from "@/lib/supabase/server";

async function Notifications() {
  const supabase = await createServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return null;

  const [notifications, prefs] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, payload, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("notification_prefs").select("types").eq("user_id", user.id).maybeSingle(),
  ]);
  const list: AppNotification[] = (notifications.data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? "",
    payload: n.payload ?? {},
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
  return <NotificationsView userId={user.id} notifications={list} prefTypes={(prefs.data?.types as Record<string, unknown>) ?? {}} />;
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Bildirimler yükleniyor" variant="list" standalone />}>
      <Notifications />
    </Suspense>
  );
}
