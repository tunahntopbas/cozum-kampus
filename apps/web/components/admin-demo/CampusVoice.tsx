"use client";

import { useState } from "react";
import { CaretUp, Sparkle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { suggestions, type Suggestion } from "./data";
import { Badge, Filters, Kpis } from "./ui";
import s from "./admin.module.css";

export function CampusVoice() {
  const [records, setRecords] = useState(suggestions);
  const [filter, setFilter] = useState("Yanıt bekleyen");
  const [sort, setSort] = useState("votes");
  const [selected, setSelected] = useState(1);
  const [message, setMessage] = useState("");
  const visible = records.filter((record) => filter === "Hepsi" || filter === "Yanıt bekleyen" && !record.reply.trim() || record.status === filter).sort((a, b) => sort === "votes" ? b.votes - a.votes : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const active = visible.find((record) => record.id === selected) ?? visible[0];
  const pending = records.filter((record) => !record.reply.trim()).length;
  return <>
    <PageHeader title="Kampüs sesi" description="Öğrenci önerileri, oylar ve herkese açık yönetim yanıtları." />
    <Kpis items={[
      { label: "Toplam öneri", value: records.length, hint: "Örnek veri kümesi" },
      { label: "Yanıt bekleyen", value: pending, hint: "Henüz demo yanıtı yok" },
      { label: "Planlanan", value: records.filter((record) => record.status === "Planlandı").length, hint: "Takvime alındı · Demo" },
      { label: "Yanıt oranı", value: `%${Math.round((records.length - pending) / records.length * 100)}`, hint: "Örnek önerilerde" },
    ]} />
    <p role="status" className={s.small}>{message}</p>
    <div className={`${s.split} ${s.voiceSplit}`}>
      <Glass className={s.list}><section aria-label="Öneri listesi">
        <div className={`${s.row} p-2`}><Filters label="Öneri filtresi" options={["Yanıt bekleyen", "Hepsi", "Planlandı", "Uygulandı"]} value={filter} onChange={setFilter} />
          <select aria-label="Öneri sıralaması" className={`${s.input} !w-auto`} value={sort} onChange={(event) => setSort(event.target.value)}><option value="votes">En çok oy</option><option value="newest">En yeni</option></select></div>
        {visible.length ? <ol>{visible.map((record) => <li key={record.id}><button type="button" className={s.listButton} aria-current={active?.id === record.id ? "true" : undefined} onClick={() => setSelected(record.id)}>
          <span className={s.vote}><CaretUp size={16} aria-hidden />{record.votes}</span><span className={s.listText}><span className={s.filters}><Badge>{record.status}</Badge><span className={s.small}>{record.category} · {record.date}</span></span><strong className="text-base">{record.title}</strong></span>
        </button></li>)}</ol> : <p className={s.empty}>Bu filtrede öneri bulunamadı.</p>}
      </section></Glass>
      {active ? <ReplyForm key={`${active.id}-${active.reply}-${active.status}`} suggestion={active} onPublish={(updated) => {
        setRecords((previous) => previous.map((record) => record.id === updated.id ? updated : record));
        setMessage("Yanıt ve durum yalnızca bu ekrana eklendi. Gerçek bildirim gönderilmedi; veritabanına yazılmadı.");
      }} /> : <Glass className={s.panel}><p className={s.muted}>Yanıt yazmak için başka bir filtre seçin.</p></Glass>}
    </div>
  </>;
}

function ReplyForm({ suggestion, onPublish }: { suggestion: Suggestion; onPublish: (suggestion: Suggestion) => void }) {
  const [reply, setReply] = useState(suggestion.reply);
  const [status, setStatus] = useState(suggestion.status === "Yanıt bekliyor" ? "Değerlendiriliyor" : suggestion.status);
  const [notify, setNotify] = useState(suggestion.notify);
  const [drafted, setDrafted] = useState(false);
  return <Glass className={`${s.panel} ${s.stack}`}><h2>Yanıt yaz</h2><p className={s.muted}>Herkese açık yanıt alanının demo gösterimi.</p><div className={s.note}><h3>{suggestion.title}</h3><p className={s.small}>Toplam destek {suggestion.votes} örnek oy</p></div>
    {suggestion.reply && <div className={s.note}><h3>Demo yönetim yanıtı</h3><p>{suggestion.reply}</p></div>}
    <form className={s.stack} onSubmit={(event) => { event.preventDefault(); if (reply.trim()) onPublish({ ...suggestion, reply: reply.trim(), status, notify }); }}>
      <label className={s.field}>Öneri durumu<select className={s.input} value={status} onChange={(event) => setStatus(event.target.value)}>{["Değerlendiriliyor", "Planlandı", "Uygulandı", "Reddedildi"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <div className={s.row}><label htmlFor="admin-reply" className="text-sm font-semibold">Yanıt</label><Button variant="secondary" onClick={() => { setReply(`Önerinizi ${suggestion.category.toLocaleLowerCase("tr")} birimiyle değerlendirmek üzere örnek çalışma planımıza aldık. Bu bir demo yanıt taslağıdır; gerçek bir taahhüt içermez.`); setDrafted(true); }}><Sparkle size={16} aria-hidden />Demo AI taslağı öner</Button></div>
      <textarea id="admin-reply" className={s.input} rows={5} maxLength={2000} value={reply} onChange={(event) => setReply(event.target.value)} />
      {drafted && <p className={s.small}>Hazır demo taslağı kullanıldı. Gerçek yapay zeka çağrısı yapılmadı. Yayınlamadan önce düzenleyebilirsiniz.</p>}
      <label className="flex items-center justify-between gap-3 text-sm"><span><strong>Oy verenlere haber ver</strong><span className={`block ${s.small}`}>{suggestion.votes} örnek oy · Gerçek bildirim gönderilmez</span></span><input type="checkbox" role="switch" checked={notify} onChange={(event) => setNotify(event.target.checked)} /></label>
      <Button type="submit" disabled={!reply.trim()}>Yanıtı demoda yayınla</Button>
    </form>
  </Glass>;
}
