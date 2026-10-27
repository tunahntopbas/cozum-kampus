"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { reports as initialReports, units, peopleForUnit, type DemoReport } from "./data";
import { Badge, Filters } from "./ui";
import s from "./admin.module.css";

export function Reports() {
  const [records, setRecords] = useState(initialReports);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [unit, setUnit] = useState("");
  const [selected, setSelected] = useState(2041);
  const [message, setMessage] = useState("");
  const visible = records.filter((record) => `${record.id} ${record.title} ${record.place}`.toLocaleLowerCase("tr").includes(query.trim().toLocaleLowerCase("tr")) && (!unit || record.unit === unit) && (filter === "Tümü" || filter === "Acil" && record.urgency === "Acil" || filter === "Yönlendirilmedi" && !record.unit || filter === "Gecikmiş" && record.status === "Gecikmiş" || filter === "Yeniden açılan" && record.status === "Yeniden açıldı"));
  const active = visible.find((record) => record.id === selected) ?? visible[0];
  return <>
    <PageHeader title="Bildirimler" description="Kampüsteki tüm kayıtlar, yönlendirme ve durum yönetimi." />
    <Glass className={s.toolbar}>
      <input className={`${s.input} ${s.search}`} aria-label="Bildirim ara" placeholder="Başlık, konum ya da numara ara" value={query} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} />
      <Filters label="Durum filtresi" options={["Tümü", "Acil", "Yönlendirilmedi", "Gecikmiş", "Yeniden açılan"]} value={filter} onChange={(value) => { setFilter(value); setMessage(""); }} />
      <select className={`${s.input} !w-auto max-w-full`} aria-label="Birim filtresi" value={unit} onChange={(event) => setUnit(event.target.value)}><option value="">Tüm birimler</option>{units.map((item) => <option key={item.name}>{item.name}</option>)}</select>
    </Glass>
    <p role="status" className={s.small}>{message || `${visible.length} örnek bildirim gösteriliyor`}</p>
    <div className={s.split}>
      <Glass className={s.list}><section aria-label="Bildirim listesi">
        <div className={`${s.reportRow} px-3 py-2 text-xs text-muted`} aria-hidden><span>No</span><span>Bildirim</span><span>Aciliyet</span><span>Yaş</span></div>
        {visible.length ? <ol>{visible.map((record) => <li key={record.id}><button type="button" className={`${s.listButton} ${s.reportRow}`} aria-current={active?.id === record.id ? "true" : undefined} onClick={() => { setSelected(record.id); setMessage(""); }}>
          <span className="mono text-xs text-muted">#{record.id}</span><span className={s.listText}><strong>{record.title}</strong><span className={s.small}>{record.place}</span></span><Badge>{record.urgency}</Badge><span className="mono text-xs text-muted">{record.age}</span><span className={s.reportMeta}><span className={s.small}>{record.unit || "Yönlendirilmedi"}</span><Badge>{record.status}</Badge></span>
        </button></li>)}</ol> : <p className={s.empty}>Eşleşen bildirim bulunamadı.</p>}
      </section></Glass>
      {active ? <ReportDetail key={`${active.id}-${active.unit}-${active.person}-${active.status}`} report={active} onSave={(updated) => {
        setRecords((previous) => previous.map((record) => record.id === updated.id ? updated : record));
        setMessage(`#${updated.id} değişiklikleri yalnızca bu demo oturumunda tutuldu. Veritabanına yazılmadı.`);
      }} /> : <Glass className={s.panel}><p className={s.muted}>Detay görmek için filtreleri değiştirin.</p></Glass>}
    </div>
  </>;
}

function ReportDetail({ report, onSave }: { report: DemoReport; onSave: (report: DemoReport) => void }) {
  const [draft, setDraft] = useState(report);
  return <Glass className={`${s.panel} ${s.stack}`}><section aria-label="Bildirim detayı" className={s.stack}>
    <div><p className={s.small}>#{report.id} · {report.place}</p><h2>{report.title}</h2></div><div className={s.filters}><Badge>{report.status}</Badge><Badge>{report.category}</Badge></div>
    <div className={s.note}><h3>Demo AI özeti</h3><p>{report.category} bildirimi; aciliyet {report.urgency.toLocaleLowerCase("tr")}. Hazır örnek metindir, gerçek analiz yapılmadı.</p></div>
    <form className={s.stack} onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, note: draft.note.trim(), status: draft.unit && draft.status === "Yönlendirilmedi" ? "Atandı" : draft.status }); }}>
      <label className={s.field}>Sorumlu birim<select className={s.input} value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value, person: "" })}><option value="">Yönlendirilmedi</option>{units.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
      <label className={s.field}>Aciliyet<select className={s.input} value={draft.urgency} onChange={(event) => setDraft({ ...draft, urgency: event.target.value })}>{["Düşük", "Orta", "Acil"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className={s.field}>Atanan teknisyen<select className={s.input} value={draft.person} disabled={!draft.unit} onChange={(event) => setDraft({ ...draft, person: event.target.value })}><option value="">Atanmadı</option>{peopleForUnit(draft.unit).map((person) => <option key={person}>{person}</option>)}</select></label>
      <label className={s.field}>Bildirim durumu<select className={s.input} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{["Alındı", "Yönlendirilmedi", "Atandı", "İşlemde", "Gecikmiş", "Yeniden açıldı", "Çözüldü"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className={s.field}>İç not<textarea className={s.input} rows={3} maxLength={1500} value={draft.note} aria-describedby="admin-note-hint" onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label><p id="admin-note-hint" className={s.small}>Öğrenciye görünmez · Yalnızca demo oturumunda saklanır.</p>
      <Button type="submit">Değişiklikleri kaydet</Button>
    </form>
  </section></Glass>;
}
