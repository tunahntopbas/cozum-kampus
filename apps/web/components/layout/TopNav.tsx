"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Lightbulb, ListChecks, MapTrifold, Plus, UserCircle } from "@phosphor-icons/react";
import { Dock } from "./Dock";

const LINKS = [
  { href: "/", label: "Harita", icon: MapTrifold },
  { href: "/bildirimlerim", label: "Bildirimlerim", icon: ListChecks },
  { href: "/oneriler", label: "Öneriler", icon: Lightbulb },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const current = (href: string) => (isActive(pathname, href) ? "page" : undefined);

  return (
    <Dock
      label="Ana gezinme"
      items={LINKS.map((l) => ({ ...l, active: isActive(pathname, l.href) }))}
      cta={
        <Link href="/bildir" aria-current={current("/bildir")} className="dock-cta">
          <Plus size={18} weight="bold" aria-hidden />
          <span className="dock-label">Bildir</span>
        </Link>
      }
      trailing={
        <span className="dock-trailing">
          <Link href="/bildirimler" aria-label="Bildirimler" aria-current={current("/bildirimler")} className="dock-link dock-icon">
            <Bell size={20} weight={isActive(pathname, "/bildirimler") ? "fill" : "regular"} aria-hidden />
          </Link>
          <Link href="/hesap" aria-label="Profil" aria-current={current("/hesap")} className="dock-link dock-icon">
            <UserCircle size={22} weight={isActive(pathname, "/hesap") ? "fill" : "regular"} aria-hidden />
          </Link>
        </span>
      }
    />
  );
}
