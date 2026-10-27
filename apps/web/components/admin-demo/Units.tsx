"use client";

import { useState } from "react";
import { Buildings } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { units, peopleForUnit, reports } from "./data";
import { Badge, DemoNote, Kpis } from "./ui";
import s from "./admin.module.css";

type Staff = { name: string; unit: string; state: string; job: string; load: number; count: number };
const initialStaff: Staff[] = units.flatMap((unit) => peopleForUnit(unit.name).map((name, index) => ({ name, unit: unit.name, state: index === 3 ? "İzinli" : index === 2 || unit.staff === 2 && index === 1 ? "Müsait" : "Sahada", job: index === 0 ? "Koridor lambası yanmıyor" : index === 1 && unit.staff > 2 ? "Su sızıntısı" : "Bekliyor", load: [70, 55, 20, 0][index], count: [3, 2, 4, 0][index] })));

export function Units() {
  const [selected, setSelected] = useState("Yapı İşleri");
  const [staff, setStaff] = useState(initialStaff);
  const [assigning, setAssigning] = useState("");
  const [job, setJob] = useState("2050");
  const [assignments, setAssignments] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const team = staff.filter((person) => person.unit === selected);
  const availableJobs = reports.filter((report) => report.unit === selected && !report.person && report.status !== "Çözüldü" && !assignments.includes(report.id));
  return <>
    <DemoNote />
    <PageHeader title="Birimler" description="Birim yükü, performans ve ekip durumu." />
    <Kpis items={[
      { label: "Aktif birim", value: units.length, hint: "Kampüs genelinde" },
      { label: "Sahadaki personel", value: `${staff.filter((person) => person.state === "Sahada").length} / ${staff.length}`, hint: "Örnek ekipler" },
      { label: "Birim başı açık iş", value: "5,6", hint: "Demo ortalaması" },
      { label: "Hedef altı birim", value: "1", hint: "Yapı İşleri" },
    ]} />
    <div className={s.units}>{units.map((unit) => <button type="button" key={unit.name} aria-label={`${unit.name} ekibini göster`} aria-pressed={selected === unit.name} className={`glass ${s.panel} ${s.unit}`} onClick={() => { setSelected(unit.name); setAssigning(""); setMessage(""); }}>
      <div className={s.row}><span className="flex items-center gap-2 font-semibold"><Buildings size={24} aria-hidden />{unit.name}</span><Badge>{unit.sla < 80 ? "Hedef altı" : "Hedefte"}</Badge></div>
      <div className={s.unitStats}><span><strong>{unit.open}</strong><span className={s.small}>Açık iş</span></span><span><strong>{unit.days}</strong><span className={s.small}>Gün, ortalama</span></span><span><strong className={unit.sla < 80 ? "text-danger" : ""}>%{unit.sla}</strong><span className={s.small}>Süresinde</span></span></div>
      <div className={s.row}><span className="flex -space-x-1" aria-hidden>{peopleForUnit(unit.name).slice(0, 3).map((name) => <span key={name} className={`${s.avatar} border-2 border-white`}>{name.slice(-2)}</span>)}</span><span className={s.small}>{staff.filter((person) => person.unit === unit.name && person.state === "Sahada").length} / {unit.staff} sahada</span></div>
      <p className={s.small}>En sık: {unit.category}</p>
    </button>)}</div>
    <Glass className={`${s.panel} ${s.stack}`}><div><h2>{selected} ekibi</h2><p className={s.muted}>Örnek personel ve yerel iş ataması · Gerçek görevlendirme yapılmaz.</p></div>
      {team.map((person) => <article className={s.person} key={person.name} aria-label={person.name}>
        <div className="flex items-center gap-3"><span className={s.avatar} aria-hidden>{person.name.slice(-2)}</span><div><h3>{person.name}</h3><p className={s.small}>Demo teknisyen</p></div></div>
        <Badge>{person.state}</Badge><p>{person.state === "İzinli" ? "İzinli · Demo" : person.job}</p>
        <div><p className={s.small}>Bugün: {person.count}</p><div className={s.bar} role="img" aria-label={`${person.name} iş yükü yüzde ${person.load}`}><span style={{ width: `${person.load}%` }} /></div></div>
        {person.state === "Müsait" && <Button variant="secondary" disabled={!availableJobs.length} aria-label={`${person.name} için iş ata`} onClick={() => { setAssigning(person.name); setJob(String(availableJobs[0]?.id ?? "")); }}>İş ata</Button>}
      </article>)}
      {assigning && <form aria-label="Demo iş ataması" className={`${s.note} ${s.stack}`} onSubmit={(event) => {
        event.preventDefault();
        const report = availableJobs.find((item) => item.id === Number(job));
        if (!report) return;
        setStaff((previous) => previous.map((person) => person.name === assigning ? { ...person, state: "Sahada", job: report.title, count: person.count + 1, load: Math.min(100, person.load + 25) } : person));
        setAssignments((previous) => [...previous, report.id]);
        setMessage(`${assigning} için #${report.id} yerel demo ataması yapıldı. Gerçek iş ataması gönderilmedi.`); setAssigning("");
      }}><h3>{assigning} · İş ata</h3><label className={s.field}>Atanacak iş<select className={s.input} value={job} onChange={(event) => setJob(event.target.value)}>{availableJobs.map((report) => <option key={report.id} value={report.id}>#{report.id} · {report.title}</option>)}</select></label><div className={s.filters}><Button type="submit" disabled={!availableJobs.length}>Atamayı onayla</Button><Button variant="secondary" onClick={() => setAssigning("")}>Vazgeç</Button></div></form>}
      <p role="status" className={s.small}>{message}</p>
    </Glass>
  </>;
}
