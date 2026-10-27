"use client";

import { useState } from "react";
import { BuildingsIcon, MagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Glass } from "@/components/ui/Glass";
import { statusMeta } from "@/lib/status";
import { CampusArtwork } from "./CampusArtwork";
import { Chips, DemoLabel } from "./Common";
import { ReportDetail } from "./ReportDetail";
import { buildings, reports } from "./fixtures";
import s from "./StudentDemo.module.css";

export function CampusMap() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [category, setCategory] = useState("Tüm kategoriler");
  const [status, setStatus] = useState("Tüm durumlar");
  const [selectedId, setSelectedId] = useState(2041);
  const [expanded, setExpanded] = useState("Mühendislik Fakültesi");
  const [votes, setVotes] = useState<Set<number>>(new Set());
  const [emergency, setEmergency] = useState(false);
  const visible = reports.filter(report =>
    `${report.building} ${report.place} ${report.title}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")) &&
    (filter === "Tümü" || (filter === "Acil" && report.urgent) || (filter === "Benimkiler" && report.mine) || (filter === "Erişilebilirlik" && report.accessible)) &&
    (category === "Tüm kategoriler" || report.category === category) &&
    (status === "Tüm durumlar" || statusMeta(report.status).label === status));
  const selected = visible.find(report => report.id === selectedId) ?? visible[0];
  const selectedBuilding = visible.some(report => report.building === expanded) ? expanded : selected?.building;
  function selectBuilding(name: string) {
    setExpanded(name);
    const report = visible.find(item => item.building === name);
    if (report) setSelectedId(report.id);
  }
  return <main id="icerik" className={`${s.root} ${s.mapPage}`}>
    <div className={s.mapCanvas} aria-label="Şematik kampüs haritası"><div className={s.mapArtwork}>
      <CampusArtwork />
      <div role="img" aria-label="Örnek konumun" className="absolute left-[681px] top-[381px] flex h-10 w-10 items-center justify-center rounded-full bg-accent/15"><span className="h-4 w-4 rounded-full border-2 border-white bg-accent" /></div>
      {buildings.map(building => { const matches = visible.filter(report => report.building === building.name); return matches.length > 0 && <button type="button" key={building.name} className={s.mapPin} style={{ left: building.x, top: building.y }} aria-label={`${building.name} harita işareti`} aria-pressed={selected?.building === building.name} onClick={() => selectBuilding(building.name)}>{matches.length}{matches.some(report => report.urgent) && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-danger" />}</button>; })}
    </div></div>
    <Glass className={`${s.mapLeft} ${s.stack}`}>
      <div className={s.row}><span className={s.icon}><BuildingsIcon size={24} aria-hidden="true" /></span><div><h1 className="text-base font-semibold">Çözüm Kampüs</h1><p className={s.muted}>Sakarya Üniversitesi, {reports.filter(report => report.status !== "cozuldu").length} açık bildirim</p></div></div>
      <DemoLabel />
      <label className="relative"><MagnifyingGlassIcon className="absolute left-3 top-2.5 text-muted" size={20} aria-hidden="true" /><span className="sr-only">Bina, kat ya da sorun ara</span><input className={`${s.input} pl-10`} style={{ paddingLeft: 40 }} type="search" placeholder="Bina, kat ya da sorun ara" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <Chips label="Harita filtreleri" options={["Tümü", "Acil", "Benimkiler", "Erişilebilirlik"]} value={filter} onChange={setFilter} />
      <div className="grid grid-cols-2 gap-2"><select aria-label="Kategori" className={s.input} value={category} onChange={event => setCategory(event.target.value)}>{["Tüm kategoriler", ...new Set(reports.map(report => report.category))].map(value => <option key={value}>{value}</option>)}</select><select aria-label="Durum" className={s.input} value={status} onChange={event => setStatus(event.target.value)}>{["Tüm durumlar", "Alındı", "İşlemde", "Çözüldü"].map(value => <option key={value}>{value}</option>)}</select></div>
      <div><h2 className={`${s.small} px-2 mb-1 font-semibold`}>Binalara göre · {visible.length} bildirim</h2>
        {!visible.length && <p className="p-3" role="status">Bu filtrelere uygun bildirim yok.</p>}
        {buildings.map(building => { const matches = visible.filter(report => report.building === building.name); return matches.length > 0 && <div key={building.name}><button type="button" className={`${s.item} !p-2`} aria-expanded={selectedBuilding === building.name} onClick={() => selectBuilding(building.name)}><span className={s.itemBody}><span className="font-medium">{building.name}</span><span className={s.small}>{matches.length} bildirim{matches.some(report => report.urgent) && ", 1 acil"}</span></span><span aria-hidden="true">{selectedBuilding === building.name ? "⌃" : "⌄"}</span></button>{selectedBuilding === building.name && <div className="pl-2">{matches.map(report => <button key={report.id} type="button" className={`${s.item} !p-2`} aria-pressed={selected?.id === report.id} onClick={() => setSelectedId(report.id)}><span className={s.dot} style={{ background: report.urgent ? "#b91c1c" : report.status === "cozuldu" ? "#166534" : undefined }} /><span className={s.itemBody}><span>{report.title}</span><span className={s.small}>{statusMeta(report.status).label}, {report.place}, {report.people} kişi, {report.time}</span></span></button>)}</div>}</div>; })}
      </div>
    </Glass>
    <Glass className={s.mapRight}>{selected ? <ReportDetail key={selected.id} report={selected} supported={votes.has(selected.id)} onSupport={() => setVotes(previous => { const next = new Set(previous); if (next.has(selected.id)) next.delete(selected.id); else next.add(selected.id); return next; })} /> : <p className="p-4 text-muted">Filtrelerini değiştirerek haritadan bir bildirim seç.</p>}</Glass>
    <div className={s.emergency}><button type="button" className="btn-red t flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-white font-semibold" onClick={() => setEmergency(v => !v)} aria-expanded={emergency}><WarningCircleIcon size={20} aria-hidden="true" />Acil durum</button>{emergency && <Glass className="mt-2 max-w-72 p-4"><p>Can güvenliği riski varsa 112 Acil Çağrı Merkezi’ni ara.</p><a className="mt-2 inline-block font-semibold text-danger underline" href="tel:112">112’yi ara</a></Glass>}</div>
    <Glass className={s.legend}><span className="text-danger">● Acil</span> · <span className="text-amber-700">● İşlemde</span> · <span className="text-green-800">● Çözüldü</span> · Şematik demo haritası</Glass>
  </main>;
}
