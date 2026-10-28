"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { PanelSwitch } from "./PanelSwitch";

export type DockItem = { href: string; label: string; icon: Icon; active: boolean; iconOnly?: boolean };

// The route mark: a start point, a bend and an arrival, the path every report takes.
export function RouteMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <rect width="28" height="28" rx="9" fill="#e7efe9" />
      <path d="M8 19.5c0-4 3-5.5 6-5.5s6-1.5 6-5.5" fill="none" stroke="#12302b" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="8" cy="19.5" r="2.4" fill="#12302b" />
      <circle cx="20" cy="8.5" r="2.8" fill="#2f55e4" />
    </svg>
  );
}

// Floating pine dock: top centre on desktop, under the thumb on phones. A puck slides to the current page.
export function Dock({ label, items, cta, trailing }: { label: string; items: DockItem[]; cta?: ReactNode; trailing?: ReactNode }) {
  const linksRef = useRef<HTMLDivElement>(null);
  const [puck, setPuck] = useState<{ x: number; w: number } | null>(null);
  const activeHref = items.find((i) => i.active)?.href;

  useLayoutEffect(() => {
    const measure = () => {
      const root = linksRef.current;
      const el = root?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!root || !el) return setPuck(null);
      setPuck({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref]);

  return (
    <>
      <nav aria-label={label} className="dock">
        <span className="dock-mark">
          <RouteMark />
          <span className="dock-mark-text">Çözüm Kampüs</span>
        </span>
        <div ref={linksRef} className="dock-links">
          <span
            aria-hidden
            className="dock-puck"
            style={{ width: puck?.w ?? 0, transform: `translateX(${puck?.x ?? 0}px)`, opacity: puck ? 1 : 0 }}
          />
          {items.map(({ href, label: name, icon: IconCmp, active, iconOnly }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={iconOnly ? name : undefined}
              className={`dock-link ${iconOnly ? "dock-icon" : ""}`}
            >
              <IconCmp size={20} weight={active ? "fill" : "regular"} aria-hidden />
              <span className={`dock-label ${iconOnly ? "sr-only" : ""}`} aria-hidden={iconOnly || undefined}>
                {name}
              </span>
            </Link>
          ))}
        </div>
        {cta}
        {trailing}
        <span className="dock-sep" aria-hidden />
        <span className="dock-panel">
          <PanelSwitch />
        </span>
      </nav>
      <div className="panel-top">
        <PanelSwitch />
      </div>
    </>
  );
}
