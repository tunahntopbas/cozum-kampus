"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Buildings } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { Badge, Kpis } from "@/components/admin-demo/ui";
import s from "@/components/admin-demo/admin.module.css";
import { unitPerformance } from "@/lib/admin";
import { categoryLabel, initials } from "@/lib/labels";
import { isOpen } from "@/lib/my-reports";
import { isSameDay } from "@/lib/staff";
import { statusMeta } from "@/lib/status";
import { createClient } from "@/lib/supabase/client";
import type { StaffMember } from "./ReportsView";
import type { AdminData, PanelReport } from "./types";

export type UnitRequest = {
  id: number;
  unitId: number;
  item: string;
  stock: number;
  qty: number;
  note: string | null;
  status: string;
  requester: string;
  createdAt: string;
};

const ON_SITE = new Set(["atandi", "islemde"]);
const REQUEST_LABEL: Record<string, string> = { onay_bekliyor: "Onay bekliyor", hazirlaniyor: "Hazırlanıyor" };
const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

export function UnitsView({
  data,
  staff,
  assignments,
  requests,
}: {
  data: AdminData;
  staff: StaffMember[];
  assignments: Record<number, string>;
  requests: UnitRequest[];
}) {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const [selected, setSelected] = useState(data.units[0]?.id ?? 0);
  const [assigning, setAssigning] = useState("");
  const [job, setJob] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const performance = unitPerformance(data.reports, data.units, now);
  const jobsOf = (id: string) => data.reports.filter((r) => assignments[r.id] === id);
  const people = staff.map((p) => {
    const mine = jobsOf(p.id);
    const active = mine.filter((r) => ON_SITE.has(r.status));
    return {
      ...p,
      active,
      onSite: active.length > 0,
      doneToday: mine.filter((r) => r.status === "cozuldu" && r.resolvedAt && isSameDay(r.resolvedAt, now)).length,
    };
  });
  const team = people.filter((p) => p.unitId === selected);
  const unassigned = data.reports.filter((r) => r.unitId === selected && isOpen(r.status) && !assignments[r.id]);
  const below = performance.filter((u) => u.onTimeRate != null && u.onTimeRate < 80);
  const unitName = data.units.find((u) => u.id === selected)?.name ?? "";
  const unitRequests = requests.filter((r) => r.unitId === selected);

  async function run(call: PromiseLike<{ error: unknown }>, ok: string) {
    setBusy(true);
    const { error } = await call;
    setBusy(false);
    setMessage(error ? "İşlem yapılamadı. Tekrar dene." : ok);
    if (!error) router.refresh();
    return !error;
  }

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    const report = unassigned.find((r) => r.id === Number(job));
    if (!report) return;
    const status = report.status === "alindi" || report.status === "yonlendirildi" ? "atandi" : report.status;
    const ok = await run(
      createClient().rpc("admin_update_report", {
        rid: report.id,
        to_unit: report.unitId,
        to_urgency: report.urgency,
        to_status: status,
        to_staff: assigning,
        note: null,
      }),
      `#${report.id} ${staff.find((p) => p.id === assigning)?.name ?? "personele"} atandı.`,
    );
    if (ok) setAssigning("");
  }

  return (
    <>
      <PageHeader title="Birimler" description="Birim yükü, performans ve ekip durumu." />
      <Kpis
        items={[
          { label: "Aktif birim", value: data.units.length, hint: "Kampüs genelinde" },
          { label: "Sahadaki personel", value: `${people.filter((p) => p.onSite).length} / ${people.length}`, hint: "Atanmış ve süren işi olan" },
          {
            label: "Birim başı açık iş",
            value: data.units.length ? fmt(performance.reduce((a, u) => a + u.open, 0) / data.units.length) : "–",
            hint: "Ortalama",
          },
          { label: "Hedef altı birim", value: below.length, hint: below.map((u) => u.name).join(", ") || "Yok" },
        ]}
      />
      <div className={s.units}>
        {performance.map((u) => {
          const members = people.filter((p) => p.unitId === u.id);
          const low = u.onTimeRate != null && u.onTimeRate < 80;
          return (
            <button
              type="button"
              key={u.id}
              aria-label={`${u.name} ekibini göster`}
              aria-pressed={selected === u.id}
              className={`glass ${s.panel} ${s.unit}`}
              onClick={() => {
                setSelected(u.id);
                setAssigning("");
                setMessage("");
              }}
            >
              <div className={s.row}>
                <span className="flex items-center gap-2 font-semibold">
                  <Buildings size={24} aria-hidden />
                  {u.name}
                </span>
                <Badge>{u.onTimeRate == null ? "Veri yok" : low ? "Hedef altı" : "Hedefte"}</Badge>
              </div>
              <div className={s.unitStats}>
                <span>
                  <strong>{u.open}</strong>
                  <span className={s.small}>Açık iş</span>
                </span>
                <span>
                  <strong>{u.avgDays == null ? "–" : fmt(u.avgDays)}</strong>
                  <span className={s.small}>Gün, ortalama</span>
                </span>
                <span>
                  <strong className={low ? "text-danger" : ""}>{u.onTimeRate == null ? "–" : `%${u.onTimeRate}`}</strong>
                  <span className={s.small}>Süresinde</span>
                </span>
              </div>
              <div className={s.row}>
                <span className="flex -space-x-1" aria-hidden>
                  {members.slice(0, 3).map((p) => (
                    <span key={p.id} className={`${s.avatar} border-2 border-white`}>
                      {initials(p.name)}
                    </span>
                  ))}
                </span>
                <span className={s.small}>
                  {members.filter((p) => p.onSite).length} / {members.length} sahada
                </span>
              </div>
              <p className={s.small}>En sık: {u.topCategory ? categoryLabel(u.topCategory) : "–"}</p>
            </button>
          );
        })}
      </div>
      <Glass className={`${s.panel} ${s.stack}`}>
        <div>
          <h2>{unitName} ekibi</h2>
          <p className={s.muted}>{unassigned.length} açık iş henüz kimseye atanmadı.</p>
        </div>
        {team.length ? (
          team.map((p) => (
            <article className={s.person} key={p.id} aria-label={p.name}>
              <div className="flex items-center gap-3">
                <span className={s.avatar} aria-hidden>
                  {initials(p.name)}
                </span>
                <div>
                  <h3>{p.name}</h3>
                  <p className={s.small}>Birim personeli</p>
                </div>
              </div>
              <Badge>{p.onSite ? "Sahada" : "Müsait"}</Badge>
              <p>{p.active[0] ? `${p.active[0].title} · ${statusMeta(p.active[0].status).label}` : "Bekliyor"}</p>
              <div>
                <p className={s.small}>
                  Bugün: {p.doneToday} bitti · {p.active.length} sürüyor
                </p>
              </div>
              <Button
                variant="secondary"
                disabled={!unassigned.length}
                aria-label={`${p.name} için iş ata`}
                onClick={() => {
                  setAssigning(p.id);
                  setJob(String(unassigned[0]?.id ?? ""));
                  setMessage("");
                }}
              >
                İş ata
              </Button>
            </article>
          ))
        ) : (
          <p className={s.empty}>Bu birimde kayıtlı personel yok.</p>
        )}
        {assigning && (
          <form aria-label="İş ataması" className={`${s.note} ${s.stack}`} onSubmit={assign}>
            <h3>{staff.find((p) => p.id === assigning)?.name} · İş ata</h3>
            <label className={s.field}>
              Atanacak iş
              <select className={s.input} value={job} onChange={(e) => setJob(e.target.value)}>
                {unassigned.map((r: PanelReport) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} · {r.title}
                  </option>
                ))}
              </select>
            </label>
            <div className={s.filters}>
              <Button type="submit" disabled={busy || !unassigned.length}>
                Atamayı onayla
              </Button>
              <Button variant="secondary" onClick={() => setAssigning("")}>
                Vazgeç
              </Button>
            </div>
          </form>
        )}
        <p role="status" className={s.small}>
          {message}
        </p>
      </Glass>
      <Glass className={`${s.panel} ${s.stack}`}>
        <div>
          <h2>Malzeme talepleri</h2>
          <p className={s.muted}>“Hazır” stoktan düşer.</p>
        </div>
        {unitRequests.length ? (
          <ul className={s.stack}>
            {unitRequests.map((r) => (
              <li key={r.id} className={`${s.note} ${s.row}`} aria-label={`${r.item} talebi`}>
                <div>
                  <strong>
                    {r.item} × {r.qty}
                  </strong>
                  <p className={s.small}>
                    {r.requester} · {DATE.format(new Date(r.createdAt))} · Stok {r.stock}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <div className={s.filters}>
                  <Badge>{REQUEST_LABEL[r.status] ?? r.status}</Badge>
                  {r.status === "onay_bekliyor" && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => run(createClient().rpc("set_material_request_status", { rid: r.id, to_status: "hazirlaniyor" }), `${r.item} hazırlanıyor.`)}
                    >
                      Hazırla
                    </Button>
                  )}
                  <Button
                    disabled={busy || r.stock < r.qty}
                    onClick={() => run(createClient().rpc("set_material_request_status", { rid: r.id, to_status: "hazir" }), `${r.item} hazır, stoktan düşüldü.`)}
                  >
                    Hazır
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => run(createClient().rpc("set_material_request_status", { rid: r.id, to_status: "reddedildi" }), `${r.item} talebi reddedildi.`)}
                  >
                    Reddet
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty}>Bekleyen malzeme talebi yok.</p>
        )}
      </Glass>
    </>
  );
}
