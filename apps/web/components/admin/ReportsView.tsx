"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { Badge, Filters } from "@/components/admin-demo/ui";
import s from "@/components/admin-demo/admin.module.css";
import { ADMIN_FILTERS, filterAdminReports, isOverdue, type AdminFilter } from "@/lib/admin";
import { relativeTime } from "@/lib/campus";
import { categoryLabel, urgencyLabel, type Urgency } from "@/lib/labels";
import { statusMeta, type ReportStatus } from "@/lib/status";
import { createClient } from "@/lib/supabase/client";
import type { AdminData, PanelReport } from "./types";
import { EmptyState } from "@/components/ui/EmptyState";
import { MagnifyingGlass as MagnifyingGlassIcon_ } from "@phosphor-icons/react";
import { SheetPanes } from "@/components/layout/Panes";
import { RouteLine } from "@/components/ui/RouteLine";
import { FilterMore } from "@/components/ui/FilterMore";

export type StaffMember = { id: string; name: string; unitId: number | null };
export type ReportNote = {
  reportId: number;
  body: string;
  createdAt: string;
  author: string;
};

const STATUSES: ReportStatus[] = ["alindi", "yonlendirildi", "atandi", "islemde", "yeniden_acildi", "cozuldu"];
const URGENCIES: Urgency[] = ["dusuk", "orta", "acil"];
const DATE = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export function ReportsView({
  data,
  staff,
  assignments,
  notes,
  initialFilter = "Tümü",
  initialQuery = "",
}: {
  data: AdminData;
  staff: StaffMember[];
  assignments: Record<number, string>;
  notes: ReportNote[];
  initialFilter?: AdminFilter;
  initialQuery?: string;
}) {
  const [now] = useState(() => new Date());
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<AdminFilter>(initialFilter);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const unitName = new Map(data.units.map((u) => [u.id, u.name]));
  const visible = filterAdminReports(data.reports, { query, filter, unitId }, now);
  const active = visible.find((r) => r.id === selected) ?? visible[0];

  return (
    <>
      <PageHeader title="Bildirimler" description="Kampüsteki tüm kayıtlar, yönlendirme ve durum yönetimi." />
      <Glass className={s.toolbar}>
        <input
          className={`${s.input} ${s.search}`}
          aria-label="Bildirim ara"
          placeholder="Başlık, konum ya da numara ara"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMessage("");
          }}
        />
        <FilterMore
          summary={[filter !== ADMIN_FILTERS[0] ? filter : "", unitId != null ? (unitName.get(unitId) ?? "") : ""]
            .filter(Boolean)
            .join(", ")}
        >
          <Filters
            label="Durum filtresi"
            options={[...ADMIN_FILTERS]}
            value={filter}
            onChange={(value) => {
              setFilter(value as AdminFilter);
              setMessage("");
            }}
          />
          <select
            className={`${s.input} !w-auto max-w-full`}
            aria-label="Birim filtresi"
            value={unitId ?? ""}
            onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Tüm birimler</option>
            {data.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </FilterMore>
      </Glass>
      <p role="status" className={s.small}>
        {message || `${visible.length} bildirim gösteriliyor`}
      </p>
      <SheetPanes className={s.split} openOn={`.${s.listButton}`} label="Bildirim detayını">
        <Glass className={s.list}>
          <section aria-label="Bildirim listesi">
            <div className={`${s.reportRow} px-3 py-2 text-xs text-muted`} aria-hidden>
              <span>No</span>
              <span>Bildirim</span>
              <span>Aciliyet</span>
              <span>Yaş</span>
            </div>
            {visible.length ? (
              <ol>
                {visible.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={`${s.listButton} ${s.reportRow}`}
                      aria-current={active?.id === r.id ? "true" : undefined}
                      onClick={() => {
                        setSelected(r.id);
                        setMessage("");
                      }}
                    >
                      <span className="mono text-xs text-muted">#{r.id}</span>
                      <span className={s.listText}>
                        <strong>{r.title}</strong>
                        <span className={s.small}>{r.place || "Konum belirtilmemiş"}</span>
                      </span>
                      <span>{r.urgency === "acil" && <Badge>{urgencyLabel(r.urgency)}</Badge>}</span>
                      <span className="mono text-xs text-muted">{relativeTime(r.createdAt, now)}</span>
                      <span className={s.reportMeta}>
                        <span className={s.small}>{r.unitId != null ? unitName.get(r.unitId) : "Yönlendirilmedi"}</span>
                        <RouteLine status={r.status} compact />
                        {isOverdue(r, now) && <Badge>Gecikmiş</Badge>}
                        {data.unverified.includes(r.id) && <Badge>Doğrulanmadı</Badge>}
                        {r.isHidden && <Badge>Yayında değil</Badge>}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                icon={<MagnifyingGlassIcon_ size={22} />}
                title="Eşleşen bildirim bulunamadı."
                hint="Aramayı kısalt ya da filtreleri Tümü yap."
              />
            )}
          </section>
        </Glass>
        {active ? (
          <ReportDetail
            key={`${active.id}-${active.unitId}-${active.status}-${active.urgency}-${assignments[active.id] ?? ""}`}
            report={active}
            units={data.units}
            staff={staff}
            assigned={assignments[active.id] ?? ""}
            notes={notes.filter((n) => n.reportId === active.id)}
            unverified={data.unverified.includes(active.id)}
            onSaved={(text) => setMessage(text)}
          />
        ) : (
          <Glass className={s.panel}>
            <p className={s.muted}>Detay görmek için filtreleri değiştirin.</p>
          </Glass>
        )}
      </SheetPanes>
    </>
  );
}

