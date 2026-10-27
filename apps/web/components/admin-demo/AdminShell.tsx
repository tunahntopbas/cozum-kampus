"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Buildings, ListChecks, Megaphone, SquaresFour } from "@phosphor-icons/react";
import { Stage } from "@/components/layout/Stage";
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
  return <div className={`app ${styles.shell}`}>
    <a className="skip" href="#icerik">Ana içeriğe geç</a>
    <Stage />
    <nav aria-label="Yönetim gezinme" className={`topbar glass z-10 flex items-center gap-2 p-2 ${styles.nav}`}>
      {tabs.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="ghost t text-muted"><Icon size={16} aria-hidden />{label}</Link>)}
    </nav>
    <PageContent>
      <p className={styles.demo}><strong>Demo verileri</strong> · Örnek kampüs kayıtları. Bu ekrandaki değişiklikler sayfa/sekme değişiminde sıfırlanır. Veritabanına yazılmaz.</p>
      {children}
    </PageContent>
  </div>;
}
