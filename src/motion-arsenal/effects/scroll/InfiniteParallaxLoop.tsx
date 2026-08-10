import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// InfiniteParallaxLoop — entkoppelter Endlos-Loop mit Parallax-Faktoren.
// Mehrere Ebenen (z. B. Gold-Ornamente, Punktraster, Typo) scrollen mit
// eigenen Faktoren (0.2–1.4) horizontal durch; die Position wird per modulo
// auf einen Bandbreitenbereich zurückgeführt → nahtloser Loop ohne Sprung.
// Die Fahrt läuft autark im rAF-Loop (kein Scroll-Trigger nötig) und kann
// per Richtung/Geschwindigkeit gesteuert werden. Deterministische Ebenen-
// Geometrie via seededRandom. Nur transform, kein Layout-Write.
// Reduced Motion: Ebenen stehen still (sichtbar, aber statisch).
// ---------------------------------------------------------------------------

export interface InfiniteParallaxLoopProps {
  /** Ebenen-Titel (eine Typo-Ebene pro Eintrag). */
  layers?: string[];
  /** Geschwindigkeit (0.2–3). */
  speed?: number;
  /** Richtung: 1 = vorwärts, -1 = rückwärts. */
  direction?: 1 | -1;
  /** Deterministischer Seed. */
  seed?: number;
}

interface LayerSpec {
  label: string;
  factor: number;
  hue: string;
  dots: { x: number; y: number; s: number }[];
}

const HUES = [NOX_COLORS.gold, '#2f6f8f', '#1b2a4a', '#6f4a2a'];

export function InfiniteParallaxLoop({
  layers = ['NOX', 'ARSENAL', 'MOTION', 'SYSTEM'],
  speed = 1,
  direction = 1,
  seed = 20260810,
}: InfiniteParallaxLoopProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsets = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();
  const safeSpeed = clamp(speed, 0.2, 3);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const safeLayers = layers.length > 0 ? layers.slice(0, 4) : ['NOX'];

  const specs = useMemo<LayerSpec[]>(() => {
    return safeLayers.map((label, i) => ({
      label,
      factor: 0.35 + i * 0.32 + rng() * 0.18,
      hue: HUES[i % HUES.length],
      dots: Array.from({ length: 6 + (i % 3) * 3 }, () => ({
        x: rng() * 100,
        y: rng() * 100,
        s: 2 + rng() * 6,
      })),
    }));
  }, [safeLayers, rng]);

  // Anfangs-Offsets deterministisch, Bandbreite = 50% (Loop-Periode).
  useMemo(() => {
    offsets.current = specs.map((_, i) => ((seed + i * 61) % 500) / 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs]);

  useRafLoop((dt) => {
    if (reduced) return;
    const speedPx = 26 * safeSpeed * direction;
    layerRefs.current.forEach((el, i) => {
      if (!el) return;
      offsets.current[i] = (offsets.current[i] + (dt * speedPx * specs[i].factor) / 60) % 50;
      el.style.transform = `translate3d(${offsets.current[i]}%, 0, 0)`;
    });
  }, true);

  const vars = {
    '--ipl-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="ipl-root" style={vars} aria-hidden="true">
      {specs.map((s, i) => (
        <div
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          className="ipl-layer"
          style={{ '--ipl-hue': s.hue, '--ipl-factor': s.factor } as CSSProperties}
        >
          {/* Zwei identische Bänder für den nahtlosen Loop */}
          <div className="ipl-band">
            <span>{s.label}</span>
            <span>{s.label}</span>
            <span>{s.label}</span>
          </div>
          <div className="ipl-band" aria-hidden="true">
            <span>{s.label}</span>
            <span>{s.label}</span>
            <span>{s.label}</span>
          </div>
          {s.dots.map((d, di) => (
            <i
              key={di}
              className="ipl-dot"
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.s}px`, height: `${d.s}px` }}
            />
          ))}
        </div>
      ))}
      <style>{`
.ipl-root{position:absolute;inset:0;overflow:hidden;background:#06080c}
.ipl-layer{position:absolute;left:0;right:0;top:${(12 + 18 * 0).toFixed(0)}%;
  height:18%;will-change:transform;display:flex;align-items:center;gap:0}
.ipl-layer:nth-child(2){top:34%}
.ipl-layer:nth-child(3){top:56%}
.ipl-layer:nth-child(4){top:78%}
.ipl-band{display:flex;align-items:center;flex:0 0 auto;width:200%;gap:0}
.ipl-band span{font:900 clamp(30px,6vw,64px)/1 system-ui;letter-spacing:-.03em;color:var(--ipl-hue);
  white-space:nowrap;padding-right:0.5em;opacity:.9;
  text-shadow:0 0 22px color-mix(in srgb,var(--ipl-hue) 36%,transparent)}
.ipl-dot{position:absolute;border:1px solid currentColor;opacity:.35;transform:rotate(45deg)}
@media (prefers-reduced-motion:reduce){
  .ipl-layer{transform:none !important}
}
`}</style>
    </div>
  );
}

export default InfiniteParallaxLoop;
