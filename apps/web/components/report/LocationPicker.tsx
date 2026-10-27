"use client";

import { Crosshair, MapPin } from "@phosphor-icons/react";
import { fieldBox } from "@/components/ui/Field";

export type Building = { id: number; name: string; floors: number | null };
export type QrPlace = { id: number; name: string; floor: number | null; buildingId: number; buildingName: string };

export type LocationValue = {
  buildingId: number | null;
  floor: number | null;
  placeId: number | null;
  lat: number | null;
  lng: number | null;
};

type Props = {
  buildings: Building[];
  value: LocationValue;
  qrPlace: QrPlace | null;
  onChange: (v: LocationValue) => void;
  onUnlockQr: () => void;
  locating: boolean;
  onUseMyLocation: () => void;
};

const selectClass = "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none";

function caption(value: LocationValue, qr: boolean) {
  if (qr) return "Konum QR koddan alındı";
  if (value.lat != null) return "Konum GPS ile bulundu";
  if (value.buildingId != null) return "Konum bina seçiminden alındı";
  return "Bina seç ya da konumunu kullan";
}

export function LocationPicker({ buildings, value, qrPlace, onChange, onUnlockQr, locating, onUseMyLocation }: Props) {
  const building = buildings.find((b) => b.id === value.buildingId);
  const floors = Array.from({ length: Math.max(building?.floors ?? 1, 1) }, (_, i) => i);

  return (
    <div className="sec">
      <p className="lbl" id="konum-lbl">
        Konum
      </p>
      {qrPlace ? (
        <div className={`${fieldBox} bg-surface-strong`}>
          <MapPin size={20} weight="fill" className="flex-none text-accent" aria-hidden />
          <p className="flex-1 text-sm font-medium">
            {qrPlace.buildingName}
            {qrPlace.floor != null && `, ${qrPlace.floor}. kat`} · {qrPlace.name}
          </p>
          <button type="button" onClick={onUnlockQr} className="rounded-lg text-sm font-semibold text-accent">
            Değiştir
          </button>
        </div>
      ) : (
        <div className="flex gap-2 max-sm:flex-col">
          <div className={`${fieldBox} flex-1 bg-surface-strong`}>
            <MapPin size={20} weight="fill" className="flex-none text-accent" aria-hidden />
            <select
              aria-labelledby="konum-lbl"
              value={value.buildingId ?? ""}
              onChange={(e) =>
                onChange({ ...value, buildingId: e.target.value ? Number(e.target.value) : null, floor: null, placeId: null })
              }
              className={selectClass}
            >
              <option value="">Bina seç</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {building && (
              <select
                aria-label="Kat"
                value={value.floor ?? ""}
                onChange={(e) => onChange({ ...value, floor: e.target.value === "" ? null : Number(e.target.value) })}
                className="w-24 flex-none border-0 bg-transparent p-0 text-sm text-ink outline-none"
              >
                <option value="">Kat</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    {f === 0 ? "Zemin" : `${f}. kat`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="ghost t flex items-center justify-center gap-2 rounded-lg border border-input-border bg-surface-strong px-3 py-2 text-sm font-semibold whitespace-nowrap text-ink disabled:opacity-60"
          >
            <Crosshair size={20} aria-hidden />
            {locating ? "Konum alınıyor" : "Konumumu kullan"}
          </button>
        </div>
      )}
      <div
        role="img"
        aria-label="Seçilen konumu gösteren şematik harita"
        className="relative h-36 overflow-hidden rounded-lg bg-map-bg"
      >
        <svg viewBox="0 0 640 144" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <g fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round">
            <path d="M-10 92 C180 84 380 100 650 80" />
            <path d="M210 -10 C204 60 214 100 208 160" />
            <path d="M450 -10 C444 60 456 100 450 160" />
          </g>
          <g fill="#DAE2EE" stroke="#BAC7DA">
            <rect x="60" y="16" width="110" height="56" rx="4" />
            <rect x="250" y="20" width="160" height="52" rx="4" />
            <rect x="490" y="14" width="110" height="58" rx="4" />
            <rect x="250" y="106" width="150" height="40" rx="4" />
          </g>
          {(value.buildingId != null || value.lat != null || qrPlace) && (
            <g transform="translate(330 46)">
              <circle r="18" fill="#1F5FD6" opacity="0.18" />
              <circle r="7" fill="#1F5FD6" stroke="#FFFFFF" strokeWidth="3" />
            </g>
          )}
        </svg>
        <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted">
          {caption(value, Boolean(qrPlace))}
        </span>
      </div>
    </div>
  );
}
