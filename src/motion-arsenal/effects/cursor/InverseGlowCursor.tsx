import { useEffect, useRef, type CSSProperties } from 'react';
import { clamp, damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// InverseGlowCursor — invertierter Cursor-Spot mit nachziehendem Akzent-Ring.
// Der Spot liegt mit mix-blend-mode: difference über der Fläche und invertiert
// damit den Untergrund; ein goldener Ring folgt mit elastischem Lag (damp).
// Transform-only im rAF-Loop, keine Layout-Änderungen pro Frame, keine
// unseeded Zufallswerte. Reduced Motion: Spot wird statisch an der letzten
// Position gehalten, der Ring folgt ohne Nachlauf.
// ---------------------------------------------------------------------------

export interface InverseGlowCursorProps {
  /** Durchmesser des invertierenden Spots in px (40–160). */
  size?: number;
  /** Durchmesser des Akzent-Rings in px (60–240). */
  ringSize?: number;
  /** Nachlauf-Faktor des Rings (0 = starr, 1 = träge). */
  lag?: number;
  /** Mischmodus des Spots. */
  blend?: 'difference' | 'screen' | 'overlay';
  /** Ring-Farbe. */
  color?: string;
  /** Sichtbarkeit des Akzent-Rings. */
  showRing?: boolean;
}

export function InverseGlowCursor({
  size = 96,
  ringSize = 150,
  lag = 0.14,
  blend = 'difference',
  color = NOX_COLORS.gold,
  showRing = true,
}: InverseGlowCursorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const safeSize = clamp(size, 40, 160);
  const safeRing = clamp(ringSize, 60, 240);
  const safeLag = clamp(lag, 0.02, 0.9);

  const pointer = usePointer(rootRef);

  // Container-Größe cachen (einmal messen, bei Resize via Observer) —
  // normalisierte Pointer-Koordinaten (0..1) werden im Loop zu Pixeln.
  const sizeRef = useRef({ w: 1, h: 1 });
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      sizeRef.current = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ring-Position mit damp nachziehen (elastischer Lag). Bei Reduced Motion
  // folgt der Ring starr — der Nachlauf entfällt.
  const ring = useRef({ x: -400, y: -400 });
  useRafLoop((_dt) => {
    const spot = spotRef.current;
    const ringEl = ringRef.current;
    if (!spot || !ringEl) return;
    const p = pointer.current;
    const px = p.x * sizeRef.current.w;
    const py = p.y * sizeRef.current.h;
    const target = ring.current;
    target.x = damp(target.x, px, reduced ? 1 : safeLag, 0.016);
    target.y = damp(target.y, py, reduced ? 1 : safeLag, 0.016);
    spot.style.transform = `translate3d(${px - safeSize / 2}px, ${py - safeSize / 2}px, 0)`;
    ringEl.style.transform = `translate3d(${target.x - safeRing / 2}px, ${target.y - safeRing / 2}px, 0)`;
  }, true);

  const vars = {
    '--igc-size': `${safeSize}px`,
    '--igc-ring': `${safeRing}px`,
    '--igc-color': color,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="igc-root"
      style={vars}
      aria-hidden="true"
    >
      <div ref={spotRef} className="igc-spot" style={{ mixBlendMode: blend }} />
      {showRing && <div ref={ringRef} className="igc-ring" />}
      <style>{`
.igc-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;isolation:isolate}
.igc-spot{position:absolute;left:0;top:0;width:var(--igc-size);height:var(--igc-size);
  border-radius:50%;background:#fff;box-shadow:0 0 0 9999px #fff;opacity:.92;
  will-change:transform}
.igc-ring{position:absolute;left:0;top:0;width:var(--igc-ring);height:var(--igc-ring);
  border-radius:50%;border:1.5px solid color-mix(in srgb, var(--igc-color) 82%, transparent);
  box-shadow:0 0 18px color-mix(in srgb, var(--igc-color) 38%, transparent),
    inset 0 0 14px color-mix(in srgb, var(--igc-color) 22%, transparent);
  will-change:transform}
@media (prefers-reduced-motion:reduce){
  .igc-ring{transition:transform .3s linear}
}
@media (pointer:coarse){
  .igc-root{display:none}
}
`}</style>
    </div>
  );
}

export default InverseGlowCursor;
