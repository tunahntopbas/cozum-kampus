import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { CampusVoiceView, type AdminSuggestion } from "@/components/admin/CampusVoiceView";
import { createServerClient } from "@/lib/supabase/server";

async function CampusVoice() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [suggestions, replies] = await Promise.all([
    supabase
      .from("suggestions")
      .select("id, title, body, category, vote_count, status, created_at")
      .is("merged_into", null)
      .order("vote_count", { ascending: false })
      .limit(300),
    supabase.from("suggestion_replies").select("suggestion_id, body, created_at").order("created_at", { ascending: false }),
  ]);
  const latest = new Map<number, { body: string; createdAt: string }>();
  for (const r of replies.data ?? []) {
    if (!latest.has(r.suggestion_id)) latest.set(r.suggestion_id, { body: r.body, createdAt: r.created_at });
  }
  const list: AdminSuggestion[] = (suggestions.data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body ?? "",
    category: s.category ?? "Diğer",
    votes: s.vote_count ?? 0,
    status: s.status,
    createdAt: s.created_at,
    reply: latest.get(s.id) ?? null,
  }));
  return <CampusVoiceView suggestions={list} />;
}

export default function AdminCampusVoicePage() {
  return (
    <Suspense fallback={<PageSkeleton label="Öneriler yükleniyor" stats={4} variant="split" />}>
      <CampusVoice />
    </Suspense>
  );
}
