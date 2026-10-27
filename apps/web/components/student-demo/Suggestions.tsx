"use client";

import { useState, type FormEvent } from "react";
import { CaretUpIcon, SparkleIcon } from "@phosphor-icons/react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Switch } from "@/components/ui/Switch";
import { Chips, DemoLabel, Tabs } from "./Common";
import { suggestions as fixtures, type Suggestion } from "./fixtures";
import s from "./StudentDemo.module.css";

const categories = ["Kütüphane", "Yemekhane", "Ulaşım", "Akademik", "Yaşam"];
export function Suggestions() {
  const [items, setItems] = useState(fixtures);
  const [votes, setVotes] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState("Popüler");
  const [filter, setFilter] = useState("Tümü");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Yaşam");
  const [place, setPlace] = useState("Yurt");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState<number | null>(null);
  const visible = items.filter(item => (filter === "Tümü" || item.category === filter) && (tab !== "Yanıtlananlar" || item.reply)).sort((a, b) => tab === "Yeni" ? b.id - a.id : (b.votes + Number(votes.has(b.id))) - (a.votes + Number(votes.has(a.id))));
  const similar = text.toLocaleLowerCase("tr").includes("çamaşır") ? items.find(item => item.id === 6) : undefined;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) { setError("Lütfen önerini yaz."); return; }
    const newItem: Suggestion = { id: Math.max(...items.map(item => item.id)) + 1, title: text.trim(), body: `${place} için iyileştirme önerisi.`, category, votes: 0, status: "Yeni", date: "Az önce", author: anonymous ? "Anonim öğrenci" : "Sen" };
    setItems(previous => [newItem, ...previous]);
    setText(""); setTab("Yeni"); setFilter("Tümü"); setError("");
    setMessage("Önerin demo listesine eklendi. Sunucuya kaydedilmedi.");
  }
  function toggleVote(id: number) { setVotes(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  return <div className={s.root}><PageContent><PageHeader title="Kampüsün sesi" description="Önerini yaz, diğer öğrencilerin önerilerine oy ver. Yönetim yanıtları herkese açık." /><DemoLabel />
    <div className={s.columns}><Glass className={`${s.panel} !p-4`}><Tabs label="Öneri sıralaması" options={["Popüler", "Yeni", "Yanıtlananlar"]} value={tab} onChange={setTab} /><Chips label="Öneri kategorileri" options={["Tümü", ...categories]} value={filter} onChange={setFilter} />
      <div role="tabpanel" aria-label={tab}>{!visible.length && <p className="p-4 text-muted" role="status">Bu kategoride öneri yok. İlk öneriyi sen yazabilirsin.</p>}{visible.map(item => <article id={`oneri-${item.id}`} key={item.id} className={s.suggestion} style={highlight === item.id ? { background: "var(--color-tint)" } : undefined}>
        <button type="button" className={`${s.vote} mono`} aria-label={`${item.title} önerisine oy ver`} aria-pressed={votes.has(item.id)} onClick={() => toggleVote(item.id)}><CaretUpIcon size={20} aria-hidden="true" />{item.votes + Number(votes.has(item.id))}</button>
        <div className={s.itemBody}><div className={s.row}><span className={s.badge} style={item.status === "Uygulandı" ? { background: "#dcfce7", color: "#166534" } : undefined}>{item.status}</span><span className={s.small}>{item.category}</span><span className={`${s.small} mono`}>{item.date}</span></div><h2 className="text-base leading-6 font-semibold">{item.title}</h2><p className={s.muted}>{item.body}</p>{item.author && <p className={s.small}>{item.author} · {item.date}</p>}
          {item.reply ? <div className={s.reply}><p className={`${s.small} mb-1 font-semibold`}>Yönetim yanıtı, {item.unit} · Demo</p><p>{item.reply}</p></div> : <p className={`${s.small} mt-2`}>Yönetim henüz yanıtlamadı, ortalama yanıt süresi 6 gün</p>}
        </div>
      </article>)}</div>
    </Glass><div className={s.stack}><Glass className={s.panel}><div><h2 className={s.heading}>Öneri yaz</h2><p className={s.muted}>Arıza değil, iyileştirme fikri</p></div><form className={s.stack} onSubmit={submit} noValidate>
      <label className="sec"><span className="lbl">Önerin</span><textarea className={s.input} rows={4} maxLength={400} value={text} aria-invalid={!!error} aria-describedby={error ? "suggestion-error" : "suggestion-length"} placeholder="Yurt çamaşırhanesinde çalışma saatleri uzatılsın" onChange={event => { setText(event.target.value); setError(""); }} /></label>
      <div className="grid grid-cols-2 gap-2"><label className="sec"><span className={s.small}>Kategori</span><select className={s.input} value={category} onChange={event => setCategory(event.target.value)}>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label className="sec"><span className={s.small}>Konum</span><select className={s.input} value={place} onChange={event => setPlace(event.target.value)}>{["Yurt", "Kütüphane", "Kampüs geneli", "Yemekhane", "Mühendislik Fakültesi"].map(value => <option key={value}>{value}</option>)}</select></label></div>
      <p id="suggestion-length" className={`${s.small} mono text-right`}>{text.length} / 400</p>
      {similar && <div className={s.summary}><p className="lbl flex gap-2"><SparkleIcon size={18} aria-hidden="true" />Benzer öneri · Demo eşleştirmesi</p><p>“{similar.title}” önerisi {similar.votes} oya sahip. Yeni öneri açmak yerine ona oy verebilirsin.</p><a className="text-accent underline mt-1" href={`#oneri-${similar.id}`} onClick={() => { setFilter("Tümü"); setTab("Popüler"); setHighlight(similar.id); }}>Benzer öneriyi gör</a></div>}
      <div className={s.between}><span className="lbl">Adımı gizle</span><Switch label="Adımı gizle" hideLabel checked={anonymous} onChange={setAnonymous} /></div><p className={s.small}>Bu form bir demodur; metin sunucuya gönderilmez ve otomatik denetim çalıştırılmaz. Lütfen kişisel bilgi paylaşma.</p>
      {error && <p id="suggestion-error" role="alert" className="text-danger">{error}</p>}<Button type="submit">Öneriyi gönder</Button>{message && <p role="status" className={s.notice}>{message}</p>}
    </form></Glass><Glass className={s.panel}><div className={s.between}><div><h2 className={s.heading}>Kampüs karnesi</h2><p className={s.small}>Ekim 2026, herkese açık</p></div><span className={s.badge}>Demo</span></div>
      {[["Ortalama çözüm süresi", "2,4 gün"], ["Çözülen bildirim", "186 / 214"], ["Yanıtlanan öneri", "%78"], ["Öğrenci memnuniyeti", "4,2 / 5"]].map(([label, value]) => <div key={label} className={s.between}><span className={s.muted}>{label}</span><strong className="mono">{value}</strong></div>)}
      <h3 className="lbl border-t border-hairline pt-4">Birime göre ortalama çözüm süresi</h3>{[["Temizlik", "0,9 gün", 25], ["Bilgi İşlem", "1,2 gün", 35], ["Yapı İşleri", "3,1 gün", 90], ["Güvenlik", "0,4 gün", 12]].map(([label, value, width]) => <div key={label}><div className={`${s.between} mb-1`}><span>{label}</span><span className={`${s.small} mono`}>{value}</span></div><div className="h-1.5 rounded-full bg-tint"><div className="h-full rounded-full bg-ink" style={{ width: `${width}%` }} /></div></div>)}<p className={s.small}>Veriler örnektir, canlı sistemde bildirim kayıtlarından hesaplanır.</p>
    </Glass></div></div>
  </PageContent></div>;
}
