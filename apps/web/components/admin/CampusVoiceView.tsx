"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretUp, Sparkle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { Badge, Filters, Kpis } from "@/components/admin-demo/ui";
import s from "@/components/admin-demo/admin.module.css";
import { AiRequestError, draftReply, type DraftInput } from "@/lib/ai";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { Lightbulb as LightbulbIcon_ } from "@phosphor-icons/react";
import { SheetPanes } from "@/components/layout/Panes";

type SuggestionStatus = DraftInput["status"];

export type AdminSuggestion = {
  id: number;
  title: string;
  body: string;
  category: string;
  votes: number;
  status: SuggestionStatus;
  createdAt: string;
  reply: { body: string; createdAt: string } | null;
};

export const SUGGESTION_LABEL: Record<SuggestionStatus, string> = {
  yeni: "Yanıt bekliyor",
  degerlendiriliyor: "Değerlendiriliyor",
  planlandi: "Planlandı",
  uygulandi: "Uygulandı",
  reddedildi: "Reddedildi",
};
const REPLY_STATUSES: SuggestionStatus[] = ["degerlendiriliyor", "planlandi", "uygulandi", "reddedildi"];
const FILTERS = ["Yanıt bekleyen", "Hepsi", "Planlandı", "Uygulandı"];
const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });

