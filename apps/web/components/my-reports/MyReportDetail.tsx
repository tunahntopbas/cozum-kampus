"use client";

import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Switch } from "@/components/ui/Switch";
import { floorLabel, relativeTime } from "@/lib/campus";
import { categoryLabel, urgencyLabel } from "@/lib/labels";
import { eventTimeline, isOpen } from "@/lib/my-reports";
import s from "@/components/student-demo/StudentDemo.module.css";
import type { MyReportItem } from "./types";
import { RouteLine } from "@/components/ui/RouteLine";

type Props = {
  report: MyReportItem;
  buildingName: string;
  unitName: string;
  own: boolean;
  notify: boolean;
  busy: boolean;
  onNotify: (value: boolean) => void;
  onAddPhoto: (file: File) => void;
  onWithdraw: () => void;
};

function PhotoSlot({ url, label, empty }: { url?: string; label: string; empty: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
    return <img src={url} alt={label} className="h-36 w-full rounded-lg object-cover" />;
  }
  return (
    <div className={s.photo} role="img" aria-label={`${label}: ${empty}`}>
      <ImageIcon size={24} aria-hidden="true" />
      <span className={s.small}>{empty}</span>
    </div>
  );
}

export function MyReportDetail({ report, buildingName, unitName, own, notify, busy, onNotify, onAddPhoto, onWithdraw }: Props) {
  const [confirming, setConfirming] = useState(false);
  const steps = eventTimeline(report, report.events);
  const place = [buildingName, floorLabel(report.floor)].filter(Boolean).join(", ");
  const resolved = report.status === "cozuldu";

  return (
    <section aria-label="Seçili bildirim" className={s.stack}>
      <div className="sec">
        <p className={s.muted}>
          #{report.id}
          {place && `, ${place}`}
        </p>
        <h2 className={s.heading}>{report.title}</h2>
        <div className={s.row}>
          <StatusPill status={report.status} />
          <span className={s.badge}>{categoryLabel(report.category)}</span>
          <span className={s.badge}>Aciliyet {urgencyLabel(report.urgency).toLocaleLowerCase("tr")}</span>
        </div>
        <RouteLine key={`${report.id}-${report.status}`} status={report.status} />
      </div>

      {own && (
        <div className={s.between}>
          <div>
            <p className="lbl">Durum değişince haber ver</p>
            <p className={s.small}>Bildirim merkezine gelir</p>
          </div>
          <Switch label="Durum değişince haber ver" hideLabel checked={notify} onChange={onNotify} />
        </div>
      )}

      <div className="sec">
        <h3 className="lbl">Durum geçmişi</h3>
        <ol className={s.timeline} aria-label="Durum geçmişi">
          {steps.map((step, i) => (
            <li key={`${step.label}-${i}`} className={step.done ? undefined : s.pending}>
              <p className="font-medium">{step.label}</p>
              <p className={s.small}>
                {step.label === "Birime yönlendirildi" && step.done
                  ? [unitName, step.at && relativeTime(step.at)].filter(Boolean).join(", ")
                  : step.at
                    ? relativeTime(step.at)
                    : "Bekleniyor"}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="sec">
        <h3 className="lbl">Önce ve sonra</h3>
        <div className={s.photos}>
          <PhotoSlot url={report.photos.once[0]} label="Önce" empty="Fotoğraf eklenmemiş" />
          <PhotoSlot
            url={report.photos.sonra[0]}
            label="Sonra"
            empty={resolved ? "Çözüm fotoğrafı yok" : "Teknisyen fotoğrafı bekleniyor"}
          />
        </div>
        {report.photos.ek.length > 0 && (
          <div className={`${s.photos} mt-2`}>
            {report.photos.ek.map((url, i) => (
              <PhotoSlot key={url} url={url} label={`Ek fotoğraf ${i + 1}`} empty="" />
            ))}
          </div>
        )}
      </div>

      {report.aiSummary && (
        <div className={s.summary}>
          <h3 className={s.small}>Yapay zeka özeti</h3>
          <p>{report.aiSummary}</p>
        </div>
      )}
      <p className={s.muted}>{report.voteCount} kişi bildirdi</p>

      {own && isOpen(report.status) && (
        <>
          <label className="ghost cursor-pointer rounded-lg border border-input-border bg-white px-3 py-2 text-center">
            {busy ? "Yükleniyor" : "Ek fotoğraf ekle"}
            <input
              aria-label="Ek fotoğraf ekle"
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onAddPhoto(file);
              }}
            />
          </label>
          {confirming ? (
            <div className={s.notice}>
              <p>Bildirimi geri çekersen birim üzerinde çalışmayı bırakır. Emin misin?</p>
              <div className={`${s.row} mt-2`}>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => {
                    setConfirming(false);
                    onWithdraw();
                  }}
                >
                  Geri çekmeyi onayla
                </Button>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  Vazgeç
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" disabled={busy} onClick={() => setConfirming(true)}>
              Bildirimi geri çek
            </Button>
          )}
        </>
      )}
    </section>
  );
}
