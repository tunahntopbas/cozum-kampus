"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaretUpIcon, LightbulbIcon, SparkleIcon } from "@phosphor-icons/react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Switch } from "@/components/ui/Switch";
import { Chips, TabPanels, Tabs } from "@/components/student-demo/Common";
import s from "@/components/student-demo/StudentDemo.module.css";
import { findSimilar } from "@/lib/campus-voice";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";

export type StudentSuggestion = {
  id: number;
  title: string;
  body: string;
  category: string;
  votes: number;
  status: string;
  createdAt: string;
  mine: boolean;
  anonymous: boolean;
  reply: string | null;
};
export type CampusScorecard = {
  avgDays: number | null;
  resolved: number;
  total: number;
  replyRate: number | null;
  units: { name: string; avgDays: number }[];
};

const CATEGORIES = ["Kütüphane", "Yemekhane", "Ulaşım", "Akademik", "Yaşam"];
const PLACES = ["Kampüs geneli", "Yurt", "Kütüphane", "Yemekhane", "Mühendislik Fakültesi"];
const TABS = ["Popüler", "Yeni", "Yanıtlananlar"];
const STATUS: Record<string, string> = {
  yeni: "Yeni",
  degerlendiriliyor: "Değerlendiriliyor",
  planlandi: "Planlandı",
  uygulandi: "Uygulandı",
  reddedildi: "Reddedildi",
};
const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });
const MONTH = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
const days = (n: number | null) => (n == null ? "–" : `${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün`);

