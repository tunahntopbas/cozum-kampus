import type { ReactNode } from "react";
import { PageContent } from "@/components/layout/PageContent";

// Loading placeholders shaped like the page that is coming, so the layout does not jump when data arrives.
function Bar({ className = "" }: { className?: string }) {
  return <span className={`block rounded-md bg-[#e9edf3] motion-safe:animate-pulse ${className}`} />;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass flex flex-col gap-4 p-6 ${className}`}>{children}</div>;
}

function Rows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-hairline py-3 last:border-0">
          <Bar className="h-9 w-9 flex-none rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Bar className={`h-3.5 ${i % 2 ? "w-1/2" : "w-2/3"}`} />
            <Bar className="h-3 w-1/3" />
          </div>
          <Bar className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </>
  );
}

type Variant = "split" | "list" | "form" | "grid";

export function PageSkeleton({
  label = "Yükleniyor",
  variant = "split",
  stats = 0,
  standalone = false,
}: {
  label?: string;
  variant?: Variant;
  stats?: number;
  standalone?: boolean;
}) {
  const body = (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-3" aria-hidden>
        <Bar className="h-8 w-56" />
        <Bar className="h-4 w-80 max-w-full" />
      </div>
      {stats > 0 && (
        <div
          aria-hidden
          className="grid overflow-hidden rounded-xl border border-hairline bg-white"
          style={{ gridTemplateColumns: `repeat(${stats}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: stats }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 border-l border-hairline p-6 first:border-l-0">
              <Bar className="h-3 w-24" />
              <Bar className="h-7 w-16" />
              <Bar className="h-3 w-32" />
            </div>
          ))}
        </div>
      )}
      <div aria-hidden>
        {variant === "split" && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Panel>
              <Rows count={5} />
            </Panel>
            <Panel>
              <Bar className="h-6 w-2/3" />
              <Bar className="h-4 w-1/2" />
              <Bar className="h-44 w-full rounded-lg" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-5/6" />
            </Panel>
          </div>
        )}
        {variant === "list" && (
          <Panel>
            <Rows count={6} />
          </Panel>
        )}
        {variant === "grid" && (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Panel key={i}>
                <Bar className="h-5 w-1/2" />
                <Bar className="h-8 w-3/4" />
                <Bar className="h-3 w-1/3" />
              </Panel>
            ))}
          </div>
        )}
        {variant === "form" && (
          <Panel className="max-w-2xl">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Bar className="h-3.5 w-28" />
                <Bar className="h-11 w-full rounded-lg" />
              </div>
            ))}
            <Bar className="h-11 w-40 rounded-lg" />
          </Panel>
        )}
      </div>
    </div>
  );
  return standalone ? <PageContent>{body}</PageContent> : body;
}
