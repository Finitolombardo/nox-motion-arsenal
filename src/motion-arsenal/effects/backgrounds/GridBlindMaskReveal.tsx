import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GridBlindMaskReveal — gestaffelte Grid-Maske legt die neue Ebene frei.
// Die Vorder-Ebene liegt über der Rück-Ebene; eine SVG-<mask> aus Grid-
// Rechtecken blendet sie zellenweise aus. Jede Zelle hat einen determini-
// stischen Stagger (seededRandom → Schwelle) und blendet zwischen ihrer
// Schwelle und Schwelle+Spanne aus. Der Reveal-Progress kommt aus
// useScrollProgress (Scroll) oder einem Auto-Toggle. Steuerung im rAF-Loop
// per fill-opacity — kein Layout-Write, keine Timeline-API-Abhängigkeit.
// Reduced Motion: Vorder-Ebene vollständig aufgedeckt (Inhalt lesbar).
// ---------------------------------------------------------------------------

export interface GridBlindMaskRevealProps {
  /** Titel der Vorder-Ebene (wird freigelegt). */
  frontLabel?: string;
  /** Titel der Rück-Ebene (kommt zum Vorschein). */
  backLabel?: string;
  /** Grid-Dichte: Zellen pro Achse (2–8). */
  cellsPerAxis?: number;
  /** Reveal-Steuerung: Scroll (useScrollProgress) oder Auto (Toggle-Button). */
  mode?: 'scroll' | 'auto';
  /** Deterministischer Stagger-Seed. */
  seed?: number;
}

interface CellSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  to: number;
}

export function GridBlindMaskReveal({
  frontLabel = 'NOX',
  backLabel = 'ARSENAL',
  cellsPerAxis = 4,
  mode = 'scroll',
  seed = 20260810,
}: GridBlindMaskRevealProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(SVGRectElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();
  const safeCells = clamp(Math.round(cellsPerAxis), 2, 8);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Stagger-Schwellen: jede Zelle bekommt eine Schwelle
  // 0..1 aus dem Seed; nach Schwelle sortiert → räumlich gestreute Welle.
  const cells = useMemo<CellSpec[]>(() => {
    const span = 1 / (safeCells * safeCells);
    return Array.from({ length: safeCells * safeCells }, (_, i) => {
      const x = i % safeCells;
      const y = Math.floor(i / safeCells);
      const t = rng();
      return {
        x,
        y,
        w: 100 / safeCells,
        h: 100 / safeCells,
        from: t,
        to: Math.min(1, t + span * 1.1),
      };
    }).sort((a, b) => a.from - b.from);
  }, [safeCells, rng]);

  const progressRef = useScrollProgress(rootRef);
  const autoRef = useRef({ p: 0, dir: 1, playing: true });

  // Sanfte Schwelle: 0 unter from, 1 über to, dazwischen glatte Rampe.
  const step = (p: number, from: number, to: number) => {
    if (p <= from) return 1;
    if (p >= to) return 0;
    const t = (p - from) / (to - from);
    return 1 - t * t * (3 - 2 * t); // smoothstep invertiert
  };

  useRafLoop((dt) => {
    if (reduced) return;
    let p = progressRef.current;
    if (mode === 'auto') {
      const a = autoRef.current;
      if (a.playing) {
        a.p += a.dir * dt * 0.25;
        if (a.p >= 1) { a.p = 1; a.dir = -1; }
        if (a.p <= 0) { a.p = 0; a.dir = 1; }
      }
      p = a.p;
    }
    cellRefs.current.forEach((el, i) => {
      if (!el) return;
      el.setAttribute('fill-opacity', String(step(p, cells[i].from, cells[i].to)));
    });
  }, true);

  const vars = {
    '--gbm-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="gbm-root" style={vars}>
      <div className="gbm-layer gbm-layer--back">{backLabel}</div>
      <div className="gbm-layer gbm-layer--front">
        {frontLabel}
        <svg className="gbm-mask" aria-hidden="true">
          <defs>
            <mask id="gbm-grid-mask" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
              {cells.map((c, i) => (
                <rect
                  key={i}
                  ref={(el) => {
                    cellRefs.current[i] = el;
                  }}
                  x={`${(c.x / safeCells) * 100}%`}
                  y={`${(c.y / safeCells) * 100}%`}
                  width={`${c.w}%`}
                  height={`${c.h}%`}
                  fill="#000"
                  fillOpacity={1}
                />
              ))}
            </mask>
          </defs>
        </svg>
      </div>
      {mode === 'auto' && (
        <button
          type="button"
          className="gbm-toggle"
          onClick={() => {
            autoRef.current.playing = !autoRef.current.playing;
          }}
        >
          {autoRef.current.playing ? 'PAUSE' : 'PLAY'}
        </button>
      )}
      <style>{`
.gbm-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:linear-gradient(150deg,#080a10,#10131f 60%,#080a10);color:var(--gbm-gold)}
.gbm-layer{position:absolute;inset:0;display:grid;place-items:center;
  font:900 clamp(44px,11vw,120px)/1 system-ui;letter-spacing:-.04em}
.gbm-layer--back{color:#f4eee4;opacity:.9}
.gbm-layer--front{color:var(--gbm-gold);text-shadow:0 0 30px color-mix(in srgb,var(--gbm-gold) 40%,transparent)}
.gbm-mask{position:absolute;inset:0;width:100%;height:100%}
.gbm-toggle{position:absolute;bottom:18px;right:18px;z-index:5;border:1px solid
  color-mix(in srgb,var(--gbm-gold) 60%,transparent);background:#0b0d12cc;color:var(--gbm-gold);
  font:10px ui-monospace,monospace;letter-spacing:.16em;padding:8px 14px;cursor:pointer}
.gbm-toggle:hover{border-color:var(--gbm-gold)}
@media (prefers-reduced-motion:reduce){
  .gbm-layer--front{color:var(--gbm-gold)}
  .gbm-mask{display:none}
  .gbm-toggle{display:none}
}
`}</style>
    </div>
  );
}

export default GridBlindMaskReveal;
