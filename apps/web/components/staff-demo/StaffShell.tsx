"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ClockCounterClockwise, ListChecks, Package } from "@phosphor-icons/react";
import { Dock } from "@/components/layout/Dock";
import { PageContent } from "@/components/layout/PageContent";
import s from "./Staff.module.css";
const links = [{ href: "/personel", label: "İşler", icon: ListChecks }, { href: "/personel/gecmis", label: "Geçmiş", icon: ClockCounterClockwise }, { href: "/personel/malzeme", label: "Malzeme", icon: Package }];
export function StaffShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return <div className={`app ${s.shell}`}><a className="skip" href="#icerik">Ana içeriğe geç</a><Dock label="Personel gezinme" items={links.map((l) => ({ ...l, active: path === l.href }))} /><PageContent>{children}</PageContent></div>;
}
