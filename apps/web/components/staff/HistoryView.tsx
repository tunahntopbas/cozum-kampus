"use client";

import { useState } from "react";
import { Photo, Pill, Stats } from "@/components/staff-demo/Shared";
import s from "@/components/staff-demo/Staff.module.css";

export type HistoryRecord = {
  id: number;
  title: string;
  place: string;
  resolvedAt: string;
  minutes: number | null;
  confidence: number | null;
  resolved: boolean | null;
  reopened: boolean;
  note: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
  steps: { label: string; at: string }[];
};

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const DAY_MS = 86_400_000;
const PERIODS = [
  ["week", "Bu hafta", 7],
  ["month", "Bu ay", 30],
  ["all", "Tümü", Infinity],
] as const;

function duration(min: number | null) {
  if (min == null) return "–";
  if (min < 60) return `${min} dk`;
  if (min < 1440) return `${Math.floor(min / 60)} sa ${min % 60} dk`;
  return `${Math.round(min / 1440)} gün`;
}

function verdictPill(r: HistoryRecord) {
  if (r.confidence == null) return <Pill tone="grey">Doğrulama yok</Pill>;
  return r.resolved ? <Pill tone="green">Doğrulandı</Pill> : <Pill tone="amber">İncelemede</Pill>;
}

export function HistoryView({ records, now: nowProp }: { records: HistoryRecord[]; now?: number }) {
  const [now] = useState(() => nowProp ?? Date.now());
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("week");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const days = PERIODS.find((p) => p[0] === period)![2];
  const inPeriod = records.filter((r) => now - new Date(r.resolvedAt).getTime() <= days * DAY_MS);
  const q = query.toLocaleLowerCase("tr");
  const visible = inPeriod.filter(
    (r) =>
      `${r.title} ${r.place} ${r.id}`.toLocaleLowerCase("tr").includes(q) &&
      (filter === "all" || (filter === "review" ? r.resolved === false : r.reopened)),
  );
  const record = visible.find((r) => r.id === selected) ?? visible[0];

  const timed = inPeriod.filter((r) => r.minutes != null);
  const avg = timed.length ? Math.round(timed.reduce((a, r) => a + (r.minutes as number), 0) / timed.length) : null;
  const scored = inPeriod.filter((r) => r.confidence != null);
  const verifiedRate = scored.length ? Math.round((scored.filter((r) => r.resolved).length / scored.length) * 100) : null;

  return (
    <>
      <header className={s.header}>
        <h1>Geçmiş</h1>
        <p>Biriminin tamamladığı işler, yapay zeka doğrulaması ve yeniden açılanlar.</p>
      </header>
      <Stats
        items={[
          ["Tamamlanan", inPeriod.length, PERIODS.find((p) => p[0] === period)![1]],
          ["Ortalama süre", duration(avg), "İşe başlamadan tamamlanmaya"],
          ["Yapay zeka doğrulaması", verifiedRate == null ? "–" : `%${verifiedRate}`, `${scored.length} fotoğraflı işte`],
          ["Yeniden açılan", inPeriod.filter((r) => r.reopened).length, "Sorun sürdüğü için"],
        ]}
      />
      <div className={s.filters}>
        <div className={s.actions} aria-label="Geçmiş dönemi">
          {PERIODS.map(([value, label]) => (
            <button
              key={value}
              className={period === value ? s.primary : s.button}
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Geçmişte ara</span>
          <input className={s.input} placeholder="İş, konum veya numara ara" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">İş durumu</span>
          <select className={s.input} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Hepsi</option>
            <option value="review">İncelemede</option>
            <option value="reopened">Yeniden açılan</option>
          </select>
        </label>
      </div>
      <div className={`${s.wide} ${s.history}`}>
        <section className={`glass ${s.compact}`} aria-label="Tamamlanan işler">
          <div className={s.tableWrap}>
            <table className={s.table} aria-label="Geçmiş işler">
              <thead>
                <tr>
                  <th scope="col">İş</th>
                  <th scope="col">Tamamlanma</th>
                  <th scope="col">Süre</th>
                  <th scope="col">Doğrulama</th>
                  <th scope="col">Durum</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className={record?.id === r.id ? s.selected : ""}>
                    <td>
                      <button onClick={() => setSelected(r.id)} aria-pressed={record?.id === r.id}>
                        {r.title}
                      </button>
                      <small>{r.place}</small>
                    </td>
                    <td>{DATE.format(new Date(r.resolvedAt))}</td>
                    <td className="mono">{duration(r.minutes)}</td>
                    <td>
                      {verdictPill(r)}
                      {r.confidence != null && <small className="mono">%{r.confidence}</small>}
                    </td>
                    <td>
                      <Pill tone={r.reopened ? "red" : "green"}>{r.reopened ? "Yeniden açıldı" : "Çözüldü"}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length && (
            <p className={s.empty}>{records.length ? "Bu filtrelere uygun iş yok." : "Henüz tamamlanan iş yok."}</p>
          )}
        </section>
        {record && (
          <section className={`glass ${s.panel}`} aria-label="Geçmiş iş detayı">
            <div>
              <p className={s.meta}>
                #{record.id} · {record.place}
              </p>
              <h2>{record.title}</h2>
            </div>
            <div className={s.photos}>
              <Photo label="Önce" src={record.beforeUrl ?? undefined} alt="Öğrencinin bildirim fotoğrafı" placeholder="Fotoğraf yok" />
              <Photo label="Sonra" src={record.afterUrl ?? undefined} alt="Çözüm fotoğrafı" placeholder="Fotoğraf yok" />
            </div>
            <ol className={s.timeline} aria-label="İş akışı">
              {record.steps.map((step, i) => (
                <li key={i}>
                  {step.label}
                  <time>{DATE.format(new Date(step.at))}</time>
                </li>
              ))}
              {record.confidence != null && (
                <li>
                  {record.resolved ? "Yapay zeka doğruladı" : "Yapay zeka doğrulayamadı"}, %{record.confidence}
                </li>
              )}
            </ol>
            {record.note && (
              <div className={s.summary}>
                <strong>Yapılan işlem</strong>
                {record.note}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
