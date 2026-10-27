import type { ReactNode } from "react";
import { ImageSquare } from "@phosphor-icons/react";
import s from "./Staff.module.css";
export function PageHeading({ title, children }: { title: string; children: ReactNode }) {
  return <header className={s.header}><h1>{title}</h1><p>{children}</p><span className={s.demo}>Demo verileri · Değişiklikler yalnızca bu ekranda; sayfa/sekme değişiminde sıfırlanır</span></header>;
}
export function Stats({ items }: { items: [string, string | number, string][] }) {
  return <div className={s.stats}>{items.map(([label, value, note]) => <div className={`glass ${s.stat}`} key={label}><p>{label}</p><strong aria-label={label}>{value}</strong><small>{note}</small></div>)}</div>;
}
export function Pill({ children, tone = "" }: { children: ReactNode; tone?: string }) { return <span className={`${s.pill} ${s[tone] ?? ""}`}>{children}</span>; }
export function Photo({ label, src }: { label: string; src?: string }) {
  return (
    <div className={s.photo}>
      {src ? (
        // Local FileReader preview; the image never leaves the device.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Yerel çözüm fotoğrafı önizlemesi" />
      ) : <><ImageSquare size={32} aria-hidden /><p>Demo fotoğraf alanı</p></>}
      <span>{label}</span>
    </div>
  );
}