export function SuggestionsView({
  userId,
  suggestions,
  votedIds,
  scorecard,
}: {
  userId: string;
  suggestions: StudentSuggestion[];
  votedIds: number[];
  scorecard: CampusScorecard;
}) {
  const router = useRouter();
  const tabsId = useId();
  const [localVotes, setLocalVotes] = useState({ source: votedIds, overrides: new Map<number, boolean>() });
  if (localVotes.source !== votedIds) {
    const serverVotes = new Set(votedIds);
    setLocalVotes({ source: votedIds, overrides: new Map([...localVotes.overrides].filter(([id, on]) => serverVotes.has(id) !== on)) });
  }
  const voted = new Set(votedIds);
  for (const [id, on] of localVotes.overrides) {
    if (on) voted.add(id);
    else voted.delete(id);
  }
  const voting = useRef(new Set<number>());
  const [pendingVotes, setPendingVotes] = useState(new Set<number>());
  const submitting = useRef(false);
  const [tab, setTab] = useState("Popüler");
  const [filter, setFilter] = useState("Tümü");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Yaşam");
  const [place, setPlace] = useState(PLACES[0]);
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);

  // Replies can be published by another session, even with notifications disabled.
  // These tables are not in the Realtime publication, so refetch the server props.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  const initial = new Set(votedIds);
  const count = (r: StudentSuggestion) => r.votes - Number(initial.has(r.id)) + Number(voted.has(r.id));
  const visible = suggestions
    .filter((r) => (filter === "Tümü" || r.category === filter) && (tab !== "Yanıtlananlar" || r.reply))
    .sort((a, b) => (tab === "Yeni" ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : count(b) - count(a)));
  const similar = text.trim().length >= 8 ? findSimilar(text, suggestions) : undefined;

  async function toggleVote(id: number) {
    if (voting.current.has(id)) return;
    voting.current.add(id);
    setPendingVotes(new Set(voting.current));
    const on = !voted.has(id);
    const previous = localVotes.overrides.get(id);
    setMessage("");
    setLocalVotes((prev) => ({ ...prev, overrides: new Map(prev.overrides).set(id, on) }));
    try {
      const table = createClient().from("suggestion_votes");
      const { error: err } = on
        ? await table.insert({ suggestion_id: id, user_id: userId })
        : await table.delete().eq("suggestion_id", id).eq("user_id", userId);
      if (err) throw err;
    } catch {
      setLocalVotes((prev) => {
        const overrides = new Map(prev.overrides);
        if (previous === undefined) overrides.delete(id);
        else overrides.set(id, previous);
        return { ...prev, overrides };
      });
      setMessage("Oy kaydedilemedi. Tekrar dene.");
    } finally {
      voting.current.delete(id);
      setPendingVotes(new Set(voting.current));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    const body = text.trim();
    if (!body) {
      setError("Lütfen önerini yaz.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const { error: err } = await createClient()
        .from("suggestions")
        .insert({
          author_id: userId,
          is_anonymous: anonymous,
          category,
          title: body.length > 120 ? `${body.slice(0, 117)}…` : body,
          body: place === PLACES[0] ? body : `${body}\nKonum: ${place}`,
        });
      if (err) throw err;
    } catch {
      setError("Öneri gönderilemedi. Tekrar dene.");
      return;
    } finally {
      submitting.current = false;
      setBusy(false);
    }
    setText("");
    setTab("Yeni");
    setFilter("Tümü");
    setError("");
    setMessage("Önerin yayınlandı. Yönetim yanıtlayınca bildirim alırsın.");
    router.refresh();
  }

  return (
    <div className={s.root}>
      <PageContent>
        <PageHeader title="Kampüsün sesi" description="Önerini yaz, diğer öğrencilerin önerilerine oy ver. Yönetim yanıtları herkese açık." />
        <div className={s.columns}>
          <Glass className={`${s.panel} !p-4`}>
            <Tabs id={tabsId} label="Öneri sıralaması" options={TABS} value={tab} onChange={setTab} />
            <Chips label="Öneri kategorileri" options={["Tümü", ...CATEGORIES]} value={filter} onChange={setFilter} />
            <TabPanels id={tabsId} options={TABS} value={tab}>
              {!visible.length && (
                <EmptyState icon={<LightbulbIcon size={22} />} title="Bu kategoride öneri yok." hint="İlk öneriyi sen yaz; diğer öğrenciler oy verebilir." />
              )}
              {visible.map((r) => (
                <article
                  id={`oneri-${r.id}`}
                  key={r.id}
                  className={s.suggestion}
                  style={highlight === r.id ? { background: "var(--color-tint)" } : undefined}
                >
                  <button
                    type="button"
                    className={`${s.vote} mono`}
                    aria-label={`${r.title} önerisine oy ver`}
                    aria-pressed={voted.has(r.id)}
                    disabled={pendingVotes.has(r.id)}
                    onClick={() => toggleVote(r.id)}
                  >
                    <CaretUpIcon size={20} aria-hidden="true" />
                    {count(r)}
                  </button>
                  <div className={s.itemBody}>
                    <div className={s.row}>
                      <span className={s.badge} style={r.status === "uygulandi" ? { background: "#dcfce7", color: "#166534" } : undefined}>
                        {STATUS[r.status] ?? r.status}
                      </span>
                      <span className={s.small}>{r.category}</span>
                      <time className={`${s.small} mono`} dateTime={r.createdAt}>
                        {DATE.format(new Date(r.createdAt))}
                      </time>
                    </div>
                    <h2 className="text-base leading-6 font-semibold">{r.title}</h2>
                    {r.body && r.body !== r.title && <p className={`${s.muted} whitespace-pre-line`}>{r.body}</p>}
                    <p className={s.small}>{r.anonymous ? "Anonim öğrenci" : r.mine ? "Senin önerin" : "Öğrenci"}</p>
                    {r.reply ? (
                      <div className={s.reply}>
                        <p className={`${s.small} mb-1 font-semibold`}>Yönetim yanıtı</p>
                        <p>{r.reply}</p>
                      </div>
                    ) : (
                      <p className={`${s.small} mt-2`}>Yönetim henüz yanıtlamadı.</p>
                    )}
                  </div>
                </article>
              ))}
            </TabPanels>
          </Glass>
          <div className={s.stack}>
            <Glass className={s.panel}>
              <div>
                <h2 className={s.heading}>Öneri yaz</h2>
                <p className={s.muted}>Arıza değil, iyileştirme fikri</p>
              </div>
              <form className={s.stack} onSubmit={submit} noValidate>
                <label className="sec">
                  <span className="lbl">Önerin</span>
                  <textarea
                    className={s.input}
                    rows={4}
                    maxLength={400}
                    value={text}
                    aria-invalid={!!error}
                    aria-describedby={error ? "suggestion-error" : "suggestion-length"}
                    placeholder="Yurt çamaşırhanesinde çalışma saatleri uzatılsın"
                    onChange={(e) => {
                      setText(e.target.value);
                      setError("");
                    }}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="sec">
                    <span className={s.small}>Kategori</span>
                    <select className={s.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORIES.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="sec">
                    <span className={s.small}>Konum</span>
                    <select className={s.input} value={place} onChange={(e) => setPlace(e.target.value)}>
                      {PLACES.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p id="suggestion-length" className={`${s.small} mono text-right`}>
                  {text.length} / 400
                </p>
                {similar && (
                  <div className={s.summary}>
                    <p className="lbl flex gap-2">
                      <SparkleIcon size={18} aria-hidden="true" />
                      Benzer öneri
                    </p>
                    <p>
                      “{similar.title}” önerisi {count(similar)} oya sahip. Yeni öneri açmak yerine ona oy verebilirsin.
                    </p>
                    <a
                      className="text-accent underline mt-1"
                      href={`#oneri-${similar.id}`}
                      onClick={() => {
                        setFilter("Tümü");
                        setTab("Popüler");
                        setHighlight(similar.id);
                      }}
                    >
                      Benzer öneriyi gör
                    </a>
                  </div>
                )}
                <div className={s.between}>
                  <span className="lbl">Adımı gizle</span>
                  <Switch label="Adımı gizle" hideLabel checked={anonymous} onChange={setAnonymous} />
                </div>
                <p className={s.small}>Öneriler herkese açıktır. Lütfen kişisel bilgi paylaşma.</p>
                {error && (
                  <p id="suggestion-error" role="alert" className="text-danger">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={busy}>
                  {busy ? "Gönderiliyor" : "Öneriyi gönder"}
                </Button>
                {message && (
                  <p role="status" className={s.notice}>
                    {message}
                  </p>
                )}
              </form>
            </Glass>
            <Glass className={s.panel}>
              <div>
                <h2 className={s.heading}>Kampüs karnesi</h2>
                <p className={s.small}>{MONTH.format(new Date())}, herkese açık</p>
              </div>
              {(
                [
                  ["Ortalama çözüm süresi", days(scorecard.avgDays)],
                  ["Çözülen bildirim", `${scorecard.resolved} / ${scorecard.total}`],
                  ["Yanıtlanan öneri", scorecard.replyRate == null ? "–" : `%${scorecard.replyRate}`],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className={s.between}>
                  <span className={s.muted}>{label}</span>
                  <strong className="mono">{value}</strong>
                </div>
              ))}
              {scorecard.units.length > 0 && (
                <>
                  <h3 className="lbl border-t border-hairline pt-4">Birime göre ortalama çözüm süresi</h3>
                  {scorecard.units.map((u) => (
                    <div key={u.name}>
                      <div className={`${s.between} mb-1`}>
                        <span>{u.name}</span>
                        <span className={`${s.small} mono`}>{days(u.avgDays)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-tint">
                        <div
                          className="h-full rounded-full bg-ink"
                          style={{ width: `${Math.min(100, Math.round((u.avgDays / Math.max(...scorecard.units.map((x) => x.avgDays))) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
              <p className={s.small}>Bildirim kayıtlarından hesaplanır.</p>
            </Glass>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
