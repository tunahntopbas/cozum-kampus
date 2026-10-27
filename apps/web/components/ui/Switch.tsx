"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-3 text-sm text-ink focus-ring rounded-lg active:scale-[0.98] transition-transform"
    >
      <span
        className={`relative h-6 w-10 rounded-full transition-colors ${checked ? "bg-ink" : "bg-input-border"}`}
      >
        <span
          className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}
