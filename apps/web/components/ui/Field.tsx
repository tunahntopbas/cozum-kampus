import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import type { InputHTMLAttributes, ReactNode } from "react";

export const fieldBox = "field flex items-center gap-2 rounded-lg border border-input-border px-3 py-2";
export const fieldInput = "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: ReactNode };

// Labelled text input from docs/tasarim/Hesap.dc.html; read-only fields get a grey fill and a lock.
export function TextField({ id, label, hint, readOnly, className = "", ...rest }: TextFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="lbl" htmlFor={id}>
        {label}
      </label>
      <div className={`${fieldBox} ${readOnly ? "bg-[#F3F6FB]" : "bg-white"}`}>
        <input id={id} readOnly={readOnly} className={fieldInput} {...rest} />
        {readOnly && <LockSimple size={16} className="ml-auto text-muted" aria-hidden />}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
