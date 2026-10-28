"use client";

import { useRef } from "react";
import { Camera, Image as ImageIcon, Sparkle, X } from "@phosphor-icons/react";

export type Photo = { path: string; previewUrl: string };

export const MAX_PHOTOS = 3;

type Props = {
  photos: Photo[];
  uploading: boolean;
  aiLabel?: string;
  onAdd: (files: File[]) => void;
  onRemove: (path: string) => void;
};

const tile =
  "tile t flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#b4c2bb] bg-transparent text-ink";

export function PhotoPicker({ photos, uploading, aiLabel, onAdd, onRemove }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const free = MAX_PHOTOS - photos.length;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, free);
    e.target.value = "";
    if (files.length) onAdd(files);
  }

  return (
    <div className="sec">
      <p className="lbl">
        Fotoğraflar{" "}
        <span className="mono font-medium text-muted">
          {photos.length} / {MAX_PHOTOS}
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={p.path} className="relative h-36 overflow-hidden rounded-lg bg-[#D5DEEC]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={p.previewUrl} alt={`Yüklenen fotoğraf ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && aiLabel && (
              <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1 truncate rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink">
                <Sparkle size={12} weight="fill" aria-hidden />
                {aiLabel}
              </span>
            )}
            <button
              type="button"
              aria-label="Fotoğrafı kaldır"
              onClick={() => onRemove(p.path)}
              className="t absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white p-0 text-ink"
            >
              <X size={14} weight="bold" aria-hidden />
            </button>
          </div>
        ))}
        {free > 0 && (
          <button type="button" className={tile} disabled={uploading} onClick={() => cameraRef.current?.click()}>
            <Camera size={24} aria-hidden />
            <span className="text-sm font-semibold">{uploading ? "Yükleniyor" : "Fotoğraf çek"}</span>
          </button>
        )}
        {free > 1 && (
          <button type="button" className={tile} disabled={uploading} onClick={() => galleryRef.current?.click()}>
            <ImageIcon size={24} aria-hidden />
            <span className="text-sm font-semibold">Galeriden seç</span>
          </button>
        )}
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={pick}
      />
      <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pick} />
    </div>
  );
}
