"use client";
import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { PageHeading, Pill, Stats } from "./Shared";
import s from "./Staff.module.css";
const stock = [
  { name: "LED tüp 18 W", count: 12, min: 10, fill: 60, status: "Yeterli" },
  { name: "Starter", count: 6, min: 10, fill: 30, status: "Düşük" },
  { name: "Su sızdırmazlık bandı", count: 3, min: 4, fill: 37, status: "Düşük" },
  { name: "Sıra bağlantı seti", count: 8, min: 4, fill: 100, status: "Yeterli" },
  { name: "Priz 16 A", count: 2, min: 6, fill: 16, status: "Kritik" },
  { name: "Silikon tüpü", count: 9, min: 6, fill: 75, status: "Yeterli" },
];
const needed = [{ name: "LED tüp 18 W", quantity: 4, vehicle: true }, { name: "Starter", quantity: 2, vehicle: true }, { name: "Su sızdırmazlık bandı", quantity: 1, vehicle: false }, { name: "Sıra bağlantı seti", quantity: 1, vehicle: false }];
type Request = { id: number; name: string; quantity: number; date: string; status: string; note?: string };
const initialRequests: Request[] = [{ id: 1, name: "Priz 16 A", quantity: 10, date: "Bugün 08:42", status: "Onay bekliyor" }, { id: 2, name: "Starter", quantity: 20, date: "26 Eki 16:10", status: "Hazırlanıyor" }, { id: 3, name: "LED tüp 18 W", quantity: 24, date: "25 Eki 09:30", status: "Hazır" }];
export function Materials() {
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState(initialRequests);
  const [open, setOpen] = useState(false);
  const [material, setMaterial] = useState(stock[0].name);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [missingRequested, setMissingRequested] = useState(false);
  const matches = stock.filter(item => item.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")));
  function showForm() { setOpen(true); setMessage(""); setError(""); }
  return <>
    <PageHeading title="Malzeme">Bugünkü iş listene göre örnek malzeme tahmini, depo stoğu ve taleplerin.</PageHeading>
    <Stats items={[["Bugün gerekli", "4 kalem", "Kalan 4 örnek işe göre"], ["Araçta", "2", "Hazır"], ["Depodan alınacak", "2", "Çıkmadan önce"], ["Kritik stok", "1", "Priz 16 A"]]} />
    <div className={s.wide}><section className={`glass ${s.compact}`} aria-label="Depo stoğu"><div className={s.heading}><h2>Depo stoğu</h2><span className={s.muted}>Son sayım bugün 08:00 · Demo</span></div><label><span className="sr-only">Stokta ara</span><input className={s.input} placeholder="Malzeme ara" value={query} onChange={e => setQuery(e.target.value)} /></label><div className={s.tableWrap}><table className={s.table} aria-label="Depo stoğu"><thead><tr><th scope="col">Malzeme</th><th scope="col">Stok</th><th scope="col">En az</th><th scope="col">Doluluk</th><th scope="col">Durum</th></tr></thead><tbody>{matches.map(item => <tr key={item.name}><td>{item.name}</td><td className="mono">{item.count}</td><td className="mono">{item.min}</td><td><div className={s.bar} role="meter" aria-label={`${item.name} doluluk`} aria-valuenow={item.fill} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${item.fill}%`, background: item.status === "Yeterli" ? "#15803d" : item.status === "Kritik" ? "#b91c1c" : "#d97706" }} /></div></td><td><Pill tone={item.status === "Yeterli" ? "green" : item.status === "Kritik" ? "red" : "amber"}>{item.status}</Pill></td></tr>)}</tbody></table></div>{!matches.length && <p className={s.empty}>Aramana uygun malzeme bulunamadı.</p>}</section>
    <div className={s.stack}><section className={`glass ${s.panel}`} aria-label="Bugünkü malzeme tahmini"><div><h2>Bugünkü malzeme</h2><p className={s.muted}>Kalan işler için örnek tahmin · Yapay zekâ çağrısı yapılmaz</p></div><ul className={s.list}>{needed.map(item => <li className={s.stockRow} key={item.name}><span>{item.name}</span><div className={s.actions}><span className="mono">{item.quantity}</span><Pill tone={item.vehicle ? "green" : "amber"}>{item.vehicle ? "Araçta" : "Depodan al"}</Pill></div></li>)}</ul><button className={s.primary} disabled={missingRequested} onClick={() => { setRequests(all => [...needed.filter(item => !item.vehicle).map((item, i) => ({ id: Date.now() + i, name: item.name, quantity: item.quantity, date: "Bu ekran · Demo", status: "Onay bekliyor" })), ...all]); setMissingRequested(true); setMessage("Eksikler demo taleplerine eklendi; depoya iletilmedi."); }}>{missingRequested ? "Demo taleplerine eklendi" : "Eksikleri depodan iste"}</button></section>
    <section className={`glass ${s.panel}`} aria-label="Taleplerim"><div className={s.heading}><h2>Taleplerim</h2><button className={s.button} onClick={showForm} aria-expanded={open}><Plus size={16} aria-hidden />Yeni talep</button></div>
    {open && <form className={s.form} onSubmit={e => { e.preventDefault(); const n = Number(quantity); if (!Number.isInteger(n) || n < 1 || n > 999) { setError("1–999 arasında tam sayı gir."); return; } setRequests(all => [{ id: Date.now(), name: material, quantity: n, note: note.trim(), date: "Bu ekran · Demo", status: "Onay bekliyor" }, ...all]); setOpen(false); setQuantity("1"); setNote(""); setMessage("Demo talep eklendi; depoya iletilmedi."); }}><label>Malzeme seç<select className={s.input} value={material} onChange={e => setMaterial(e.target.value)}>{stock.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label>Miktar<input className={s.input} type="number" min="1" max="999" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label>Talep notu (isteğe bağlı)<input className={s.input} value={note} onChange={e => setNote(e.target.value)} /></label><p className={s.muted}>Yalnızca demo listesine eklenir, gerçek stok ayrılmaz.</p>{error && <p role="alert">{error}</p>}<div className={s.actions}><button className={s.primary}>Demo talep oluştur</button><button type="button" className={s.button} onClick={() => setOpen(false)}>Vazgeç</button></div></form>}
    <ul className={s.list}>{requests.map(item => <li className={s.request} key={item.id}><strong>{item.name} × {item.quantity}</strong>{item.note && <p className={s.muted}>{item.note}</p>}<div className={s.heading}><span className={s.muted}>{item.date}</span><Pill tone={item.status === "Hazır" ? "green" : item.status === "Hazırlanıyor" ? "" : "amber"}>{item.status}</Pill></div></li>)}</ul></section></div></div>
    {message && <p role="status" className={s.notice}>{message} Değişiklikler yalnızca bu ekranda; sayfa/sekme değişiminde sıfırlanır.</p>}
  </>;
}
