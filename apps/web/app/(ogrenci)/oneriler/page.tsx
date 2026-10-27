import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { SuggestionsView, type CampusScorecard, type StudentSuggestion } from "@/components/campus-voice/SuggestionsView";
import { createServerClient } from "@/lib/supabase/server";

const DAY_MS = 86_400_000;
// The scorecard covers the last 30 days.
const monthAgo = () => new Date(Date.now() - 30 * DAY_MS).toISOString();

async function Suggestions() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = monthAgo();
  const [suggestions, votes, replies, reports, units] = await Promise.all([
    supabase
      .from("suggestions")
      .select("id, author_id, is_anonymous, title, body, category, vote_count, status, created_at")
      .is("merged_into", null)
      .eq("is_hidden", false)
      .order("vote_count", { ascending: false })
      .limit(300),
    supabase.from("suggestion_votes").select("suggestion_id").eq("user_id", user.id),
    supabase.from("suggestion_replies").select("suggestion_id, body, created_at").order("created_at", { ascending: false }),
    // public_reports is the campus-wide view every student may read.
    supabase.from("public_reports").select("status, unit_id, created_at, resolved_at").gte("created_at", since).limit(2000),
    supabase.from("units").select("id, name"),
  ]);

  const reply = new Map<number, string>();
  for (const r of replies.data ?? []) if (!reply.has(r.suggestion_id)) reply.set(r.suggestion_id, r.body);
  const list: StudentSuggestion[] = (suggestions.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body ?? "",
    category: r.category ?? "Yaşam",
    votes: r.vote_count ?? 0,
    status: r.status,
    createdAt: r.created_at,
    mine: r.author_id === user.id,
    anonymous: r.is_anonymous,
    reply: reply.get(r.id) ?? null,
  }));

  const rows = (reports.data ?? []).filter((r) => r.status !== "geri_cekildi");
  const resolved = rows.filter((r) => r.status === "cozuldu" && r.resolved_at);
  const span = (r: { created_at: string; resolved_at: string }) => (Date.parse(r.resolved_at) - Date.parse(r.created_at)) / DAY_MS;
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const scorecard: CampusScorecard = {
    avgDays: avg(resolved.map(span)),
    resolved: resolved.length,
    total: rows.length,
    replyRate: list.length ? Math.round((list.filter((r) => r.reply).length / list.length) * 100) : null,
    units: (units.data ?? []).flatMap((u) => {
      const d = avg(resolved.filter((r) => r.unit_id === u.id).map(span));
      return d == null ? [] : [{ name: u.name as string, avgDays: d }];
    }),
  };

  return (
    <SuggestionsView
      userId={user.id}
      suggestions={list}
      votedIds={(votes.data ?? []).map((v) => v.suggestion_id as number)}
      scorecard={scorecard}
    />
  );
}

export default function SuggestionsPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Öneriler yükleniyor" variant="split" standalone />}>
      <Suggestions />
    </Suspense>
  );
}
