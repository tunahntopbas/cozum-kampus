"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { BellIcon, CheckCircleIcon, ChatCircleTextIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Switch } from "@/components/ui/Switch";
import { Chips, DemoLabel, Photo, TabPanels, Tabs } from "./Common";
import s from "./StudentDemo.module.css";

const initial = [
  { id: 1, title: "Bildirimin işleme alındı", body: "Koridor lambası yanmıyor: Yapı İşleri bir teknisyen atadı.", time: "10:40", group: "Bugün", type: "Durum değişimleri", unread: true, href: "/bildirimlerim", action: "Bildirimi aç" },
  { id: 2, title: "Sorun çözüldü mü?", body: "Kütüphane 2. kat internet kesintisi için çözüm fotoğrafı yüklendi, yapay zeka doğruladı. Sen de onaylarsan kayıt kapanır.", time: "09:30", group: "Bugün", type: "Durum değişimleri", unread: true },
  { id: 3, title: "Önerine yönetim yanıt verdi", body: "Kütüphane final haftasında sabaha kadar açık kalsın: pilot uygulama başlıyor.", time: "08:20", group: "Bugün", type: "Yanıtlar", unread: true, href: "/oneriler#oneri-1", action: "Yanıtı oku" },
  { id: 4, title: "Bildirimin başkalarıyla birleştirildi", body: "Koridor lambası yanmıyor kaydın, 4 benzer bildirimle tek kayıtta toplandı. Artık 5 kişi takip ediyor.", time: "17:05", group: "Dün", type: "Durum değişimleri", unread: false },
  { id: 5, title: "Erişilebilirlik uyarısı", body: "Bilgisayar ve Bilişim Bilimleri Fakültesi asansörü arızalı. Tahmini onarım yarın öğleden önce.", time: "14:12", group: "Dün", type: "Uyarılar", unread: false },
  { id: 6, title: "Yapay zeka tahmini: yağış", body: "Yarın yağış bekleniyor. Yurt yolu ve açık otopark girişinde kaygan zemin bildirimleri artabilir. Bu bir örnek uyarıdır, güncel hava tahmini değildir.", time: "25 Eki", group: "Daha eski", type: "Uyarılar", unread: false },
];
const preferences = [
  { group: "Kanallar", label: "Uygulama içi", description: "Bu sayfada ve zil simgesinde", enabled: true },
  { group: "Kanallar", label: "E-posta", description: "Okul e-postana özet gönderilir", enabled: true },
  { group: "Kanallar", label: "Tarayıcı bildirimi", description: "Sekme kapalıyken anlık uyarı", enabled: false },
  { group: "Türler", label: "Durum değişimleri", description: "Bildirimlerinin her adımında", enabled: true },
  { group: "Türler", label: "Yönetim yanıtları", description: "Önerilerine gelen cevaplar", enabled: true },
  { group: "Türler", label: "Erişilebilirlik uyarıları", description: "Asansör ve rampa arızaları", enabled: true },
  { group: "Türler", label: "Kampüs ve hava uyarıları", description: "Yapay zekanın öngörüleri", enabled: false },
];
export function Notifications() {
  const tabsId = useId();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState("Tümü");
  const [type, setType] = useState("Hepsi");
  const [resolution, setResolution] = useState("");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(Object.fromEntries(preferences.map(pref => [pref.label, pref.enabled])));
  const [start, setStart] = useState("23:00");
  const [end, setEnd] = useState("08:00");
  const [prefsMessage, setPrefsMessage] = useState("");
  const [route, setRoute] = useState(false);
  const visible = items.filter(item => (tab === "Tümü" || item.unread) && (type === "Hepsi" || item.type === type));
  function markRead(id: number) { setItems(previous => previous.map(item => item.id === id ? { ...item, unread: false } : item)); }
  function confirm(reopen: boolean) { setResolution(reopen ? "Demo: bildirim yeniden açıldı. Birime tekrar iletilecek." : "Demo: çözümü onayladın. Kayıt kapatıldı."); markRead(2); }
  return <div className={s.root}><PageContent><PageHeader title="Bildirimler" description="Bildirimlerinin durumu, yönetim yanıtları ve kampüs uyarıları burada toplanır." /><DemoLabel />
    <div className={s.columns}><Glass className={`${s.panel} !p-4`}><div className={s.between}><Tabs id={tabsId} label="Bildirim görünümü" options={["Tümü", "Okunmamış"]} value={tab} onChange={setTab} /><span className={s.badge}>{items.filter(item => item.unread).length} okunmamış</span><button type="button" className="text-accent font-medium" onClick={() => setItems(previous => previous.map(item => ({ ...item, unread: false })))}>Tümünü okundu işaretle</button></div><Chips label="Bildirim türü" options={["Hepsi", "Durum değişimleri", "Yanıtlar", "Uyarılar"]} value={type} onChange={setType} />
      <TabPanels id={tabsId} options={["Tümü", "Okunmamış"]} value={tab}>
      {!visible.length && <p className="p-4 text-muted" role="status">{tab === "Okunmamış" ? "Okunmamış bildirim yok." : "Bu filtreye uygun bildirim yok."}</p>}
      {["Bugün", "Dün", "Daha eski"].map(group => { const grouped = visible.filter(item => item.group === group); return grouped.length > 0 && <section key={group} className="sec" aria-label={group}><h2 className={`${s.small} px-4 pt-2 font-semibold`}>{group}</h2><ol className="space-y-1">{grouped.map(item => <li key={item.id} className={`${s.item} ${item.unread ? s.unread : ""}`}>
        <span className={s.icon}>{item.id === 2 ? <CheckCircleIcon size={24} aria-hidden="true" /> : item.type === "Yanıtlar" ? <ChatCircleTextIcon size={24} aria-hidden="true" /> : item.type === "Uyarılar" ? <WarningCircleIcon size={24} aria-hidden="true" /> : <BellIcon size={24} aria-hidden="true" />}</span>
        <div className={s.itemBody}><div className={s.between}><h3 className="font-semibold">{item.title}</h3><span className={`${s.small} mono`}>{item.time}</span></div><p className={s.muted}>{item.body}</p>
          {item.href && <Link className="text-accent underline font-medium self-start" href={item.href} onClick={() => markRead(item.id)}>{item.action}</Link>}
          {item.id === 2 && (!resolution ? <div className="sec mt-2"><div className={s.photos}><Photo label="Önce" /><Photo label="Sonra" /></div><div className={s.row}><Button onClick={() => confirm(false)}>Evet, çözüldü</Button><Button variant="secondary" onClick={() => confirm(true)}>Hâlâ sorun var</Button></div></div> : <p role="status" className={`${s.notice} mt-2`}>{resolution}</p>)}
          {item.id === 5 && <><button type="button" aria-expanded={route} className="text-accent underline font-medium text-left" onClick={() => setRoute(v => !v)}>{route ? "Rotayı gizle" : "Alternatif rotayı gör"}</button>{route && <p className={s.notice}>Örnek rota: fakülte ana girişi → doğu koridoru → zemin kat erişilebilir çalışma salonu. Bu rota demo amaçlıdır; güncel erişim durumunu danışmadan doğrula.</p>}</>}
          {item.unread && <button type="button" className="text-xs text-accent self-start mt-1" aria-label={`${item.title} bildirimini okundu işaretle`} onClick={() => markRead(item.id)}>Okundu işaretle</button>}
        </div>{item.unread && <span role="img" aria-label="Okunmadı" className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent" />}
      </li>)}</ol></section>; })}
    </TabPanels></Glass><Glass className={s.panel}><div><h2 className={s.heading}>Bildirim tercihleri</h2><p className={s.muted}>Neyi, nereden almak istediğini seç.</p></div><p className={s.small}>Demo tercihleri gerçek bildirim gönderimini değiştirmez.</p>
      {["Kanallar", "Türler"].map(group => <section key={group}><h3 className={`${s.small} font-semibold`}>{group}</h3>{preferences.filter(pref => pref.group === group).map(pref => <div className={s.preference} key={pref.label}><div><p className="font-semibold">{pref.label}</p><p className={s.small}>{pref.description}</p></div><Switch label={pref.label} hideLabel checked={prefs[pref.label]} onChange={value => { setPrefs(previous => ({ ...previous, [pref.label]: value })); setPrefsMessage("Demo tercihin bu ekranda güncellendi."); }} /></div>)}</section>)}
      <div className="sec border-t border-hairline pt-4"><h3 className="lbl">Sessiz saatler</h3><div className={s.row}><label className="min-w-0 flex-1"><span className={s.small}>Başlangıç</span><input type="time" className={`${s.input} mono`} value={start} onChange={event => { setStart(event.target.value); setPrefsMessage("Demo sessiz saatlerin güncellendi."); }} /></label><label className="min-w-0 flex-1"><span className={s.small}>Bitiş</span><input type="time" className={`${s.input} mono`} value={end} onChange={event => { setEnd(event.target.value); setPrefsMessage("Demo sessiz saatlerin güncellendi."); }} /></label></div><p className={s.small}>Acil durum ve güvenlik uyarıları sessiz saatlerde de gelir.</p></div>{prefsMessage && <p role="status" className={s.notice}>{prefsMessage}</p>}
    </Glass></div>
  </PageContent></div>;
}
