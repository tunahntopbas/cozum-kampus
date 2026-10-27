import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-hover",
  secondary: "bg-white/80 text-ink border border-hairline hover:bg-tint",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[transform,background-color] active:scale-[0.98] focus-ring disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  );
}
