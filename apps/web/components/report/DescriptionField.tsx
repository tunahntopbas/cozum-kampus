"use client";

import { Microphone, Stop } from "@phosphor-icons/react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  listening: boolean;
  onToggleDictation: () => void;
  required: boolean;
};

export function DescriptionField({ value, onChange, listening, onToggleDictation, required }: Props) {
  return (
    <div className="sec">
      <label htmlFor="aciklama" className="lbl">
        Açıklama {!required && <span className="font-normal text-muted">isteğe bağlı</span>}
      </label>
      <div className="field relative rounded-lg border border-input-border bg-surface-strong">
        <textarea
          id="aciklama"
          rows={4}
          value={value}
          maxLength={2000}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Örneğin: Koridordaki lamba iki gündür yanmıyor."
          className="block w-full resize-none rounded-lg border-0 bg-transparent py-3 pr-14 pl-3 text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          type="button"
          aria-label={listening ? "Dinlemeyi durdur" : "Sesle anlat"}
          aria-pressed={listening}
          onClick={onToggleDictation}
          className={`t absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-lg border-0 p-0 ${listening ? "btn-red bg-danger text-white" : "ghost bg-tint text-ink"}`}
        >
          {listening ? <Stop size={20} weight="fill" aria-hidden /> : <Microphone size={20} aria-hidden />}
        </button>
      </div>
      <p className="text-xs text-muted">
        Türkçe, İngilizce ve Arapça yazabilir ya da konuşabilirsin. Yapay zeka Türkçeye çevirip birime iletir.
      </p>
    </div>
  );
}
