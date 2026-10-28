"use client";

import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

const PHONE = "(max-width: 960px)";
const isPhone = () => typeof window !== "undefined" && window.matchMedia(PHONE).matches;

// Hidden panes keep their state; a map inside one needs a resize nudge when it shows again.
function nudge() {
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
}

// Phone-only segmented bar. On desktop it is hidden and every pane shows side by side as before.
export function PaneBar({
  labels,
  value,
  onChange,
  className = "",
}: {
  labels: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [puck, setPuck] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      setPuck(el && el.offsetWidth ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value]);

  return (
    <div ref={ref} role="tablist" aria-label="Bölüm" className={`panebar ${className}`}>
      <span
        aria-hidden
        className="panebar-puck"
        style={{ width: puck?.w ?? 0, transform: `translateX(${puck?.x ?? 0}px)`, opacity: puck ? 1 : 0 }}
      />
      {labels.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={value === l.id}
          className="panebar-tab"
          onClick={() => {
            onChange(l.id);
            nudge();
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Splits a side-by-side layout into tabs on phones instead of one long scroll.
 * Children are the existing columns, in order; `jumpOn` is a selector inside the first pane
 * (a list row) that opens the next pane when tapped on a phone.
 */
export function Panes({
  labels,
  className,
  jumpOn,
  children,
}: {
  labels: string[];
  className?: string;
  jumpOn?: string;
  children: ReactNode;
}) {
  const [show, setShow] = useState("0");
  const tabs = labels.map((label, i) => ({ id: String(i), label }));

  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (!jumpOn || show !== "0" || !isPhone()) return;
    const target = e.target as HTMLElement;
    if (!target.closest(jumpOn)) return;
    // Let the row's own click run first, then reveal its detail.
    setTimeout(() => {
      setShow("1");
      window.scrollTo({ top: 0, behavior: "smooth" });
      nudge();
    }, 0);
  }

  return (
    <>
      <PaneBar labels={tabs} value={show} onChange={setShow} />
      <div className={className} data-show={show} onClickCapture={onClickCapture}>
        {children}
      </div>
    </>
  );
}

export function usePhonePane(initial: string) {
  const [pane, setPane] = useState(initial);
  const jump = (id: string) => {
    if (!isPhone()) return;
    setPane(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    nudge();
  };
  return { pane, setPane, jump };
}
