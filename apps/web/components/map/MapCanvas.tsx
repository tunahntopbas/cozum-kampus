"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { BuildingGroup } from "@/lib/campus";
import css from "./Map.module.css";

// OpenFreeMap needs no API key; the style adds the OpenStreetMap attribution itself. "liberty" is the closest
// to the OpenStreetMap look (green areas, parking and transit icons).
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
// Copied into public/ by scripts/copy-maplibre-worker.mjs; the bundled default path does not survive bundling.
const WORKER_URL = "/maplibre-gl-worker.mjs";
// Esentepe Campus, Serdivan.
const CENTER: [number, number] = [30.3315, 40.7418];
const BOUNDS: [[number, number], [number, number]] = [
  [30.31, 40.73],
  [30.355, 40.752],
];

type Props = {
  groups: BuildingGroup[];
  selectedBuildingId: number | null;
  onSelect: (buildingId: number) => void;
};

export function MapCanvas({ groups, selectedBuildingId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<number, Marker>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // MapLibre owns the marker elements; React renders each pin button into its element through a portal.
  const [elements, setElements] = useState<Map<number, HTMLElement>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    const owned = markers.current;
    import("maplibre-gl")
      .then(({ Map, NavigationControl, setWorkerUrl }) => {
        if (cancelled || !container.current) return;
        setWorkerUrl(WORKER_URL);
        const m = new Map({
          container: container.current,
          style: STYLE_URL,
          center: CENTER,
          zoom: 16,
          minZoom: 14,
          maxBounds: BOUNDS,
          attributionControl: { compact: true },
        });
        m.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
        map.current = m;
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      owned.forEach((marker) => marker.remove());
      owned.clear();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    let cancelled = false;
    import("maplibre-gl").then(({ Marker }) => {
      if (cancelled) return;
      const wanted = new Set(groups.map((g) => g.building.id));
      for (const [id, marker] of markers.current) {
        if (wanted.has(id)) continue;
        marker.remove();
        markers.current.delete(id);
      }
      for (const g of groups) {
        if (markers.current.has(g.building.id)) continue;
        const marker = new Marker({ element: document.createElement("div") })
          .setLngLat([g.building.lng, g.building.lat])
          .addTo(m);
        markers.current.set(g.building.id, marker);
      }
      setElements(new Map([...markers.current].map(([id, marker]) => [id, marker.getElement()])));
    });
    return () => {
      cancelled = true;
    };
  }, [groups, ready]);

  useEffect(() => {
    const b = groups.find((g) => g.building.id === selectedBuildingId)?.building;
    if (ready && b && map.current) map.current.easeTo({ center: [b.lng, b.lat], duration: 400 });
  }, [selectedBuildingId, groups, ready]);

  return (
    <>
      {/* Inline style: maplibre-gl.css sets .maplibregl-map to position: relative, which would win over a class. */}
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      {failed && (
        <p role="status" className="absolute left-1/2 top-24 z-[2] -translate-x-1/2 rounded-lg bg-white px-3 py-2 text-sm">
          Harita yüklenemedi. Bina listesinden devam edebilirsin.
        </p>
      )}
      {groups.map((g) => {
        const el = elements.get(g.building.id);
        if (!el) return null;
        const urgent = g.reports.some((r) => r.urgency === "acil" && r.status !== "cozuldu");
        return createPortal(
          <button
            type="button"
            className={css.pin}
            aria-label={`${g.building.name} harita işareti`}
            aria-pressed={selectedBuildingId === g.building.id}
            onClick={() => onSelect(g.building.id)}
          >
            {g.reports.length}
            {urgent && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-danger" />}
          </button>,
          el,
          g.building.id,
        );
      })}
    </>
  );
}
