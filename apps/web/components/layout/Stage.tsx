// Calm backdrop behind glass panels on every screen except the live map: two soft colour fields and faint contour
// lines (a nod to Sakarya's terrain) give the translucent panels something to blur without looking like a map.
const RINGS = [60, 120, 180, 240, 300, 360, 420, 480];

function Contours({ cx, cy, id }: { cx: number; cy: number; id: string }) {
  return (
    <g filter={`url(#${id})`}>
      {RINGS.map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  );
}

export function Stage() {
  return (
    <div className="stage pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_12%_8%,rgba(31,95,214,0.24),transparent_60%),radial-gradient(50rem_36rem_at_92%_88%,rgba(120,170,140,0.32),transparent_60%),linear-gradient(180deg,#f3f6fb_0%,#e9eef6_100%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="contour-a" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="90" />
          </filter>
          <filter id="contour-b" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="2" seed="21" />
            <feDisplacementMap in="SourceGraphic" scale="80" />
          </filter>
        </defs>
        <g fill="none" stroke="#0f2a5c" strokeOpacity="0.09" strokeWidth="1.2">
          <Contours cx={260} cy={160} id="contour-a" />
          <Contours cx={1230} cy={760} id="contour-b" />
        </g>
      </svg>
    </div>
  );
}
