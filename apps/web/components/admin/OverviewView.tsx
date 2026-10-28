"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowsClockwise, ChartLineUp, MapPin, ShieldWarning, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Filters, Kpis } from "@/components/admin-demo/ui";
import s from "@/components/admin-demo/admin.module.css";
import { adminKpis, unitPerformance, weeklyDigest, type DigestLine, type Period } from "@/lib/admin";
import { groupByBuilding } from "@/lib/campus";
import { CATEGORIES, categoryLabel } from "@/lib/labels";
import { isOpen } from "@/lib/my-reports";
import type { AdminData } from "./types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkle as SparkleIcon_ } from "@phosphor-icons/react";
import { Panes } from "@/components/layout/Panes";

const PERIODS: [Period, string][] = [
  ["today", "Bugün"],
  ["week", "Bu hafta"],
  ["month", "Bu ay"],
];
const TODAY = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" });
const RANGE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c, categoryLabel(c)]));
const DIGEST_ICON: Record<DigestLine["kind"], [typeof MapPin, string]> = {
  place: [MapPin, "bg-amber-100 text-amber-800"],
  category: [ChartLineUp, "bg-red-100 text-red-800"],
  reopened: [ArrowsClockwise, "bg-amber-100 text-amber-800"],
  unverified: [WarningCircle, "bg-red-100 text-red-800"],
};
const days = (n: number | null) => (n == null ? "–" : `${n.toLocaleString("tr-TR")} gün`);

