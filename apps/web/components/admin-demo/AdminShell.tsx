"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Buildings, ListChecks, Megaphone, SquaresFour } from "@phosphor-icons/react";
import { Dock } from "@/components/layout/Dock";
import { PageContent } from "@/components/layout/PageContent";
import styles from "./admin.module.css";

const tabs = [
  { href: "/yonetim", label: "Genel bakış", icon: SquaresFour },
  { href: "/yonetim/bildirimler", label: "Bildirimler", icon: ListChecks },
  { href: "/yonetim/birimler", label: "Birimler", icon: Buildings },
  { href: "/yonetim/kampus-sesi", label: "Kampüs sesi", icon: Megaphone },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={`app ${styles.shell}`}>
      <a className="skip" href="#icerik">Ana içeriğe geç</a>
      <Dock label="Yönetim gezinme" items={tabs.map((t) => ({ ...t, active: pathname === t.href }))} />
      <PageContent>{children}</PageContent>
    </div>
  );
}
