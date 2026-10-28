"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FunnelSimple } from "@phosphor-icons/react";

// Secondary filters live behind one button; `summary` names what is active so nothing is hidden silently.
export function FilterMore({ summary, children }: { summary?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="fmore" data-open={open || undefined} data-active={summary ? "" : undefined}>
      <button type="button" className="fmore-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <FunnelSimple size={16} weight="bold" aria-hidden />
        Filtrele
        {summary && <span className="fmore-summary">{summary}</span>}
      </button>
      <div className="fmore-pop" role="group" aria-label="Diğer filtreler">
        {children}
      </div>
    </div>
  );
}
