"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Switch } from "@/components/ui/Switch";
import { Photo } from "./Common";
import type { DemoReport } from "./fixtures";
import s from "./StudentDemo.module.css";

export function ReportDetail({ report, personal = false, supported, onSupport, notify = true, onNotify, onWithdraw }: {
  report: DemoReport; personal?: boolean; supported?: boolean; onSupport?: () => void;
  notify?: boolean; onNotify?: (value: boolean) => void; onWithdraw?: () => void;
}) {
  const [expanded, setExpanded] = useState(personal);
  const [withdraw, setWithdraw] = useState(false);
  const [attachment, setAttachment] = useState("");
  const resolved = report.status === "cozuldu";
  const active = report.status === "islemde" || resolved;
  return <section aria-label="Seçili bildirim" className={s.stack}>
    {!personal && <Photo label="Bildirim fotoğrafı" />}
    <div className={personal ? s.stack : s.mapDetails}>
      <div className="sec">
        <p className={s.muted}>{personal && `#${report.id}, `}{report.building}, {report.place}</p>
        <h2 className={s.heading}>{report.title}</h2>
        <div className={s.row}><StatusPill status={report.status} /><span className={s.badge}>{report.category}</span><span className={s.badge}>Aciliyet {report.urgent ? "yüksek" : "orta"}</span></div>
      </div>
      {personal && <div className={s.between}><div><p className="lbl">Durum değişince haber ver</p><p className={s.small}>Bildirim olarak gelir · Demo tercihi</p></div><Switch label="Durum değişince haber ver" hideLabel checked={notify} onChange={onNotify ?? (() => {})} /></div>}
      {!personal && <div className={s.summary}><h3 className={s.small}>Yapay zeka özeti · Örnek</h3><p>{report.category} bildirimi olarak sınıflandırıldı ve {report.unit} birimine yönlendirildi.</p></div>}
      <div className="sec"><h3 className="lbl">Durum geçmişi</h3><ol className={s.timeline} aria-label="Durum geçmişi">
        <li><p className="font-medium">Bildirim alındı</p><p className={s.small}>09:12</p></li>
        {expanded && <li><p className="font-medium">Yapay zeka sınıflandırdı</p><p className={s.small}>{report.category}, aciliyet {report.urgent ? "yüksek" : "orta"}, 09:12</p></li>}
        <li className={report.status === "alindi" ? s.pending : undefined}><p className="font-medium">Birime yönlendirildi</p><p className={s.small}>{report.unit}{report.status === "alindi" ? " · Yönlendirme bekleniyor" : ", 09:13"}</p></li>
        <li className={!active ? s.pending : undefined}><p className="font-semibold">İşlemde</p><p className={s.small}>{active ? "Teknisyen atandı, 10:40" : "Teknisyen atanması bekleniyor"}</p></li>
        <li className={!resolved ? s.pending : undefined}><p className="font-medium">Çözüldü</p><p className={s.small}>{resolved ? "Çözüm doğrulandı, 24 Eki 15:30" : "Çözüm fotoğrafı yapay zekayla doğrulanır"}</p></li>
        {report.status === "geri_cekildi" && <li><p>Demo: bildirimi geri çektin</p><p className={s.small}>Az önce</p></li>}
      </ol></div>
      {personal && <><div className="sec"><h3 className="lbl">Önce ve sonra</h3><div className={s.photos}><Photo label="Önce, 09:12" /><Photo label={resolved ? "Sonra, çözüm doğrulandı" : "Sonra · Teknisyen fotoğrafı bekleniyor"} /></div></div><div className={s.summary}><h3 className={s.small}>Yapay zeka özeti · Örnek</h3><p>{report.category} bildirimi {report.unit} birimine yönlendirildi. Aynı sorunu {report.people} kişi bildirdi, kayıtlar tek bildirimde birleştirildi.</p></div></>}
      {!personal && <Button aria-pressed={!!supported} onClick={onSupport}>{supported ? "Desteğimi geri al" : "Ben de yaşıyorum"}</Button>}
      <div className={s.between}><p className={s.muted}>{report.people} kişi bildirdi</p>{!personal && <button type="button" className="text-accent font-medium" onClick={() => setExpanded(v => !v)}>{expanded ? "Geçmişi daralt" : "Tüm geçmişi gör"}</button>}</div>
      {personal && <><label className="ghost rounded-lg border border-input-border bg-white px-3 py-2 cursor-pointer text-center">Ek fotoğraf ekle<input aria-label="Ek fotoğraf ekle" type="file" accept="image/*" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) setAttachment(`Demo: ${file.name} bu ekrana eklendi; yüklenmedi.`); }} /></label>{attachment && <p role="status" className={s.small}>{attachment}</p>}
        {report.mine && !resolved && report.status !== "geri_cekildi" && (withdraw ? <div className={s.notice}><p>Bu demo bildirimini geri çekmek istiyor musun?</p><div className={`${s.row} mt-2`}><Button variant="danger" onClick={() => { onWithdraw?.(); setWithdraw(false); }}>Geri çekmeyi onayla</Button><Button variant="secondary" onClick={() => setWithdraw(false)}>Vazgeç</Button></div></div> : <Button variant="secondary" onClick={() => setWithdraw(true)}>Bildirimi geri çek</Button>)}
      </>}
    </div>
  </section>;
}