export function CampusVoiceView({ suggestions }: { suggestions: AdminSuggestion[] }) {
  const [filter, setFilter] = useState("Yanıt bekleyen");
  const [sort, setSort] = useState("votes");
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const visible = suggestions
    .filter((r) => filter === "Hepsi" || (filter === "Yanıt bekleyen" ? !r.reply : SUGGESTION_LABEL[r.status] === filter))
    .sort((a, b) => (sort === "votes" ? b.votes - a.votes : Date.parse(b.createdAt) - Date.parse(a.createdAt)));
  const active = visible.find((r) => r.id === selected) ?? visible[0];
  const pending = suggestions.filter((r) => !r.reply).length;

  return (
    <>
      <PageHeader title="Kampüs sesi" description="Öğrenci önerileri, oylar ve herkese açık yönetim yanıtları." />
      <Kpis
        items={[
          { label: "Toplam öneri", value: suggestions.length, hint: `${suggestions.reduce((a, r) => a + r.votes, 0)} oy` },
          { label: "Yanıt bekleyen", value: pending, hint: "Henüz yanıt yazılmadı" },
          { label: "Planlanan", value: suggestions.filter((r) => r.status === "planlandi").length, hint: "Takvime alındı" },
          {
            label: "Yanıt oranı",
            value: suggestions.length ? `%${Math.round(((suggestions.length - pending) / suggestions.length) * 100)}` : "–",
            hint: "Yanıtlanan öneriler",
          },
        ]}
      />
      <p role="status" className={s.small}>
        {message}
      </p>
      <SheetPanes className={`${s.split} ${s.voiceSplit}`} openOn={`.${s.listButton}`} label="Öneri yanıtını">
        <Glass className={s.list}>
          <section aria-label="Öneri listesi">
            <div className={`${s.row} p-2`}>
              <Filters label="Öneri filtresi" options={FILTERS} value={filter} onChange={setFilter} />
              <select aria-label="Öneri sıralaması" className={`${s.input} !w-auto`} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="votes">En çok oy</option>
                <option value="newest">En yeni</option>
              </select>
            </div>
            {visible.length ? (
              <ol>
                {visible.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={s.listButton}
                      aria-current={active?.id === r.id ? "true" : undefined}
                      onClick={() => setSelected(r.id)}
                    >
                      <span className={s.vote}>
                        <CaretUp size={16} aria-hidden />
                        {r.votes}
                      </span>
                      <span className={s.listText}>
                        <span className={s.filters}>
                          <Badge>{SUGGESTION_LABEL[r.status]}</Badge>
                          <span className={s.small}>
                            {r.category} · {DATE.format(new Date(r.createdAt))}
                          </span>
                        </span>
                        <strong className="text-base">{r.title}</strong>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={<LightbulbIcon_ size={22} />} title={suggestions.length ? "Bu filtrede öneri bulunamadı." : "Henüz öneri yok."} hint={suggestions.length ? "Hepsi filtresiyle tüm önerileri gör." : "Öğrenciler öneri yazınca burada listelenir."} />
            )}
          </section>
        </Glass>
        {active ? (
          <ReplyForm key={`${active.id}-${active.reply?.createdAt ?? ""}-${active.status}`} suggestion={active} onPublished={setMessage} />
        ) : (
          <Glass className={s.panel}>
            <p className={s.muted}>Yanıt yazmak için başka bir filtre seçin.</p>
          </Glass>
        )}
      </SheetPanes>
    </>
  );
}

function ReplyForm({ suggestion, onPublished }: { suggestion: AdminSuggestion; onPublished: (message: string) => void }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<SuggestionStatus>(suggestion.status === "yeni" ? "degerlendiriliyor" : suggestion.status);
  const [notify, setNotify] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function draft() {
    setDrafting(true);
    setError("");
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    try {
      const result = await draftReply(
        { title: suggestion.title, body: suggestion.body, category: suggestion.category, votes: suggestion.votes, status },
        session?.access_token ?? "",
      );
      if (result.ai_pending || !result.reply) setError("Yapay zeka şu an taslak yazamadı. Yanıtı kendin yazabilirsin.");
      else {
        setReply(result.reply);
        setDrafted(true);
      }
    } catch (e) {
      setError(e instanceof AiRequestError && e.status === 403 ? "Taslak yalnızca yönetim içindir." : "Taslak alınamadı.");
    }
    setDrafting(false);
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await createClient().rpc("publish_suggestion_reply", {
      sid: suggestion.id,
      body: reply.trim(),
      to_status: status,
      notify,
    });
    setBusy(false);
    if (err) {
      setError("Yanıt yayınlanamadı. Tekrar dene.");
      return;
    }
    onPublished(notify ? `Yanıt yayınlandı, ${data ?? 0} kişiye bildirim gönderildi.` : "Yanıt yayınlandı.");
    router.refresh();
  }

  return (
    <Glass className={`${s.panel} ${s.stack}`}>
      <h2>Yanıt yaz</h2>
      <p className={s.muted}>Yanıt öneri sayfasında herkese açık görünür.</p>
      <div className={s.note}>
        <h3>{suggestion.title}</h3>
        {suggestion.body && <p>{suggestion.body}</p>}
        <p className={s.small}>Toplam destek {suggestion.votes} oy</p>
      </div>
      {suggestion.reply && (
        <div className={s.note}>
          <h3>Son yönetim yanıtı</h3>
          <p>{suggestion.reply.body}</p>
          <p className={s.small}>{DATE.format(new Date(suggestion.reply.createdAt))}</p>
        </div>
      )}
      <form className={s.stack} onSubmit={publish}>
        <label className={s.field}>
          Öneri durumu
          <select className={s.input} value={status} onChange={(e) => setStatus(e.target.value as SuggestionStatus)}>
            {REPLY_STATUSES.map((v) => (
              <option key={v} value={v}>
                {SUGGESTION_LABEL[v]}
              </option>
            ))}
          </select>
        </label>
        <div className={s.row}>
          <label htmlFor="admin-reply" className="text-sm font-semibold">
            Yanıt
          </label>
          <Button variant="secondary" disabled={drafting} onClick={draft}>
            <Sparkle size={16} aria-hidden />
            {drafting ? "Taslak yazılıyor" : "Yapay zeka taslağı öner"}
          </Button>
        </div>
        <textarea id="admin-reply" className={s.input} rows={5} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} />
        {drafted && <p className={s.small}>Yapay zeka taslağı. Yayınlamadan önce gözden geçir.</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <strong>Oy verenlere haber ver</strong>
            <span className={`block ${s.small}`}>Öneri sahibi ve oy verenler bildirim alır</span>
          </span>
          <input type="checkbox" role="switch" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        </label>
        <Button type="submit" disabled={busy || !reply.trim()}>
          {busy ? "Yayınlanıyor" : "Yanıtı yayınla"}
        </Button>
      </form>
    </Glass>
  );
}
