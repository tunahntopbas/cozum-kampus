import type { ReactNode } from "react";
import Link from "next/link";

// An empty list says what is missing and what to do next, instead of a lone grey sentence.
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: { href: string; label: string } | { onClick: () => void; label: string };
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full border border-hairline bg-[#f6f7f9] text-muted">
        {icon}
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {hint && <p className="text-sm leading-5 text-muted">{hint}</p>}
      </div>
      {action &&
        ("href" in action ? (
          <Link href={action.href} className="mt-1 rounded-lg border border-input-border bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-tint focus-ring">
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 rounded-lg border border-input-border bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-tint focus-ring"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
