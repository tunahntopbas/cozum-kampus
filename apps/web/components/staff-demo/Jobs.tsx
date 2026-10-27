"use client";
import { useState } from "react";
import { Check, CheckCircle, NavigationArrow, Swap } from "@phosphor-icons/react";
import { PageHeading, Photo, Pill, Stats } from "./Shared";
import s from "./Staff.module.css";
type Job = { id: number; title: string; location: string; urgency: string; category: string; distance: number; summary: string; status: number; photo?: string; note: string; team?: string };
const initial: Job[] = [
  { id: 2038, title: "Asansör kapısı kapanmıyor", location: "Bilgisayar ve Bilişim Bilimleri Fak.", urgency: "Acil", category: "Erişilebilirlik", distance: 2, summary: "Asansör kapısı açık kalıyor. Erişilebilir ulaşım için uzman ekip kontrolü gerekiyor.", status: 0, note: "" },
  { id: 2040, title: "Su sızıntısı", location: "Yemekhane girişi", urgency: "Acil", category: "Su tesisatı", distance: 3, summary: "Girişteki borudan su sızıyor, zemin kayganlaşıyor.", status: 0, note: "" },
  { id: 2041, title: "Koridor lambası yanmıyor", location: "Mühendislik Fakültesi, 2. kat", urgency: "Orta", category: "Aydınlatma", distance: 4, summary: "Tavandaki floresan armatür yanmıyor, koridor akşam karanlık kalıyor.", status: 2, note: "Floresan tüp ve starter değiştirildi" },
  { id: 2042, title: "Kırık sıra", location: "Eğitim Fakültesi, B 105", urgency: "Düşük", category: "Mobilya", distance: 4, summary: "Derslikteki sıranın bağlantısı kırık, oturak sabitlenmeli.", status: 0, note: "" },
];
const completed = ["Yurt koridorunda lamba arızası", "Kütüphane kapı kolu gevşek", "Yemekhane musluk damlatıyor"];
export function Jobs() {
  const [jobs, setJobs] = useState(initial);
  const [selected, setSelected] = useState(2041);
  const [message, setMessage] = useState("");
  const [handoff, setHandoff] = useState(false);
  const [team, setTeam] = useState("Elektrik ekibi");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const job = jobs.find(j => j.id === selected)!;
  function update(patch: Partial<Job>) { setJobs(all => all.map(j => j.id === selected ? { ...j, ...patch } : j)); }
  const done = jobs.filter(j => j.status === 4);
  const remaining = jobs.filter(j => j.status !== 4 && j.status !== 5);
  function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) { setError("10 MB altında bir görsel seç."); return; }
    setError("");
    const id = job.id;
    const reader = new FileReader();
    reader.onload = () => setJobs(all => all.map(j => j.id === id ? { ...j, photo: String(reader.result) } : j));
    reader.onerror = () => setError("Fotoğraf okunamadı, yeniden seç.");
    reader.readAsDataURL(file);
  }
  return <>
    <PageHeading title="Bugünkü işler">Teknisyen Mehmet Aksoy · 27 Ekim, Salı · Aciliyet ve mesafeye göre örnek rota.</PageHeading>
    <Stats items={[["Kalan iş", remaining.length, `${remaining.filter(j => j.urgency === "Acil").length} tanesi acil`], ["Tamamlanan", 3 + done.length, "Bugün, 08:00 sonrası"], ["Ortalama süre", "38 dk", "Örnek iş başına süre"], ["Tahmini bitiş", "15:20", "Örnek vardiya 16:00 biter"]]} />
    <div className={s.jobs}><div className={s.stack}>
      <section className={`glass ${s.compact}`} aria-label="Rota sırası"><div className={s.heading}><h2>Rota sırası</h2><span className={s.muted}>Örnek sıralama</span></div><ol className={s.list} aria-label="Bugünkü işler">{jobs.map((j, index) => <li key={j.id}><button className={s.job} aria-pressed={j.id === selected} onClick={() => { setSelected(j.id); setHandoff(false); setReason(""); setError(""); setMessage(""); }}><span className={s.number}>{index + 1}</span><span className={s.jobText}><strong>{j.title}</strong><small>{j.location}</small>{j.category === "Erişilebilirlik" && <Pill>Erişilebilirlik</Pill>}</span><span className={s.end}><Pill tone={j.status === 4 ? "green" : j.status === 5 ? "grey" : j.urgency === "Acil" ? "red" : j.urgency === "Orta" ? "amber" : "grey"}>{j.status === 4 ? "Tamamlandı" : j.status === 5 ? "Devredildi" : j.urgency}</Pill><small className={s.muted}>{j.distance} dk</small></span></button></li>)}</ol></section>
      <section className={`glass ${s.compact}`} aria-label="Tamamlananlar"><div className={s.heading}><h2>Tamamlananlar <span className={s.muted}>{3 + done.length}</span></h2></div><ul className={s.list}>{[...completed, ...done.map(j => j.title)].map((title, i) => <li key={title} className={s.completed}><CheckCircle size={20} aria-hidden /><span>{title}</span><small>{["09:10", "10:05", "11:20"][i] ?? "Demo"}</small></li>)}</ul></section>
    </div><section className={`glass ${s.panel}`} aria-label="İş detayı">
      <div className={s.heading}><div><p className={s.meta}>#{job.id} · {job.location}</p><h3>{job.title}</h3><div className={s.tags}><Pill tone={job.urgency === "Acil" ? "red" : "amber"}>Aciliyet {job.urgency.toLocaleLowerCase("tr")}</Pill><Pill>{job.category}</Pill><Pill>5 kişi bildirdi</Pill></div></div><div className={s.actions}><a className={s.button} href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`Sakarya Üniversitesi ${job.location}`)}`} target="_blank" rel="noreferrer"><NavigationArrow size={16} aria-hidden />Rota</a><button className={s.button} disabled={job.status >= 4} onClick={() => setHandoff(!handoff)} aria-expanded={handoff}><Swap size={16} aria-hidden />Devret</button></div></div>
      <p className={s.muted}>Durum: {job.status === 5 ? `Devredildi · ${job.team}` : job.status === 4 ? "Tamamlandı" : job.status === 2 ? "Başladı" : job.status === 1 ? "Yola çıktı" : "Atandı"}</p>
      {handoff && <form className={s.form} onSubmit={e => { e.preventDefault(); if (!reason.trim()) { setError("Devir nedenini yaz."); return; } update({ status: 5, team }); setHandoff(false); setMessage(`Demo iş ${team} birimine devredildi; gerçek atama yapılmadı.`); }}><label>Devralacak birim<select className={s.input} value={team} onChange={e => setTeam(e.target.value)}><option>Elektrik ekibi</option><option>Mekanik ekip</option><option>Yapı İşleri</option></select></label><label>Devir nedeni<textarea className={s.input} value={reason} onChange={e => setReason(e.target.value)} required /></label><div className={s.actions}><button className={s.primary}>Demo devri uygula</button><button type="button" className={s.button} onClick={() => setHandoff(false)}>Vazgeç</button></div></form>}
      <ol className={s.steps} aria-label="İş adımları">{["Yola çıktı", "Başladı", "Çözüm fotoğrafı", "Tamamla"].map((step, i) => <li key={step}><span className={`${s.step} ${(job.status !== 5 && (job.status > i || (i === 2 && job.photo))) ? s.stepDone : ""}`}>{job.status !== 5 && (job.status > i || (i === 2 && job.photo)) ? <Check size={16} aria-hidden /> : i + 1}</span>{step}</li>)}</ol>
      <div className={s.photos}><div className={s.photoCol}><h3>Öğrencinin fotoğrafı</h3><Photo label="Örnek bildirim" /><div className={s.summary}><strong>Örnek bildirim özeti</strong>{job.summary}</div></div><div className={s.photoCol}><h3>Çözüm fotoğrafı</h3><Photo label={job.photo ? "Yerel önizleme" : "Henüz fotoğraf seçilmedi"} src={job.photo} /><label className={s.muted}>Çözüm fotoğrafı yükle<input key={job.id} className={s.upload} type="file" accept="image/*" disabled={job.status !== 2} onChange={e => upload(e.target.files?.[0])} /></label><p className={s.muted}>Fotoğraf bu cihazda görüntülenir. Yapay zekâ analizi veya yükleme yapılmaz.</p></div></div>
      <label className={s.form}><strong className="lbl">Yapılan işlem <span className={s.muted}>isteğe bağlı</span></strong><input aria-label="Yapılan işlem" className={s.input} value={job.note} disabled={job.status >= 4} onChange={e => update({ note: e.target.value })} /></label>
      {error && <p role="alert" className={s.notice}>{error}</p>}
      {message && <p role="status" className={s.notice}>{message} Değişiklikler yalnızca bu ekranda; sayfa/sekme değişiminde sıfırlanır.</p>}
      <div className={s.footer}><p>Demo işlemi: gerçek bildirim gönderilmez, kayıtlar sunucuya yazılmaz.</p>{job.status < 2 ? <button className={s.primary} onClick={() => update({ status: job.status + 1 })}>{job.status === 0 ? "Yola çık" : "İşe başla"}</button> : <button className={s.primary} disabled={job.status !== 2 || !job.photo} onClick={() => { update({ status: 4 }); setMessage("Demo iş tamamlandı; gerçek öğrenci bildirimi gönderilmedi."); }}><Check size={20} aria-hidden />İşi tamamla</button>}</div>
    </section></div>
  </>;
}
