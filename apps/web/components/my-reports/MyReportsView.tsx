"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Chips, TabPanels, Tabs } from "@/components/student-demo/Common";
import { Glass } from "@/components/ui/Glass";
import { StatusPill } from "@/components/ui/StatusPill";
import { floorLabel, relativeTime } from "@/lib/campus";
import { prepareImage } from "@/lib/image";
import { MY_FILTERS, MY_TABS, filterMyReports, myStats, type MyFilter, type MyTab } from "@/lib/my-reports";
import { createClient } from "@/lib/supabase/client";
import { uploadReportImage } from "@/lib/upload";
import s from "@/components/student-demo/StudentDemo.module.css";
import { MyReportDetail } from "./MyReportDetail";
import type { MyReportItem } from "./types";

type Props = {
  userId: string;
  mine: MyReportItem[];
  supported: MyReportItem[];
  buildingNames: Record<number, string>;
  unitNames: Record<number, string>;
  mutedIds: number[];
  prefTypes: Record<string, unknown>;
  newId: number | null;
};

export function MyReportsView({ userId, mine, supported, buildingNames, unitNames, mutedIds, prefTypes, newId }: Props) {
  const router = useRouter();
  const tabsId = useId();
  const [tab, setTab] = useState<MyTab>("Açtıklarım");
  const [filter, setFilter] = useState<MyFilter>("Tümü");
  const [selectedId, setSelectedId] = useState<number | null>(newId);
  const [muted, setMuted] = useState(() => new Set(mutedIds));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Status changes made by staff arrive over Realtime; the server page refetches everything.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    // The cookie-backed browser client does not hand the session to Realtime on its own; without the user's token
    // RLS filters every change out.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        // A fresh topic per mount: reusing the name hands back the channel that the previous cleanup is closing.
        .channel(`bildirimlerim-${userId}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "reports", filter: `reporter_id=eq.${userId}` },
          () => router.refresh(),
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_events" }, () => router.refresh())
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR") console.warn("Bildirim güncellemeleri alınamıyor", err?.message);
        });
    });
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router]);

  const visible = filterMyReports(mine, supported, tab, filter);
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0];
  const stats = myStats(mine, supported.length);
  const own = selected ? mine.some((r) => r.id === selected.id) : false;

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    try {
      const error = await action();
      if (error) setMessage(error);
      else router.refresh();
    } catch {
      setMessage("İşlem tamamlanamadı. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setBusy(false);
    }
  }

  function withdraw(id: number) {
    run(async () => {
      const { data, error } = await createClient().rpc("withdraw_report", { rid: id });
      if (error || !data) return "Bildirim geri çekilemedi. Çözülmüş ya da zaten geri çekilmiş olabilir.";
      return null;
    });
  }

  function addPhoto(id: number, file: File) {
    run(async () => {
      const supabase = createClient();
      const path = await uploadReportImage(userId, await prepareImage(file));
      const { error } = await supabase.from("report_media").insert({ report_id: id, kind: "ek", storage_path: path });
      if (error) return "Fotoğraf bildirime eklenemedi.";
      await supabase.from("report_events").insert({ report_id: id, type: "ek_fotograf", actor_id: userId, payload: {} });
      return null;
    });
  }

  async function setNotify(id: number, value: boolean) {
    const next = new Set(muted);
    if (value) next.delete(id);
    else next.add(id);
    setMuted(next);
    const { error } = await createClient()
      .from("notification_prefs")
      .upsert({ user_id: userId, types: { ...prefTypes, muted_reports: [...next] } }, { onConflict: "user_id" });
    if (error) {
      setMuted(muted);
      setMessage("Bildirim tercihin kaydedilemedi.");
    }
  }

  const statCards: [string, number, string][] = [
    ["Açık bildirim", stats.open, stats.urgentOpen ? `${stats.urgentOpen} tanesi acil` : "Acil bildirim yok"],
    ["Çözülen", stats.resolvedThisMonth, "Bu ay"],
    ["Desteklediklerin", stats.supported, "Ben de yaşıyorum dediklerin"],
  ];

  return (
    <>
      {newId != null && mine.some((r) => r.id === newId) && (
        <p role="status" className={s.notice}>
          Bildirimin alındı (#{newId}). Durumu değiştikçe burada göreceksin.
        </p>
      )}
      <div className={s.stats}>
        {statCards.map(([title, count, note]) => (
          <Glass className={s.stat} key={title}>
            <p className={s.muted}>{title}</p>
            <strong className="mono">{count}</strong>
            <p className={s.small}>{note}</p>
          </Glass>
        ))}
      </div>
      <div className={s.reportsColumns}>
        <Glass className={`${s.panel} !p-4`}>
          <Tabs
            id={tabsId}
            label="Bildirimlerim sekmeleri"
            options={[...MY_TABS]}
            value={tab}
            onChange={(v) => setTab(v as MyTab)}
          />
          <Chips
            label="Bildirim durumu"
            options={[...MY_FILTERS]}
            value={filter}
            onChange={(v) => setFilter(v as MyFilter)}
          />
          <TabPanels id={tabsId} options={[...MY_TABS]} value={tab}>
            {!visible.length && (
              <p role="status" className="p-4 text-muted">
                {tab === "Açtıklarım" && !mine.length
                  ? "Henüz bildirim açmadın. Bir sorun gördüğünde Bildir'e dokun."
                  : tab === "Desteklediklerim" && !supported.length
                    ? "Haritada bir bildirime \"Ben de yaşıyorum\" dediğinde burada görünür."
                    : "Bu filtrelere uygun bildirim yok."}
              </p>
            )}
            {visible.map((r) => (
              <button
                type="button"
                className={s.item}
                aria-pressed={selected?.id === r.id}
                onClick={() => setSelectedId(r.id)}
                key={r.id}
              >
                <span
                  className={s.dot}
                  style={{
                    background: r.urgency === "acil" ? "#b91c1c" : r.status === "cozuldu" ? "#166534" : undefined,
                  }}
                />
                <span className={s.itemBody}>
                  <span className="font-medium">{r.title}</span>
                  <span className={s.small}>
                    {[r.buildingId != null ? buildingNames[r.buildingId] : "", floorLabel(r.floor)]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                  <span className={s.row}>
                    <StatusPill status={r.status} />
                    {r.urgency === "acil" && <span className="text-xs font-semibold text-danger">Acil</span>}
                  </span>
                </span>
                <span className={`${s.small} mono`}>{relativeTime(r.createdAt)}</span>
              </button>
            ))}
          </TabPanels>
        </Glass>
        <Glass className={s.panel}>
          {message && (
            <p role="alert" className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-danger">
              {message}
            </p>
          )}
          {selected ? (
            <MyReportDetail
              key={selected.id}
              report={selected}
              buildingName={selected.buildingId != null ? (buildingNames[selected.buildingId] ?? "") : ""}
              unitName={selected.unitId != null ? (unitNames[selected.unitId] ?? "") : ""}
              own={own}
              notify={!muted.has(selected.id)}
              busy={busy}
              onNotify={(v) => setNotify(selected.id, v)}
              onAddPhoto={(file) => addPhoto(selected.id, file)}
              onWithdraw={() => withdraw(selected.id)}
            />
          ) : (
            <p className={s.muted}>Görüntülenecek bildirim yok. Başka bir filtre seçebilirsin.</p>
          )}
        </Glass>
      </div>
    </>
  );
}
