"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STUDENT_PANEL_COOKIE } from "@/lib/auth";

const PANELS = [
  { key: "student", href: "/", label: "Öğrenci" },
  { key: "staff", href: "/personel", label: "Personel" },
  { key: "admin", href: "/yonetim", label: "Yönetim" },
] as const;

function activePanel(pathname: string) {
  if (pathname.startsWith("/yonetim")) return "admin";
  if (pathname.startsWith("/personel")) return "staff";
  return "student";
}

// Admins can open every panel; this lets them hop between the three during a demo.
export function PanelSwitch() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      setIsAdmin(profile?.role === "admin");
    });
  }, []);

  if (!isAdmin) return null;
  const active = activePanel(pathname);

  return (
    <div role="group" aria-label="Panel" className="flex items-center gap-0.5 rounded-[14px] bg-white/95 p-1 shadow-[0_6px_18px_-10px_rgba(18,48,43,0.6)]">
      {PANELS.map((p) => (
        // A full page load, not a client-side Link: the router cache can hold the proxy's earlier
        // redirect back to /yonetim from before the cookie existed.
        <a
          key={p.key}
          href={p.href}
          aria-current={active === p.key ? "page" : undefined}
          onClick={() => {
            document.cookie = `${STUDENT_PANEL_COOKIE}=${p.key === "student" ? "1" : ""}; path=/; max-age=${p.key === "student" ? 86400 : 0}`;
          }}
          className={`t rounded-[10px] px-2.5 py-1.5 text-xs font-semibold ${active === p.key ? "bg-ink text-white" : "text-muted hover:bg-tint"}`}
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
