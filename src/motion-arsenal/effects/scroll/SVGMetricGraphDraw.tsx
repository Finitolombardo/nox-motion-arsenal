import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SVGMetricGraphDraw — eine Kennzahlenkurve zeichnet sich beim Scrollen.
// Deterministische Messreihe (seededRandom) wird als SVG-Polyline mit
// stroke-dasharray/-dashoffset gezeichnet; der Scroll-Progress steuert den
// Offset im rAF-Loop (transform/attr-only, kein Layout-Write). Zusätzlich
// wandert ein Punkt entlang der Kurve und ein HUD zeigt den aktuellen Wert.
// Reduced Motion: volle Kurve sofort sichtbar.
// ---------------------------------------------------------------------------

export interface SVGMetricGraphDrawProps {
  /** Kurvenpunkte (8–48). */
  points?: number;
  /** Titel der Metrik. */
  label?: string;
  /** Einheit für den HUD-Wert. */
  unit?: string;
  /** Deterministischer Seed. */
  seed?: number;
}

export function SVGMetricGraphDraw({
  points = 32,
  label = 'SIGNAL INTENSITY',
  unit = '%',
  seed = 20260810,
}: SVGMetricGraphDrawProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const dotRef = useRef<SVGCircleElement | null>(null);
  const valueRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const safePoints = clamp(Math.round(points), 8, 48);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Messreihe: glatte Kurve aus 2 Sinus-Harmonischen + Rauschen.
  const series = useMemo(() => {
    const W = 600;
    const H = 220;
    const f1 = 1.6 + rng() * 1.2;
    const f2 = 3.1 + rng() * 2.2;
    const pts = Array.from({ length: safePoints }, (_, i) => {
      const t = i / (safePoints - 1);
      const v = 0.5 + 0.32 * Math.sin(t * Math.PI * 2 * f1 + seed) + 0.16 * Math.sin(t * Math.PI * 2 * f2) + (rng() - 0.5) * 0.08;
      return { x: t * W, y: H - clamp(v, 0, 1) * H };
    });
    return { W, H, pts };
  }, [safePoints, rng, seed]);

  const d = useMemo(() => {
    return series.pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }, [series]);

  const progressRef = useScrollProgress(rootRef);

  useRafLoop((_dt) => {
    if (reduced) return;
    const p = progressRef.current;
    const path = pathRef.current;
    if (path) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = String(len * (1 - p));
    }
    // Wandernder Punkt: Position entlang der Kurve interpolieren.
    if (dotRef.current && series.pts.length > 1) {
      const f = p * (series.pts.length - 1);
      const i = Math.min(series.pts.length - 2, Math.floor(f));
      const t = f - i;
      const a = series.pts[i];
      const b = series.pts[i + 1];
      dotRef.current.setAttribute('cx', (a.x + (b.x - a.x) * t).toFixed(1));
      dotRef.current.setAttribute('cy', (a.y + (b.y - a.y) * t).toFixed(1));
    }
    if (valueRef.current) {
      valueRef.current.textContent = `${Math.round(p * 100)}${unit}`;
    }
  }, true);

  const vars = {
    '--smg-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="smg-root" style={vars}>
      <div className="smg-hud">
        <span>{label}</span>
        <b>
          <span ref={valueRef}>0{unit}</span>
        </b>
      </div>
      <svg className="smg-svg" viewBox={`0 0 ${series.W} ${series.H}`} aria-hidden="true">
        <defs>
          <linearGradient id="smg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--smg-gold)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--smg-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" y1={series.H * g} x2={series.W} y2={series.H * g} stroke="#ffffff12" strokeWidth="1" />
        ))}
        <path d={`${d} L${series.W},${series.H} L0,${series.H} Z`} fill="url(#smg-grad)" opacity="0.5" />
        <path ref={pathRef} d={d} fill="none" stroke="var(--smg-gold)" strokeWidth="2.5" strokeLinecap="round" />
        <circle ref={dotRef} r="5" fill="var(--smg-gold)" style={{ filter: 'drop-shadow(0 0 6px var(--smg-gold))' }} />
      </svg>
      <style>{`
.smg-root{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;
  gap:18px;padding:8% 10%;background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.smg-hud{display:flex;justify-content:space-between;align-items:baseline;
  font:11px ui-monospace,monospace;letter-spacing:.22em;color:var(--smg-gold)}
.smg-hud b{font:700 clamp(26px,4vw,44px) ui-monospace,monospace;letter-spacing:.02em}
.smg-svg{width:100%;height:auto;max-height:60%;overflow:visible}
.smg-svg path{will-change:stroke-dashoffset}
@media (prefers-reduced-motion:reduce){
  .smg-svg path{stroke-dasharray:none !important;stroke-dashoffset:0 !important}
  .smg-svg circle{display:none}
}
`}</style>
    </div>
  );
}

export default SVGMetricGraphDraw;
