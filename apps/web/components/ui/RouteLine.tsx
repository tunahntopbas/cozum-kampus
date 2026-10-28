import type { ReportStatus } from "@/lib/status";

const STEPS = ["Alındı", "Yönlendirildi", "İşlemde", "Çözüldü"] as const;

// How far along the route a report is: index of the last step it reached.
export function routeStep(status: ReportStatus): number {
  switch (status) {
    case "alindi":
      return 0;
    case "yonlendirildi":
    case "yeniden_acildi":
      return 1;
    case "atandi":
    case "islemde":
      return 2;
    case "cozuldu":
      return 3;
    case "geri_cekildi":
      return -1;
  }
}

// Node positions on the curve (viewBox 300×40), matching the login screen's route.
const NODES = [
  [6, 30],
  [102, 12],
  [198, 28],
  [294, 10],
] as const;
const PATH = "M6 30 C 40 30, 64 12, 102 12 S 160 28, 198 28 S 260 10, 294 10";

/**
 * The report's route drawn as a line that draws itself up to the current step when it comes into view.
 * `compact` is the small inline version for list rows (no labels).
 */
export function RouteLine({ status, compact = false }: { status: ReportStatus; compact?: boolean }) {
  const step = routeStep(status);
  const progress = step < 0 ? 0 : step / (STEPS.length - 1);
  const label = step < 0 ? "Geri çekildi" : `Rota: ${STEPS[step]}`;
  const done = step === 3;

  return (
    <div
      className={`route-line ${compact ? "route-line-compact" : ""} ${done ? "route-line-done" : ""}`}
      role="img"
      aria-label={label}
      style={{ ["--route-p" as string]: progress }}
    >
      <svg viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden>
        <path className="route-track" d={PATH} pathLength={1} />
        <path className="route-fill" d={PATH} pathLength={1} />
      </svg>
      {NODES.map(([x, y], i) => (
        <span
          key={STEPS[i]}
          aria-hidden
          className={`route-node ${i <= step ? "route-node-on" : ""} ${i === step ? "route-node-now" : ""}`}
          style={{ left: `${(x / 300) * 100}%`, top: `${(y / 40) * 100}%`, ["--i" as string]: i }}
        >
          {!compact && <span className="route-label">{STEPS[i]}</span>}
        </span>
      ))}
    </div>
  );
}