function ReportDetail({
  report,
  units,
  staff,
  assigned,
  notes,
  unverified,
  onSaved,
}: {
  report: PanelReport;
  units: { id: number; name: string }[];
  staff: StaffMember[];
  assigned: string;
  notes: ReportNote[];
  unverified: boolean;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const [unit, setUnit] = useState(report.unitId == null ? "" : String(report.unitId));
  const [urgency, setUrgency] = useState<Urgency>(report.urgency);
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [person, setPerson] = useState(assigned);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const team = staff.filter((p) => String(p.unitId) === unit);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    onSaved("");
    // Routing an unrouted report moves it forward, as in the design.
    const nextStatus = unit && status === "alindi" ? "yonlendirildi" : status;
    const { data, error: err } = await createClient().rpc("admin_update_report", {
      rid: report.id,
      to_unit: unit ? Number(unit) : null,
      to_urgency: urgency,
      to_status: person && nextStatus === "yonlendirildi" ? "atandi" : nextStatus,
      to_staff: person || null,
      note: note.trim() || null,
    });
    setBusy(false);
    if (err || data !== true) {
      setError("Değişiklikler kaydedilemedi. Tekrar dene.");
      return;
    }
    onSaved(`#${report.id} kaydedildi.`);
    setNote("");
    router.refresh();
  }

  // Reports filed while the AI could not check them, or rejected by it, stay off the campus map until reviewed.
  async function setVisibility(hidden: boolean) {
    setBusy(true);
    setError("");
    const { error: err } = await createClient().from("reports").update({ is_hidden: hidden }).eq("id", report.id);
    setBusy(false);
    if (err) {
      setError("Görünürlük değiştirilemedi. Tekrar dene.");
      return;
    }
    onSaved(hidden ? `#${report.id} kampüsten gizlendi.` : `#${report.id} kampüste yayınlandı.`);
    router.refresh();
  }

  return (
    <Glass className={`${s.panel} ${s.stack}`}>
      <section aria-label="Bildirim detayı" className={s.stack}>
        <div>
          <p className={s.small}>
            #{report.id} · {report.place || "Konum belirtilmemiş"}
          </p>
          <h2>{report.title}</h2>
        </div>
        <div className={s.filters}>
          <Badge>{statusMeta(report.status).label}</Badge>
          <Badge>{categoryLabel(report.category)}</Badge>
          {unverified && <Badge>Doğrulanmadı</Badge>}
          {report.isHidden && <Badge>Yayında değil</Badge>}
        </div>
        <RouteLine key={`${report.id}-${report.status}`} status={report.status} />
        <div className={`${s.note} ${s.row} text-sm`}>
          <p className="min-w-0 flex-1">
            {report.isHidden
              ? "Bu bildirim içerik denetiminden geçmedi ya da denetlenemedi; haritada görünmüyor. İçeriği kontrol edip yayınlayabilirsin."
              : "Bildirim kampüs haritasında herkese açık."}
          </p>
          <Button variant="secondary" disabled={busy} onClick={() => setVisibility(!report.isHidden)}>
            {report.isHidden ? "Yayınla" : "Gizle"}
          </Button>
        </div>
        {report.aiSummary && (
          <div className={s.note}>
            <h3>Yapay zeka özeti</h3>
            <p>{report.aiSummary}</p>
          </div>
        )}
        {report.description && <p className="text-sm">{report.description}</p>}
        {unverified && (
          <p className={`${s.note} text-sm`}>
            Personel işi tamamladı ama yapay zeka çözüm fotoğrafını doğrulayamadı. Durumu “Yeniden açıldı” yaparak
            birime geri gönderebilirsin.
          </p>
        )}
        <form className={s.stack} onSubmit={save}>
          <label className={s.field}>
            Sorumlu birim
            <select
              className={s.input}
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setPerson("");
              }}
            >
              <option value="">Yönlendirilmedi</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            Aciliyet
            <select className={s.input} value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {urgencyLabel(u)}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            Atanan teknisyen
            <select className={s.input} value={person} disabled={!unit} onChange={(e) => setPerson(e.target.value)}>
              <option value="">{team.length ? "Atanmadı" : "Birimde personel yok"}</option>
              {team.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            Bildirim durumu
            <select className={s.input} value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
              {STATUSES.map((v) => (
                <option key={v} value={v}>
                  {statusMeta(v).label}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            İç not
            <textarea
              className={s.input}
              rows={3}
              maxLength={1500}
              value={note}
              aria-describedby="admin-note-hint"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <p id="admin-note-hint" className={s.small}>
            Öğrenciye görünmez; yönetim ve ilgili birim görür.
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Kaydediliyor" : "Değişiklikleri kaydet"}
          </Button>
        </form>
        {notes.length > 0 && (
          <div className={s.stack}>
            <h3>İç notlar</h3>
            <ul className={s.stack}>
              {notes.map((n, i) => (
                <li key={i} className={s.note}>
                  <p>{n.body}</p>
                  <p className={s.small}>
                    {n.author} · {DATE.format(new Date(n.createdAt))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </Glass>
  );
}
