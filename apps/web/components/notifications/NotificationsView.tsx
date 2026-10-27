"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { BellIcon, ChatCircleTextIcon } from "@phosphor-icons/react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Switch } from "@/components/ui/Switch";
import { Chips, TabPanels, Tabs } from "@/components/student-demo/Common";
import s from "@/components/student-demo/StudentDemo.module.css";
import { dayGroup, type DayGroup } from "@/lib/campus-voice";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

const TABS = ["Tümü", "Okunmamış"];
const TYPES: Record<string, string> = { durum: "Durum değişimleri", oneri_yaniti: "Yanıtlar" };
const GROUPS: DayGroup[] = ["Bugün", "Dün", "Daha eski"];
const TIME = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });

function action(n: AppNotification): { href: string; label: string } | null {
  if (n.type === "oneri_yaniti" && n.payload.suggestion_id != null) return { href: `/oneriler#oneri-${n.payload.suggestion_id}`, label: "Yanıtı oku" };
  if (n.type === "durum") return { href: "/bildirimlerim", label: "Bildirimi aç" };
  return null;
}

export function NotificationsView({
  userId,
  notifications,
  prefTypes,
}: {
  userId: string;
  notifications: AppNotification[];
  prefTypes: Record<string, unknown>;
}) {
  const tabsId = useId();
  const [now] = useState(() => new Date());
  const [items, setItems] = useState(notifications);
  const [tab, setTab] = useState("Tümü");
  const [type, setType] = useState("Hepsi");
  const [statusOn, setStatusOn] = useState(prefTypes.durum !== false);
  const [prefsMessage, setPrefsMessage] = useState("");

  const visible = items.filter((n) => (tab === "Tümü" || !n.readAt) && (type === "Hepsi" || TYPES[n.type] === type));
  const unread = items.filter((n) => !n.readAt).length;

  async function markRead(ids: number[]) {
    if (!ids.length) return;
    const at = new Date().toISOString();
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: n.readAt ?? at } : n)));
    await createClient().from("notifications").update({ read_at: at }).in("id", ids).is("read_at", null);
  }

  async function toggleStatus(on: boolean) {
    setStatusOn(on);
    const { error } = await createClient()
      .from("notification_prefs")
      .upsert({ user_id: userId, types: { ...prefTypes, durum: on } }, { onConflict: "user_id" });
    setPrefsMessage(error ? "Tercih kaydedilemedi." : on ? "Durum bildirimleri açıldı." : "Durum bildirimleri kapatıldı.");
    if (error) setStatusOn(!on);
  }

  return (
    <div className={s.root}>
      <PageContent>
        <PageHeader title="Bildirimler" description="Bildirimlerinin durumu ve önerilerine gelen yönetim yanıtları burada toplanır." />
        <div className={s.columns}>
          <Glass className={`${s.panel} !p-4`}>
            <div className={s.between}>
              <Tabs id={tabsId} label="Bildirim görünümü" options={TABS} value={tab} onChange={setTab} />
              <span className={s.badge}>{unread} okunmamış</span>
              <button
                type="button"
                className="text-accent font-medium disabled:opacity-50"
                disabled={!unread}
                onClick={() => markRead(items.filter((n) => !n.readAt).map((n) => n.id))}
              >
                Tümünü okundu işaretle
              </button>
            </div>
            <Chips label="Bildirim türü" options={["Hepsi", ...Object.values(TYPES)]} value={type} onChange={setType} />
            <TabPanels id={tabsId} options={TABS} value={tab}>
              {!visible.length && (
                <EmptyState
                  icon={<BellIcon size={22} />}
                  title={tab === "Okunmamış" ? "Okunmamış bildirim yok." : items.length ? "Bu filtreye uygun bildirim yok." : "Henüz bildirimin yok."}
                  hint={items.length ? undefined : "Bildirimlerinin durumu değişince ve önerine yanıt gelince burada görürsün."}
                  action={items.length ? undefined : { href: "/bildir", label: "Sorun bildir" }}
                />
              )}
              {GROUPS.map((group) => {
                const grouped = visible.filter((n) => dayGroup(n.createdAt, now) === group);
                return (
                  grouped.length > 0 && (
                    <section key={group} className="sec" aria-label={group}>
                      <h2 className={`${s.small} px-4 pt-2 font-semibold`}>{group}</h2>
                      <ol className="space-y-1">
                        {grouped.map((n) => {
                          const link = action(n);
                          return (
                            <li key={n.id} className={`${s.item} ${n.readAt ? "" : s.unread}`}>
                              <span className={s.icon}>
                                {n.type === "oneri_yaniti" ? <ChatCircleTextIcon size={24} aria-hidden="true" /> : <BellIcon size={24} aria-hidden="true" />}
                              </span>
                              <div className={s.itemBody}>
                                <div className={s.between}>
                                  <h3 className="font-semibold">{n.title}</h3>
                                  <span className={`${s.small} mono`}>
                                    {(group === "Daha eski" ? DATE : TIME).format(new Date(n.createdAt))}
                                  </span>
                                </div>
                                {n.body && <p className={s.muted}>{n.body}</p>}
                                {link && (
                                  <Link className="text-accent underline font-medium self-start" href={link.href} onClick={() => markRead([n.id])}>
                                    {link.label}
                                  </Link>
                                )}
                                {!n.readAt && (
                                  <button
                                    type="button"
                                    className="text-xs text-accent self-start mt-1"
                                    aria-label={`${n.title} bildirimini okundu işaretle`}
                                    onClick={() => markRead([n.id])}
                                  >
                                    Okundu işaretle
                                  </button>
                                )}
                              </div>
                              {!n.readAt && <span role="img" aria-label="Okunmadı" className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent" />}
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  )
                );
              })}
            </TabPanels>
          </Glass>
          <Glass className={s.panel}>
            <div>
              <h2 className={s.heading}>Bildirim tercihleri</h2>
              <p className={s.muted}>Neyi almak istediğini seç.</p>
            </div>
            <div className={s.preference}>
              <div>
                <p className="font-semibold">Durum değişimleri</p>
                <p className={s.small}>Bildirimlerinin her adımında</p>
              </div>
              <Switch label="Durum değişimleri" hideLabel checked={statusOn} onChange={toggleStatus} />
            </div>
            <p className={s.small}>Tek bir bildirimi sessize almak için Bildirimlerim sayfasını kullan. Önerine gelen yanıtlar her zaman bildirilir.</p>
            {prefsMessage && (
              <p role="status" className={s.notice}>
                {prefsMessage}
              </p>
            )}
          </Glass>
        </div>
      </PageContent>
    </div>
  );
}
