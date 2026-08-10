import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// DottedWorldMapConnect — dekorative Punktkarte mit animierten Verbindungs-
// pfaden. Ein vorgerendertes SVG-Punktfeld (deterministische Punkte, grob
// kontinentförmig gruppiert) wird mit animierten "Flug"-Bögen verbunden, die
// nacheinander aufleuchten (Stagger). Punkte pulsieren sanft. Kein rAF-Loop
// für die Bögen (CSS/SMIL-nah via CSS-Animation auf stroke-dashoffset),
// nur ein leichter Loop fürs Pulsieren der Hot-Spots.
// Reduced Motion: statische Punktkarte ohne Bögen.
// ---------------------------------------------------------------------------

export interface DottedWorldMapConnectProps {
  /** Anzahl der Verbindungsbögen (2–10). */
  arcs?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

interface Point {
  x: number;
  y: number;
  r: number;
  cluster: number;
}

interface Arc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midY: number;
  delay: number;
}

export function DottedWorldMapConnect({
  arcs = 6,
  seed = 20260810,
}: DottedWorldMapConnectProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const safeArcs = clamp(Math.round(arcs), 2, 10);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministisches Punktfeld: 5 "Kontinente" als Punkt-Cluster.
  const points = useMemo<Point[]>(() => {
    const clusters = [
      { cx: 22, cy: 38, n: 26 },
      { cx: 48, cy: 30, n: 30 },
      { cx: 70, cy: 42, n: 24 },
      { cx: 34, cy: 68, n: 18 },
      { cx: 62, cy: 72, n: 20 },
    ];
    return clusters.flatMap((c, ci) =>
      Array.from({ length: c.n }, () => {
        const ang = rng() * Math.PI * 2;
        const rad = 2.2 + rng() * 5.5;
        return {
          x: c.cx + Math.cos(ang) * rad,
          y: c.cy + Math.sin(ang) * rad * 0.72,
          r: 0.5 + rng() * 0.9,
          cluster: ci,
        };
      })
    );
  }, [rng]);

  // Verbindungsbögen zwischen zufälligen Clustern (deterministisch).
  const arcPaths = useMemo<Arc[]>(() => {
    const clusters = [0, 1, 2, 3, 4];
    const arcsOut: Arc[] = [];
    for (let i = 0; i < safeArcs; i++) {
      const a = clusters[i % clusters.length];
      const b = clusters[(i * 2 + 1) % clusters.length];
      const from = points.find((p) => p.cluster === a);
      const to = points.find((p) => p.cluster === b);
      if (!from || !to) continue;
      const x1 = from.x + (rng() - 0.5) * 4;
      const y1 = from.y + (rng() - 0.5) * 4;
      const x2 = to.x + (rng() - 0.5) * 4;
      const y2 = to.y + (rng() - 0.5) * 4;
      arcsOut.push({
        x1, y1, x2, y2,
        midY: Math.max(y1, y2) - 12 - rng() * 18,
        delay: i * 0.9,
      });
    }
    return arcsOut;
  }, [safeArcs, points, rng]);

  // Hot-Spot-Puls (ein sanfter rAF-Loop, nur opacity/transform auf 3 Punkte).
  const spotRefs = useRef<(SVGCircleElement | null)[]>([]);
  useRafLoop((t) => {
    if (reduced) return;
    spotRefs.current.forEach((el, i) => {
      if (!el) return;
      const phase = ((t / 1000) * 0.8 + i * 0.35) % 1;
      el.setAttribute('opacity', String(0.35 + Math.sin(phase * Math.PI) * 0.55));
      const r = 2.2 + Math.sin(phase * Math.PI) * 1.6;
      el.setAttribute('r', String(r));
    });
  }, true);

  const vars = {
    '--dwm-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="dwm-root" style={vars} aria-hidden="true">
      <svg className="dwm-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="dwm-glow">
            <stop offset="0" stopColor="var(--dwm-gold)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--dwm-gold)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {!reduced &&
          arcPaths.map((a, i) => (
            <path
              key={i}
              d={`M ${a.x1} ${a.y1} Q ${(a.x1 + a.x2) / 2} ${a.midY} ${a.x2} ${a.y2}`}
              fill="none"
              stroke="var(--dwm-gold)"
              strokeOpacity="0.55"
              strokeWidth="0.35"
              strokeDasharray="3 2.4"
              className="dwm-arc"
              style={{ animationDelay: `${a.delay}s` }}
            />
          ))}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="var(--dwm-gold)" opacity="0.5" />
        ))}
        {points
          .filter((_, i) => i % 37 === 0)
          .map((p, i) => (
            <circle
              key={`s${i}`}
              ref={(el) => {
                spotRefs.current[i] = el;
              }}
              cx={p.x}
              cy={p.y}
              r={2.2}
              fill="url(#dwm-glow)"
            />
          ))}
      </svg>
      <style>{`
.dwm-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(120% 90% at 50% 30%,#0b0e16,#05070b)}
.dwm-svg{width:100%;height:100%;padding:6%}
.dwm-arc{animation:dwm-dash 3.2s ease-in-out infinite;will-change:stroke-dashoffset}
@keyframes dwm-dash{
  0%{stroke-dashoffset:6;stroke-opacity:.15}
  50%{stroke-opacity:.75}
  100%{stroke-dashoffset:-6;stroke-opacity:.15}
}
@media (prefers-reduced-motion:reduce){
  .dwm-arc{display:none}
}
`}</style>
    </div>
  );
}

export default DottedWorldMapConnect;
