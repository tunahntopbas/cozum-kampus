"use client";

import { useMemo, useState } from "react";
import { BuildingsIcon, MagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Chips } from "@/components/student-demo/Common";
import { Glass } from "@/components/ui/Glass";
import {
  QUICK_FILTERS,
  filterReports,
  floorLabel,
  groupByBuilding,
  relativeTime,
  type MapBuilding,
  type MapFilters,
  type MapReport,
  type QuickFilter,
} from "@/lib/campus";
import { CATEGORIES, categoryLabel } from "@/lib/labels";
import { statusMeta, type StatusTone } from "@/lib/status";
import { createClient } from "@/lib/supabase/client";
import s from "@/components/student-demo/StudentDemo.module.css";
import { MapCanvas } from "./MapCanvas";
import { MapReportDetail } from "./MapReportDetail";
import { PaneBar, usePhonePane } from "@/components/layout/Panes";

const STATUS_OPTIONS: { value: StatusTone | ""; label: string }[] = [
  { value: "", label: "Tüm durumlar" },
  { value: "alindi", label: "Alındı" },
  { value: "islemde", label: "İşlemde" },
  { value: "cozuldu", label: "Çözüldü" },
];

type Props = {
  userId: string;
  buildings: MapBuilding[];
  reports: MapReport[];
  unitNames: Record<number, string>;
  votedIds: number[];
};

