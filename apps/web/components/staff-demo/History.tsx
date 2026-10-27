"use client";
import { useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { PageHeading, Photo, Pill, Stats } from "./Shared";
import s from "./Staff.module.css";
type Record = { id: number; title: string; location: string; date: string; minutes: number; confidence: number; approval: string; note: string; day: number };
const records: Record[] = [
  { id: 2041, title: "Koridor lambası yanmıyor", location: "Mühendislik Fakültesi, 2. kat", date: "Bugün 11:48", minutes: 44, confidence: 96, approval: "Bekliyor", note: "Floresan tüp ve starter değiştirildi.", day: 27 },
  { id: 2031, title: "Yurt koridorunda lamba arızası", location: "Yurt, 3. kat", date: "Bugün 09:10", minutes: 31, confidence: 94, approval: "Onayladı", note: "Arızalı lamba değiştirildi.", day: 27 },
  { id: 2033, title: "Kütüphane kapı kolu gevşek", location: "Kütüphane, giriş", date: "Bugün 10:05", minutes: 22, confidence: 91, approval: "Bekliyor", note: "Kapı kolu bağlantıları sıkıldı.", day: 27 },
  { id: 2037, title: "Yemekhane musluk damlatıyor", location: "Yemekhane, mutfak", date: "Bugün 11:20", minutes: 35, confidence: 89, approval: "Bekliyor", note: "Musluk contası değiştirildi.", day: 27 },
  { id: 2028, title: "Derslik projeksiyon askısı", location: "Eğitim Fakültesi, B 105", date: "26 Eki 15:30", minutes: 52, confidence: 71, approval: "Bekliyor", note: "Projeksiyon askısı sabitlendi. İnceleme bekleniyor.", day: 26 },
  { id: 2024, title: "Merdiven korkuluğu gevşek", location: "Fen Edebiyat Fakültesi", date: "26 Eki 10:12", minutes: 47, confidence: 93, approval: "Onayladı", note: "Korkuluk bağlantıları güçlendirildi.", day: 26 },
  { id: 2019, title: "Yemekhane girişinde su birikintisi", location: "Yemekhane, giriş", date: "25 Eki 14:02", minutes: 28, confidence: 97, approval: "Yeniden açıldı", note: "Gider temizlendi. Öğrenci sorunun sürdüğünü bildirdi.", day: 25 },
  { id: 2012, title: "Otopark aydınlatması", location: "Açık otopark", date: "24 Eki 17:40", minutes: 65, confidence: 92, approval: "Onayladı", note: "Aydınlatma armatürü yenilendi.", day: 24 },
];
export function History() {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("week");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(2041);
  const visible = records.filter(r => `${r.title} ${r.location} ${r.id}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")) && (period !== "week" || r.day >= 26) && (filter === "all" || (filter === "review" ? r.confidence < 80 : r.approval === "Yeniden açıldı")));
  const record = visible.find(r => r.id === selected) ?? visible[0];
  return <>
    <PageHeading title="Geçmiş">Tamamladığın işler, örnek doğrulama sonuçları ve öğrenci onayı.</PageHeading>
    <Stats items={[["Bu hafta tamamlanan", "17", "Geçen hafta 14 · örnek toplam"], ["Ortalama süre", "34 dk", "İş başına"], ["Yapay zeka doğrulaması", "%94", "Örnek doğrulama oranı"], ["Yeniden açılan", "1", 'Öğrenci “hâlâ sorun var” dedi']]} />
    <div className={s.filters}><div className={s.actions} aria-label="Geçmiş dönemi">{[["week", "Bu hafta"], ["month", "Bu ay"], ["all", "Tümü"]].map(([value, label]) => <button key={value} className={period === value ? s.primary : s.button} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}</div><label><span className="sr-only">Geçmişte ara</span><input className={s.input} placeholder="İş, konum veya numara ara" value={query} onChange={e => setQuery(e.target.value)} /></label><label><span className="sr-only">İş durumu</span><select className={s.input} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Hepsi</option><option value="review">İncelemede</option><option value="reopened">Yeniden açılan</option></select></label></div>
    <div className={`${s.wide} ${s.history}`}><section className={`glass ${s.compact}`} aria-label="Tamamlanan işler"><div className={s.tableWrap}><table className={s.table} aria-label="Geçmiş işler"><thead><tr><th scope="col">İş</th><th scope="col">Tamamlanma</th><th scope="col">Süre</th><th scope="col">Doğrulama</th><th scope="col">Öğrenci onayı</th></tr></thead><tbody>{visible.map(r => <tr key={r.id} className={record?.id === r.id ? s.selected : ""}><td><button onClick={() => setSelected(r.id)} aria-pressed={record?.id === r.id}>{r.title}</button><small>{r.location}</small></td><td>{r.date}</td><td className="mono">{r.minutes} dk</td><td><Pill tone={r.confidence < 80 ? "amber" : "green"}>{r.confidence < 80 ? "İncelemede" : "Doğrulandı"}</Pill><small className="mono">%{r.confidence} · örnek</small></td><td><Pill tone={r.approval === "Onayladı" ? "green" : r.approval === "Yeniden açıldı" ? "red" : "grey"}>{r.approval}</Pill></td></tr>)}</tbody></table></div>{!visible.length && <p className={s.empty}>Aramana uygun iş bulunamadı.</p>}</section>
    {record && <section className={`glass ${s.panel}`} aria-label="Geçmiş iş detayı"><div><p className={s.meta}>#{record.id} · {record.location}</p><h2>{record.title}</h2></div><div className={s.photos}><Photo label="Önce" /><Photo label="Sonra" /></div><p className={s.muted}>Örnek geçmiş kayıt; fotoğraf ve doğrulama alanları demo amaçlıdır. Yeni analiz yapılmaz.</p><ol className={s.timeline} aria-label="İş akışı"><li>Yönlendirildi, Yapı İşleri<time>09:13</time></li><li>Teknisyen atandı<time>10:40</time></li><li>Yola çıktı<time>10:52</time></li><li>Çözüm fotoğrafı yüklendi<time>{record.date.split(" ").at(-1)}</time></li><li>{record.confidence < 80 ? "Örnek doğrulama incelemede" : `Örnek doğrulama, %${record.confidence}`}</li><li>Öğrenci onayı: {record.approval}</li></ol><div className={s.summary}><strong>Yapılan işlem</strong>{record.note}</div><a className={s.button} download={`demo-is-${record.id}.txt`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(`DEMO VERİLERİ — Gerçek iş raporu değildir.\n#${record.id} ${record.title}\n${record.location}\n${record.note}\nÖğrenci onayı: ${record.approval}`)}`}><DownloadSimple size={16} aria-hidden />Demo raporu indir</a></section>}
    </div>
  </>;
}
