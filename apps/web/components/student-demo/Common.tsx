import { useRef, type ReactNode } from "react";
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
type TabProps = { id: string; options: string[]; value: string };

export function Tabs({ id, options, value, onChange, label }: TabProps & { onChange: (value: string) => void; label: string }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className={s.tabs} role="tablist" aria-label={label} aria-orientation="horizontal">{options.map((option, index) => <button
    key={option} ref={element => { buttons.current[index] = element; }}
    id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
    type="button" role="tab" className={s.tab} aria-selected={value === option}
    tabIndex={value === option ? 0 : -1} onClick={() => onChange(option)}
    onKeyDown={event => {
      let next: number;
      switch (event.key) {
        case "ArrowRight": next = (index + 1) % options.length; break;
        case "ArrowLeft": next = (index - 1 + options.length) % options.length; break;
        case "Home": next = 0; break;
        case "End": next = options.length - 1; break;
        default: return;
      }
      event.preventDefault();
      onChange(options[next]);
      buttons.current[next]?.focus();
    }}
  >{option}</button>)}</div>;
}

export function TabPanels({ id, options, value, children }: TabProps & { children: ReactNode }) {
  return <>{options.map((option, index) => <div key={option} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={value !== option} tabIndex={0}>{value === option ? children : null}</div>)}</>;
}
