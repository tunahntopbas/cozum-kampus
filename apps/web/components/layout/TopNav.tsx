"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelSwitch } from "./PanelSwitch";
import { Bell, Lightbulb, ListChecks, MapTrifold, Plus, UserCircle, type Icon } from "@phosphor-icons/react";

const LINKS: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Harita", icon: MapTrifold },
  { href: "/bildirimlerim", label: "Bildirimlerim", icon: ListChecks },
  { href: "/oneriler", label: "Öneriler", icon: Lightbulb },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const iconLink = "ghost t flex h-9 w-9 items-center justify-center rounded-lg text-ink";

// Floating glass navigation from docs/tasarim (Main, Hesap, Bildir ...).
export function TopNav() {
  const pathname = usePathname();
  const current = (href: string) => (isActive(pathname, href) ? "page" : undefined);

  return (
    <nav aria-label="Ana gezinme" className="topbar glass z-10 flex items-center gap-2 p-2">
      {LINKS.map(({ href, label, icon: IconCmp }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current(href)}
            className={`ghost t flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-tint text-ink" : "text-muted"}`}
          >
            <IconCmp size={16} weight={active ? "fill" : "regular"} aria-hidden />
            <span className="max-sm:sr-only">{label}</span>
          </Link>
        );
      })}
      <span className="block h-6 w-px bg-hairline" aria-hidden />
      <Link
        href="/bildir"
        aria-current={current("/bildir")}
        className="btn-ink t flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white"
      >
        <Plus size={16} weight="bold" aria-hidden />
        Bildir
      </Link>
      <Link
        href="/bildirimler"
        aria-label="Bildirimler"
        aria-current={current("/bildirimler")}
        className={`${iconLink} ${isActive(pathname, "/bildirimler") ? "bg-tint" : ""}`}
      >
        <Bell size={20} aria-hidden />
      </Link>
      <Link
        href="/hesap"
        aria-label="Profil"
        aria-current={current("/hesap")}
        className={`${iconLink} ${isActive(pathname, "/hesap") ? "bg-tint" : ""}`}
      >
        <UserCircle size={24} aria-hidden />
      </Link>
      <PanelSwitch />
    </nav>
  );
}
