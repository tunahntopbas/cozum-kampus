const ROADS = [
  "M-20 440 C300 428 700 452 1460 418",
  "M-20 440 C400 428 900 454 1460 416",
  "M470 -20 C462 300 482 400 470 920",
  "M780 -20 C772 220 796 400 786 920",
  "M1100 -20 C1092 300 1112 400 1100 920",
];
const BUILDINGS = [
  [510, 50, 120, 80],
  [660, 60, 90, 70],
  [830, 60, 130, 90],
  [990, 70, 80, 70],
  [520, 540, 150, 90],
  [830, 560, 150, 100],
  [1150, 510, 140, 90],
];

// Decorative campus backdrop behind glass panels (docs/tasarim/Hesap.dc.html). Hidden on narrow screens.
export function Stage() {
  return (
    <div
      className="stage pointer-events-none absolute top-0 left-1/2 -ml-[720px] h-[900px] w-[1440px] overflow-hidden"
      aria-hidden="true"
    >
      <svg width="1440" height="900" viewBox="0 0 1440 900" className="block">
        <rect width="1440" height="900" fill="#E9EEF5" />
        <rect x="40" y="540" width="380" height="240" rx="16" fill="#D9E8DF" />
        <rect x="1140" y="100" width="260" height="180" rx="12" fill="#D9E8DF" />
        <g fill="none" stroke="#D2DBE8" strokeWidth="20" strokeLinecap="round">
          {ROADS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="none" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round">
          {ROADS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="#DAE2EE" stroke="#BAC7DA" strokeWidth="1">
          {BUILDINGS.map(([x, y, w, h]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="4" />
          ))}
        </g>
      </svg>
    </div>
  );
}
