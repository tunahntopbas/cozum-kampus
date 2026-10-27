import { ImageIcon } from "@phosphor-icons/react";
import s from "./StudentDemo.module.css";

export function DemoLabel() {
  return <p className={s.demo}><span className={s.badge}>Demo verileri</span> İşlemler yalnızca bu ekranda geçerlidir, yenileyince sıfırlanır.</p>;
}
export function Photo({ label }: { label: string }) {
  return <div className={s.photo} role="img" aria-label={`${label}, demo görseli`}><ImageIcon size={28} aria-hidden="true" /><span>{label}</span><span className={s.small}>Örnek görsel alanı</span></div>;
}
export function Chips({ options, value, onChange, label }: { options: string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div className={s.chips} role="group" aria-label={label}>{options.map(option => <button key={option} type="button" className={s.chip} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}
export function Tabs({ options, value, onChange, label }: { options: string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div className={s.tabs} role="tablist" aria-label={label}>{options.map(option => <button key={option} type="button" role="tab" className={s.tab} aria-selected={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}
