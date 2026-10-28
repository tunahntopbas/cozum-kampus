"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelSwitch } from "@/components/layout/PanelSwitch";
import { ClockCounterClockwise, ListChecks, Package } from "@phosphor-icons/react";
import { PageContent } from "@/components/layout/PageContent";
import s from "./Staff.module.css";
const links = [{ href: "/personel", label: "İşler", icon: ListChecks }, { href: "/personel/gecmis", label: "Geçmiş", icon: ClockCounterClockwise }, { href: "/personel/malzeme", label: "Malzeme", icon: Package }];
export function StaffShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return <div className={`app ${s.shell}`}><a className="skip" href="#icerik">Ana içeriğe geç</a><nav aria-label="Personel gezinme" className={`topbar glass ${s.nav}`}>{links.map(({ href, label, icon: Icon }) => <Link className="ghost t" key={href} href={href} aria-current={path === href ? "page" : undefined}><Icon size={16} aria-hidden />{label}</Link>)}<span className="ml-auto" /><PanelSwitch /></nav><PageContent>{children}</PageContent></div>;
}
