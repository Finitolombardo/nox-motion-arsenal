import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SplitSlicedTextDecomposition — Headline zerfällt in horizontalen Slices,
// die sich beim Hover/Trigger gestaffelt wegbewegen (deterministischer
// Stagger, seededRandom). Jeder Slice ist ein kleines absolut positioniertes
// Stück des Texts (gleiche Breite, eigener Clip) — beim "Decompose" fahren
// die Slices auseinander (translateX/Y + rotate), beim Loslassen zurück.
// Nur transform/opacity im rAF-Loop, kein Layout-Write.
// Reduced Motion: Text bleibt ganz.
// ---------------------------------------------------------------------------

export interface SplitSlicedTextDecompositionProps {
  /** Text. */
  text?: string;
  /** Anzahl der Slices (4–16). */
  slices?: number;
  /** Streu-Radius beim Zerfall in em (1–8). */
  spread?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function SplitSlicedTextDecomposition({
  text = 'DECOMPOSE',
  slices = 10,
  spread = 4,
  seed = 20260810,
}: SplitSlicedTextDecompositionProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sliceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef({ active: false });
  const reduced = usePrefersReducedMotion();
  const safeSlices = clamp(Math.round(slices), 4, 16);
  const safeSpread = clamp(spread, 1, 8);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Zerfall-Vektoren pro Slice (Richtung + Rotation).
  const vecs = useMemo(() => {
    return Array.from({ length: safeSlices }, () => ({
      x: (rng() - 0.5) * 2 * safeSpread,
      y: (rng() - 0.5) * 2 * safeSpread * 0.6,
      rot: (rng() - 0.5) * 26,
      delay: rng() * 0.35,
    }));
  }, [safeSlices, rng, safeSpread]);

  useRafLoop((t) => {
    if (reduced) return;
    const active = stateRef.current.active;
    const now = t / 1000;
    sliceRefs.current.forEach((el, i) => {
      if (!el) return;
      const v = vecs[i];
      const local = Math.max(0, now - v.delay);
      const ease = active
        ? Math.min(1, local * 3.2)
        : Math.max(0, 1 - local * 3.2);
      const e = ease * ease * (3 - 2 * ease); // smoothstep
      el.style.transform = `translate3d(${v.x * e}em, ${v.y * e}em, 0) rotate(${v.rot * e}deg)`;
      el.style.opacity = String(1 - e * 0.35);
    });
  }, true);

  const vars = {
    '--sst-gold': NOX_COLORS.gold,
    '--sst-width': `${100 / safeSlices}%`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="sst-root"
      style={vars}
      onPointerEnter={() => {
        stateRef.current.active = true;
      }}
      onPointerLeave={() => {
        stateRef.current.active = false;
      }}
    >
      <div className="sst-text">
        {Array.from({ length: safeSlices }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              sliceRefs.current[i] = el;
            }}
            className="sst-slice"
            style={{ '--sst-i': i } as CSSProperties}
          >
            {text}
          </div>
        ))}
      </div>
      <p className="sst-hint">HOVER TO DECOMPOSE</p>
      <style>{`
.sst-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);cursor:pointer}
.sst-text{position:relative;font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.02em;
  color:var(--sst-gold);text-shadow:0 0 28px color-mix(in srgb,var(--sst-gold) 38%,transparent);
  white-space:nowrap;user-select:none}
.sst-slice{position:absolute;left:0;top:0;width:var(--sst-width);overflow:hidden;
  text-align:center;will-change:transform,opacity;
  -webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 1px),transparent calc(100% - 1px));
  mask-image:linear-gradient(90deg,#000 calc(100% - 1px),transparent calc(100% - 1px))}
.sst-hint{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@media (prefers-reduced-motion:reduce){
  .sst-slice{transform:none !important;opacity:1 !important}
  .sst-hint{display:none}
}
`}</style>
    </div>
  );
}

export default SplitSlicedTextDecomposition;
