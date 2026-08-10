import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, damp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ElasticLagGrid — gestaffeltes Grid folgt der Scrolltiefe mit elastischem Lag.
// Jede Zelle trägt einen deterministischen Stagger-Faktor; ein transform-only
// rAF-Loop damped die Ziel-Verschiebung (aus scrollProgress) pro Zelle in den
// aktuellen Offset — nahe Zellen reagieren schnell, ferne schleppen nach.
// Kein Math.random: Layout und Stagger kommen aus seededRandom.
// ---------------------------------------------------------------------------

export interface ElasticLagGridProps {
  /** Anzahl Spalten (2–6). */
  cols?: number;
  /** Anzahl Zeilen (2–5). */
  rows?: number;
  /** Nachlauf-Faktor (0 = starr, 1 = stark gedehnt). */
  lag?: number;
  /** Maximale Verschiebung in px (20–200). */
  strength?: number;
  /** Zellen-Label-Präfix. */
  prefix?: string;
  /** Akzentfarbe der Zellen-Kanten. */
  color?: string;
  /** Seed für das deterministische Layout. */
  seed?: number;
}

export function ElasticLagGrid({
  cols = 4,
  rows = 3,
  lag = 0.38,
  strength = 90,
  prefix = '0',
  color = NOX_COLORS.gold,
  seed = 20260810,
}: ElasticLagGridProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  const safeCols = clamp(Math.round(cols), 2, 6);
  const safeRows = clamp(Math.round(rows), 2, 5);
  const safeLag = clamp(lag, 0.05, 0.95);
  const safeStrength = clamp(strength, 20, 200);
  const count = safeCols * safeRows;

  const progressRef = useScrollProgress(rootRef);
  const rnd = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Zellen: Stagger (0..1) + Winkel für die Ablenkrichtung.
  const cells = useMemo(() => {
    const list: { stagger: number; angle: number }[] = [];
    for (let i = 0; i < count; i++) {
      const stagger = 0.15 + rnd() * 0.85;
      const angle = rnd() * Math.PI * 2;
      list.push({ stagger, angle });
    }
    return list;
  }, [count, rnd]);

  // Scroll-Tiefe -> Ziel-Offset pro Zelle, damped im rAF-Loop.
  const offsets = useRef<{ x: number; y: number }[]>(
    Array.from({ length: count }, () => ({ x: 0, y: 0 }))
  );

  useRafLoop((_dt) => {
    const progress = progressRef.current;
    const targets = offsets.current;
    for (let i = 0; i < count; i++) {
      const cell = cells[i];
      if (!cell) continue;
      const el = cellRefs.current[i];
      if (!el) continue;
      const targetX = Math.cos(cell.angle) * safeStrength * progress * cell.stagger;
      const targetY = Math.sin(cell.angle) * safeStrength * progress * cell.stagger;
      const k = reduced ? 1 : clamp(safeLag + (1 - cell.stagger) * 0.4, 0.05, 0.95);
      targets[i].x = damp(targets[i].x, targetX, k, 0.016);
      targets[i].y = damp(targets[i].y, targetY, k, 0.016);
      el.style.transform = `translate3d(${targets[i].x.toFixed(2)}px, ${targets[i].y.toFixed(2)}px, 0)`;
    }
  }, true);

  const vars = {
    '--elg-color': color,
    '--elg-gap': `${Math.round(10 + safeCols * 1.5)}px`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="elg-root"
      style={{
        ...vars,
        gridTemplateColumns: `repeat(${safeCols}, 1fr)`,
        gridTemplateRows: `repeat(${safeRows}, 1fr)`,
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          ref={(el) => {
            cellRefs.current[i] = el;
          }}
          className="elg-cell"
          style={{ '--elg-i': i } as CSSProperties}
        >
          <span className="elg-num">{prefix}{String(i + 1).padStart(2, '0')}</span>
          <span className="elg-tag" style={{ opacity: 0.35 + c.stagger * 0.5 }}>
            LAG {Math.round(c.stagger * 100)}%
          </span>
        </div>
      ))}
      <style>{`
.elg-root{position:relative;width:100%;height:100%;min-height:280px;display:grid;
  gap:var(--elg-gap);contain:layout paint;perspective:900px}
.elg-cell{position:relative;border-radius:12px;border:1px solid
  color-mix(in srgb, var(--elg-color) 34%, transparent);
  background:linear-gradient(150deg,rgba(212,162,74,.07),rgba(10,10,11,.4) 55%);
  box-shadow:inset 0 0 22px rgba(0,0,0,.45);
  display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;
  padding:14px;will-change:transform;overflow:hidden}
.elg-cell::after{content:"";position:absolute;right:-30%;top:-30%;width:70%;height:70%;
  border-radius:50%;background:radial-gradient(circle at 40% 40%,
  color-mix(in srgb, var(--elg-color) 26%, transparent),transparent 70%);
  pointer-events:none}
.elg-num{font-family:var(--nox-font-mono,"Courier New",monospace);font-size:clamp(20px,4vw,34px);
  font-weight:700;color:#f0ece4;letter-spacing:.04em}
.elg-tag{font-family:var(--nox-font-mono,"Courier New",monospace);font-size:10px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--elg-color)}
@media (prefers-reduced-motion:reduce){
  .elg-cell{transition:none}
}
`}</style>
    </div>
  );
}

export default ElasticLagGrid;
