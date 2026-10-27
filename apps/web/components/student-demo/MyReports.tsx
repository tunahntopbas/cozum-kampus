"use client";

import { useId, useState } from "react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { StatusPill } from "@/components/ui/StatusPill";
import { Chips, DemoLabel, TabPanels, Tabs } from "./Common";
import { reports as fixtures } from "./fixtures";
import { ReportDetail } from "./ReportDetail";
import s from "./StudentDemo.module.css";

export function MyReports() {
  const tabsId = useId();
  const [reports, setReports] = useState(fixtures);
  const [tab, setTab] = useState("Açtıklarım");
  const [filter, setFilter] = useState("Tümü");
  const [selectedId, setSelectedId] = useState(2041);
  const [preferences, setPreferences] = useState<Record<number, boolean>>({});
  const visible = reports.filter(report => (tab === "Açtıklarım" ? report.mine : report.supported) && (filter === "Tümü" || (filter === "Çözüldü" ? report.status === "cozuldu" : report.status !== "cozuldu" && report.status !== "geri_cekildi")));
  const selected = visible.find(report => report.id === selectedId) ?? visible[0];
  const mine = reports.filter(report => report.mine);
  return <div className={s.root}><PageContent><PageHeader title="Bildirimlerim" description="Açtığın ve desteklediğin bildirimlerin durumu, çözülene kadar burada." /><DemoLabel />
    <div className={s.stats}>{[["Açık bildirim", mine.filter(r => r.status !== "cozuldu" && r.status !== "geri_cekildi").length, "1 tanesi acil"], ["Çözülen", mine.filter(r => r.status === "cozuldu").length, "Bu ay"], ["Desteklediklerin", reports.filter(r => r.supported).length, "Ben de yaşıyorum dediklerin"]].map(([title, count, note]) => <Glass className={s.stat} key={title}><p className={s.muted}>{title}</p><strong className="mono">{count}</strong><p className={s.small}>{note}</p></Glass>)}</div>
    <div className={s.reportsColumns}><Glass className={`${s.panel} !p-4`}><Tabs id={tabsId} label="Bildirimlerim sekmeleri" options={["Açtıklarım", "Desteklediklerim"]} value={tab} onChange={setTab} /><Chips label="Bildirim durumu" options={["Tümü", "Açık", "Çözüldü"]} value={filter} onChange={setFilter} />
      <TabPanels id={tabsId} options={["Açtıklarım", "Desteklediklerim"]} value={tab}>{!visible.length && <p role="status" className="p-4 text-muted">Bu filtrelere uygun bildirim yok.</p>}{visible.map(report => <button type="button" className={s.item} aria-pressed={selected?.id === report.id} onClick={() => setSelectedId(report.id)} key={report.id}><span className={s.dot} style={{ background: report.urgent ? "#b91c1c" : report.status === "cozuldu" ? "#166534" : undefined }} /><span className={s.itemBody}><span className="font-medium">{report.title}</span><span className={s.small}>{report.building}, {report.place}</span><span className={s.row}><StatusPill status={report.status} />{report.urgent && <span className="text-danger text-xs font-semibold">Acil</span>}</span></span><span className={`${s.small} mono`}>{report.time}</span></button>)}</TabPanels>
    </Glass><Glass className={s.panel}>{selected ? <ReportDetail key={selected.id} personal report={selected} notify={preferences[selected.id] ?? true} onNotify={value => setPreferences(previous => ({ ...previous, [selected.id]: value }))} onWithdraw={() => setReports(previous => previous.map(report => report.id === selected.id ? { ...report, status: "geri_cekildi" } : report))} /> : <p className={s.muted}>Görüntülenecek bildirim yok. Başka bir filtre seçebilirsin.</p>}</Glass></div>
  </PageContent></div>;
}
