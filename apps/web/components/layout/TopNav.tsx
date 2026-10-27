"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, UserCircle } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "/", label: "Harita" },
  { href: "/bildirimlerim", label: "Bildirimlerim" },
  { href: "/oneriler", label: "Öneriler" },
] as const;

const iconLink =
  "grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-tint active:scale-[0.98] transition-transform focus-ring";

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="glass mx-4 mt-4 flex items-center gap-6 px-4 py-2">
      <Link href="/" className="rounded-lg focus-ring">
        <Logo />
      </Link>
      <nav className="flex items-center gap-1">
        {LINKS.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-transform active:scale-[0.98] focus-ring ${active ? "bg-tint text-ink" : "text-muted hover:bg-tint-2 hover:text-ink"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/bildir"
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-hover active:scale-[0.98] transition-transform focus-ring"
        >
          <Plus size={16} weight="bold" />
          Bildir
        </Link>
        <Link href="/bildirimler" aria-label="Bildirimler" className={iconLink}>
          <Bell size={20} />
        </Link>
        <Link href="/hesap" aria-label="Hesabım" className={iconLink}>
          <UserCircle size={22} />
        </Link>
      </div>
    </header>
  );
}
