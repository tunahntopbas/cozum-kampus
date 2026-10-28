"use client";

import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { floorLabel, relativeTime, timeline, type MapReport } from "@/lib/campus";
import { categoryLabel, urgencyLabel } from "@/lib/labels";
import s from "@/components/student-demo/StudentDemo.module.css";
import css from "./Map.module.css";
import { RouteLine } from "@/components/ui/RouteLine";

type Props = {
  report: MapReport;
  buildingName: string;
  unitName: string;
  supported: boolean;
  supportBusy: boolean;
  isMine: boolean;
  onSupport: () => void;
};

export function MapReportDetail({ report, buildingName, unitName, supported, supportBusy, isMine, onSupport }: Props) {
  const [expanded, setExpanded] = useState(false);
  const steps = timeline(report);
  const visible = expanded ? steps : steps.filter((step, i) => step.done || i === steps.findIndex((x) => !x.done));
  const place = [buildingName, floorLabel(report.floor)].filter(Boolean).join(", ");

  return (
    <section aria-label="Seçili bildirim" className={s.stack}>
      {report.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
        <img src={report.coverUrl} alt={`${report.title} fotoğrafı`} className={css.cover} />
      ) : (
        <div className={s.photo} role="img" aria-label="Bu bildirimde fotoğraf yok">
          <ImageIcon size={28} aria-hidden="true" />
          <span className={s.small}>Fotoğraf eklenmemiş</span>
        </div>
      )}
      <div className={s.mapDetails}>
        <div className="sec">
          <p className={s.muted}>{place}</p>
          <h2 className={s.heading}>{report.title}</h2>
          <div className={s.row}>
            <StatusPill status={report.status} />
            <span className={s.badge}>{categoryLabel(report.category)}</span>
            <span className={s.badge}>Aciliyet {urgencyLabel(report.urgency).toLocaleLowerCase("tr")}</span>
          </div>
        </div>
        <RouteLine status={report.status} />
        {report.aiSummary && (
          <div className={s.summary}>
            <h3 className={s.small}>Yapay zeka özeti</h3>
            <p>{report.aiSummary}</p>
          </div>
        )}
        <div className="sec">
          <h3 className="lbl">Durum geçmişi</h3>
          <ol className={s.timeline} aria-label="Durum geçmişi">
            {visible.map((step, i) => (
              <li key={step.label} className={step.done ? undefined : s.pending}>
                <p className="font-medium">{step.label}</p>
                <p className={s.small}>
                  {i === 0
                    ? relativeTime(report.createdAt)
                    : step.label === "Birime yönlendirildi"
                      ? unitName
                      : step.label === "Çözüldü" && report.resolvedAt
                        ? relativeTime(report.resolvedAt)
                        : step.done
                          ? ""
                          : "Bekleniyor"}
                </p>
              </li>
            ))}
          </ol>
        </div>
        {!isMine && (
          <Button aria-pressed={supported} disabled={supportBusy} onClick={onSupport}>
            {supported ? "Desteğimi geri al" : "Ben de yaşıyorum"}
          </Button>
        )}
        <div className={s.between}>
          <p className={s.muted}>{report.voteCount} kişi bildirdi</p>
          <button type="button" className="font-medium text-accent" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Geçmişi daralt" : "Tüm geçmişi gör"}
          </button>
        </div>
      </div>
    </section>
  );
}
