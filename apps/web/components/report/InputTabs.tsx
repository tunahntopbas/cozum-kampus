"use client";

import { Camera, Microphone, TextAa, type Icon } from "@phosphor-icons/react";

export type InputMode = "foto" | "yazi" | "ses";

const TABS: { id: InputMode; label: string; icon: Icon }[] = [
  { id: "foto", label: "Fotoğraf", icon: Camera },
  { id: "yazi", label: "Yazı", icon: TextAa },
  { id: "ses", label: "Ses", icon: Microphone },
];

const HINTS: Record<InputMode, string> = {
  foto: "Fotoğrafı yükle ya da çek. Yapay zeka sorunu tanır, konumu ve birimi önerir.",
  yazi: "Sorunu kısaca yaz. Yapay zeka metni kategoriye ve birime çevirir.",
  ses: "Mikrofona bas ve sorunu anlat. Söylediklerin açıklamaya yazılır.",
};

export function InputTabs({ mode, onChange }: { mode: InputMode; onChange: (m: InputMode) => void }) {
  return (
    <div className="sec">
      <div role="tablist" aria-label="Bildirim yöntemi" className="grid grid-cols-3 gap-1 rounded-lg bg-tint p-1">
        {TABS.map(({ id, label, icon: IconCmp }) => {
          const selected = id === mode;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(id)}
              className={`t flex items-center justify-center gap-2 rounded px-3 py-2 text-sm ${selected ? "bg-surface-strong font-semibold text-ink" : "ghost bg-transparent font-medium text-muted"}`}
            >
              <IconCmp size={16} weight={selected ? "fill" : "regular"} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted">{HINTS[mode]}</p>
    </div>
  );
}