export function CampusMapView({ userId, buildings, reports: initialReports, unitNames, votedIds }: Props) {
  const [filters, setFilters] = useState<MapFilters>({ query: "", filter: "Tümü", category: "", status: "" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { pane, setPane, jump } = usePhonePane("list");
  // undefined follows the selection automatically; null explicitly closes the accordion.
  const [expanded, setExpanded] = useState<number | null | undefined>(undefined);
  const [localVotes, setLocalVotes] = useState({
    source: votedIds,
    overrides: new Map<number, boolean>(),
  });
  // Retire acknowledged changes so later server-side vote changes remain authoritative.
  if (localVotes.source !== votedIds) {
    const serverVotes = new Set(votedIds);
    setLocalVotes({
      source: votedIds,
      overrides: new Map([...localVotes.overrides].filter(([id, supported]) => serverVotes.has(id) !== supported)),
    });
  }
  const votes = new Set(votedIds);
  for (const [id, supported] of localVotes.overrides) {
    if (supported) votes.add(id);
    else votes.delete(id);
  }
  const reports = useMemo(() => {
    const serverVotes = new Set(votedIds);
    return initialReports.map((r) => {
      const supported = localVotes.overrides.get(r.id);
      const delta = supported === undefined ? 0 : Number(supported) - Number(serverVotes.has(r.id));
      return delta === 0 ? r : { ...r, voteCount: Math.max(r.voteCount + delta, 0) };
    });
  }, [initialReports, votedIds, localVotes.overrides]);
  const [voteBusy, setVoteBusy] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);

  const buildingsById = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);
  const visible = useMemo(
    () => filterReports(reports, buildingsById, filters, userId),
    [reports, buildingsById, filters, userId],
  );
  const groups = useMemo(() => groupByBuilding(visible, buildings), [visible, buildings]);
  const selectedGroup =
    groups.find((g) => g.reports.some((r) => r.id === selectedId)) ??
    groups.find((g) => g.building.id === expanded) ??
    groups[0];
  const selected = selectedGroup?.reports.find((r) => r.id === selectedId) ?? selectedGroup?.reports[0];
  const openBuilding =
    expanded === null ? null : groups.some((g) => g.building.id === expanded) ? expanded : (selectedGroup?.building.id ?? null);
  const openCount = reports.filter((r) => r.status !== "cozuldu" && r.status !== "geri_cekildi").length;

  const set = (patch: Partial<MapFilters>) => setFilters((f) => ({ ...f, ...patch }));

  function selectBuilding(id: number) {
    setExpanded(id);
    const group = groups.find((g) => g.building.id === id);
    if (group) setSelectedId(group.reports[0].id);
  }

  async function toggleSupport(report: MapReport) {
    const had = votes.has(report.id);
    setVoteBusy(true);
    setVoteError(null);
    const supabase = createClient();
    const { error } = had
      ? await supabase.from("report_votes").delete().eq("report_id", report.id).eq("user_id", userId)
      : await supabase.from("report_votes").insert({ report_id: report.id, user_id: userId });
    setVoteBusy(false);
    if (error) {
      setVoteError("Desteğin kaydedilemedi. Bağlantını kontrol edip yeniden dene.");
      return;
    }
    setLocalVotes((prev) => {
      const overrides = new Map(prev.overrides);
      if (prev.source.includes(report.id) === !had) overrides.delete(report.id);
      else overrides.set(report.id, !had);
      return { ...prev, overrides };
    });
  }

  return (
    <main id="icerik" className={`${s.root} ${s.mapPage}`} data-show={pane}>
      <PaneBar
        className={s.mapBar}
        labels={[
          { id: "list", label: "Liste" },
          { id: "map", label: "Harita" },
          { id: "detail", label: "Detay" },
        ]}
        value={pane}
        onChange={setPane}
      />
      <div className={s.mapCanvas} aria-label="Kampüs haritası" data-pane="map">
        <MapCanvas
          groups={groups}
          selectedBuildingId={selectedGroup?.building.id ?? null}
          onSelect={(id) => {
            selectBuilding(id);
            jump("detail");
          }}
        />
      </div>

      <Glass className={`${s.mapLeft} ${s.stack}`} data-pane="list">
        <div className={s.row}>
          <span className={s.icon}>
            <BuildingsIcon size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-semibold">Çözüm Kampüs</h1>
            <p className={s.muted}>Sakarya Üniversitesi, {openCount} açık bildirim</p>
          </div>
        </div>
        <label className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 text-muted" size={20} aria-hidden="true" />
          <span className="sr-only">Bina, kat ya da sorun ara</span>
          <input
            className={`${s.input} !pl-10`}
            type="search"
            placeholder="Bina, kat ya da sorun ara"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
          />
        </label>
        <Chips
          label="Harita filtreleri"
          options={[...QUICK_FILTERS]}
          value={filters.filter}
          onChange={(v) => set({ filter: v as QuickFilter })}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            aria-label="Kategori"
            className={s.input}
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="">Tüm kategoriler</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
          <select
            aria-label="Durum"
            className={s.input}
            value={filters.status}
            onChange={(e) => set({ status: e.target.value as StatusTone | "" })}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h2 className={`${s.small} mb-1 px-2 font-semibold`}>Binalara göre · {visible.length} bildirim</h2>
          {!groups.length && (
            <p className="p-3" role="status">
              Bu filtrelere uygun bildirim yok.
            </p>
          )}
          {groups.map(({ building, reports: items }) => {
            const urgent = items.filter((r) => r.urgency === "acil").length;
            const open = openBuilding === building.id;
            return (
              <div key={building.id}>
                <button
                  type="button"
                  className={`${s.item} !p-2`}
                  aria-expanded={open}
                  onClick={() => (open ? setExpanded(null) : selectBuilding(building.id))}
                >
                  <span className={s.itemBody}>
                    <span className="font-medium">{building.name}</span>
                    <span className={s.small}>
                      {items.length} bildirim{urgent > 0 && `, ${urgent} acil`}
                    </span>
                  </span>
                  <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
                </button>
                {open && (
                  <div className="pl-2">
                    {items.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`${s.item} !p-2`}
                        aria-pressed={selected?.id === r.id}
                        onClick={() => {
                          setSelectedId(r.id);
                          jump("detail");
                        }}
                      >
                        <span
                          className={s.dot}
                          style={{
                            background:
                              r.urgency === "acil" ? "#b91c1c" : r.status === "cozuldu" ? "#166534" : undefined,
                          }}
                        />
                        <span className={s.itemBody}>
                          <span>{r.title}</span>
                          <span className={s.small}>
                            {[statusMeta(r.status).label, floorLabel(r.floor), `${r.voteCount} kişi`, relativeTime(r.createdAt)]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Glass>

      <Glass className={s.mapRight} data-pane="detail">
        {selected && selectedGroup ? (
          <>
            <MapReportDetail
              key={selected.id}
              report={selected}
              buildingName={selectedGroup.building.name}
              unitName={selected.unitId != null ? (unitNames[selected.unitId] ?? "") : "Yönlendirme bekleniyor"}
              supported={votes.has(selected.id)}
              supportBusy={voteBusy}
              isMine={selected.reporterId === userId}
              onSupport={() => toggleSupport(selected)}
            />
            {voteError && (
              <p role="alert" className="m-2 rounded-lg bg-[#FEF2F2] p-3 text-sm text-danger">
                {voteError}
              </p>
            )}
          </>
        ) : (
          <p className="p-4 text-muted">Filtrelerini değiştirerek haritadan bir bildirim seç.</p>
        )}
      </Glass>

      <div className={s.emergency}>
        <button
          type="button"
          className="btn-red t flex items-center gap-2 rounded-lg bg-danger px-3 py-2 font-semibold text-white"
          onClick={() => setEmergency((v) => !v)}
          aria-expanded={emergency}
        >
          <WarningCircleIcon size={20} aria-hidden="true" />
          Acil durum
        </button>
        {emergency && (
          <Glass className="mt-2 max-w-72 p-4">
            <p>Can güvenliği riski varsa 112 Acil Çağrı Merkezi’ni ara.</p>
            <a className="mt-2 inline-block font-semibold text-danger underline" href="tel:112">
              112’yi ara
            </a>
          </Glass>
        )}
      </div>
      <Glass className={s.legend}>
        <span className="text-danger">● Acil</span> · <span className="text-amber-700">● İşlemde</span> ·{" "}
        <span className="text-green-800">● Çözüldü</span>
      </Glass>
    </main>
  );
}