export function OverviewView({ data, now: nowProp }: { data: AdminData; now?: number }) {
  const [now] = useState(() => new Date(nowProp ?? Date.now()));
  const [period, setPeriod] = useState<Period>("week");
  const [category, setCategory] = useState("Tümü");
  const [building, setBuilding] = useState<number | null>(null);
  const unverified = useMemo(() => new Set(data.unverified), [data.unverified]);

  const periodLabel = PERIODS.find((p) => p[0] === period)![1];
  const kpis = adminKpis(data.reports, unverified, period, now);
  const open = data.reports.filter((r) => isOpen(r.status));
  // The three most common open categories become map filters.
  const topCategories = [...new Set(open.map((r) => r.category))]
    .sort((a, b) => open.filter((r) => r.category === b).length - open.filter((r) => r.category === a).length)
    .slice(0, 3);
  const categoryByLabel = new Map(topCategories.map((c) => [categoryLabel(c), c]));
  if (category !== "Tümü" && !categoryByLabel.has(category)) {
    setCategory("Tümü");
    setBuilding(null);
  }
  const shown = category === "Tümü" ? open : open.filter((r) => r.category === categoryByLabel.get(category));
  const groups = groupByBuilding(shown, data.buildings);
  const selected = groups.find((g) => g.building.id === building);
  const digest = weeklyDigest(data.reports, unverified, CATEGORY_LABELS, now);
  const performance = unitPerformance(data.reports, data.units, now);

  return (
    <>
      <div className={s.row}>
        <PageHeader title="Genel bakış" description={`Sakarya Üniversitesi · ${TODAY.format(now)}`} />
        <Filters
          label="Zaman aralığı"
          options={PERIODS.map((p) => p[1])}
          value={periodLabel}
          onChange={(label) => setPeriod(PERIODS.find((p) => p[1] === label)![0])}
        />
      </div>
      {kpis.urgentOpen > 0 && (
        <section aria-label="Acil bildirim uyarısı" className={`${s.security} ${s.row}`}>
          <ShieldWarning size={32} aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{kpis.urgentOpen} acil bildirim açık</h2>
            <p className="text-sm">
              {kpis.overdue} bildirim hedef süresini aştı. Hassas bildirimler yalnızca Güvenlik birimine gider; burada görünmez.
            </p>
          </div>
          <Link href="/yonetim/bildirimler?filtre=Acil" className="inline-flex items-center justify-center rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger-hover focus-ring">
            İncele
          </Link>
        </section>
      )}
      <Kpis
        items={[
          { label: "Açık bildirim", value: kpis.open, hint: `${kpis.overdue} tanesi hedef süreyi aştı`, accessibleLabel: "Açık bildirim sayısı" },
          { label: "Ortalama çözüm süresi", value: days(kpis.avgDays), hint: `${periodLabel} çözülenler` },
          { label: "Süresinde çözülen", value: kpis.onTimeRate == null ? "–" : `%${kpis.onTimeRate}`, hint: "Hedef: acil 1, orta 3, düşük 7 gün" },
          { label: "Doğrulanmadan kapatılan", value: kpis.unverified, hint: "Yapay zeka çözümü doğrulayamadı" },
        ]}
      />
      <Panes className={s.split} labels={["Isı haritası", "Haftalık özet"]}>
        <Glass className={`${s.panel} ${s.stack}`}>
          <div>
            <h2>Isı haritası</h2>
            <p className={s.muted}>Açık bildirimlerin binalara göre yoğunluğu</p>
          </div>
          <Filters
            label="Kategori"
            options={["Tümü", ...topCategories.map(categoryLabel)]}
            value={category}
            onChange={(value) => {
              setCategory(value);
              setBuilding(null);
            }}
          />
          <div className="relative h-[360px] overflow-hidden rounded-lg" aria-label={`${category} kategorisi ısı haritası`} role="region">
            <MapCanvas groups={groups} selectedBuildingId={building} onSelect={setBuilding} />
          </div>
          <p role="status" className={s.small}>
            {selected
              ? `${selected.building.name}: ${selected.reports.length} açık bildirim. `
              : `${shown.length} açık bildirim, ${groups.length} bina. İşaretteki sayı binadaki açık bildirimdir; kırmızı nokta acil.`}
            {selected && <Link href={`/yonetim/bildirimler?q=${encodeURIComponent(selected.building.name)}`} className="underline">Bildirimlere git</Link>}
          </p>
        </Glass>
        <Glass className={`${s.panel} ${s.stack}`}>
          <div className={s.row}>
            <div>
              <h2>Haftalık özet</h2>
              <p className={`${s.muted} flex items-center gap-1`}>
                <Sparkle size={16} aria-hidden /> Son 7 günün verilerinden derlendi
              </p>
            </div>
            <span className={s.small}>
              {RANGE.format(new Date(now.getTime() - 7 * 86_400_000))} – {RANGE.format(now)}
            </span>
          </div>
          {digest.length ? (
            <ul className={s.stack}>
              {digest.map((line) => {
                const [Icon, tone] = DIGEST_ICON[line.kind];
                return (
                  <li key={line.kind} className="flex gap-3 text-sm">
                    <Icon size={28} className={`shrink-0 rounded p-1 ${tone}`} aria-hidden />
                    <p>{line.text}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={<SparkleIcon_ size={22} />} title="Bu hafta özetlenecek hareket yok." hint="Yeni bildirimler geldikçe özet kendiliğinden dolar." />
          )}
        </Glass>
      </Panes>
      <Glass className={s.panel}>
        <h2>Birim performansı</h2>
        <p className={s.muted}>Süresinde çözüm oranı %80’in altındaki birimler kırmızı gösterilir.</p>
        <table className={s.table}>
          <caption className="sr-only">Birim performansı</caption>
          <thead>
            <tr>
              <th scope="col">Birim</th>
              <th scope="col">Açık</th>
              <th scope="col">Ortalama süre</th>
              <th scope="col">Süresinde çözüm</th>
            </tr>
          </thead>
          <tbody>
            {performance.map((u) => {
              const low = u.onTimeRate != null && u.onTimeRate < 80;
              return (
                <tr key={u.id}>
                  <th scope="row">{u.name}</th>
                  <td className="mono">
                    {u.open}
                    {u.overdue > 0 && <span className="text-danger"> ({u.overdue} gecikmiş)</span>}
                  </td>
                  <td className="mono">{days(u.avgDays)}</td>
                  <td>
                    {u.onTimeRate == null ? (
                      <span className={s.small}>Çözülen yok</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`${s.bar} flex-1`}>
                          <span style={{ width: `${u.onTimeRate}%`, background: low ? "#b91c1c" : undefined }} />
                        </div>
                        <span className={`mono ${low ? "text-danger" : ""}`}>%{u.onTimeRate}</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Glass>
    </>
  );
}
