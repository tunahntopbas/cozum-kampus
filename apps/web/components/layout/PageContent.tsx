import { ViewTransition, type ReactNode } from "react";

// Main column used by student pages (max 1200px, 96px top for the floating nav).
export function PageContent({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
    <main id="icerik" className="content relative z-[3] mx-auto flex max-w-[1200px] flex-col gap-6 px-6 pb-10">
      {children}
    </main>
    </ViewTransition>
  );
}
