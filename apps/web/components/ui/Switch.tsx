"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
};

// 44x24 track from docs/tasarim/Bildir.dc.html.
export function Switch({ checked, onChange, label, hideLabel = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="t inline-flex flex-none items-center gap-3 rounded-full text-sm text-ink"
    >
      <span
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${checked ? "justify-end bg-ink" : "justify-start bg-[#b4c2bb]"}`}
      >
        <span className="block h-5 w-5 rounded-full bg-white" />
      </span>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
