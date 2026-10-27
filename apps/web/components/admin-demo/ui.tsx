import type { ReactNode } from "react";
import { Glass } from "@/components/ui/Glass";
import s from "./admin.module.css";

export function Kpis({ items }: { items: { label: string; value: string | number; hint: string; accessibleLabel?: string }[] }) {
  return <div className={s.kpis}>{items.map(({ label, value, hint, accessibleLabel }) => <Glass className={s.kpi} key={label}><p className={s.muted}>{label}</p><p className={s.value} aria-label={accessibleLabel}>{value}</p><p className={s.small}>{hint}</p></Glass>)}</div>;
}
export function Filters({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <div role="group" aria-label={label} className={s.filters}>{options.map((option) => <button type="button" className={s.pill} key={option} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}
export function Badge({ children }: { children: ReactNode }) {
  const tone = children === "Acil" || children === "Gecikmiş" ? s.danger : children === "Çözüldü" || children === "Uygulandı" || children === "Müsait" ? s.success : children === "İşlemde" || children === "Yanıt bekliyor" || children === "Sahada" ? s.warning : "";
  return <span className={`${s.badge} ${tone}`}>{children}</span>;
}
