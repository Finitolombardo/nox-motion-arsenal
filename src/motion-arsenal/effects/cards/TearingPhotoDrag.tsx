import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TearingPhotoDrag — Interaktives Foto, das beim Ziehen wie Papier reißt:
// Das Bild wird in horizontale Streifen zerlegt; beim Drag verschieben sich
// die Streifen gestaffelt (deterministischer Riss-Versatz aus dem Seed),
// beim Loslassen schnappen sie federnd zurück. Pointer-Mapping über
// getBoundingClientRect (einmal pro Event), im rAF-Loop nur transform-
// Writes. Reduzierte Bewegung: Bild folgt starr ohne Riss.
// ---------------------------------------------------------------------------

export interface TearingPhotoDragProps {
  /** Bild-URL (falls leer, wird ein deterministisches NOX-Gradient-Bild gerendert). */
  src?: string;
  /** Anzahl der Riss-Streifen (6–24). */
  strips?: number;
  /** Riss-Intensität in px (2–40). */
  tear?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function TearingPhotoDrag({
  src,
  strips = 12,
  tear = 14,
  seed = 20260810,
}: TearingPhotoDragProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef({ dragging: false, x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const reduced = usePrefersReducedMotion();
  const safeStrips = clamp(Math.round(strips), 6, 24);
  const safeTear = clamp(tear, 2, 40);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  // Deterministische Riss-Vektoren pro Streifen (nur X-Achse, Richtung + Stärke).
  const tears = useMemo(() => {
    return Array.from({ length: safeStrips }, () => ({
      dir: rng() > 0.5 ? 1 : -1,
      mag: 0.4 + rng() * 0.6,
      delay: rng() * 0.08,
    }));
  }, [safeStrips, rng]);

  useRafLoop(() => {
    const s = stateRef.current;
    const dragX = s.dragging ? s.x - s.offsetX : 0;
    const dragY = s.dragging ? s.y - s.offsetY : 0;
    stripRefs.current.forEach((el, i) => {
      if (!el) return;
      const tv = tears[i];
      const tearX = s.dragging ? tv.dir * tv.mag * safeTear : 0;
      // Federnder Rückzug beim Loslassen (ease per Frame).
      const cur = el.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
      const curX = cur ? parseFloat(cur[1]) : 0;
      const curY = cur ? parseFloat(cur[2]) : 0;
      const targetX = dragX + tearX;
      const targetY = dragY;
      const nx = curX + (targetX - curX) * 0.22;
      const ny = curY + (targetY - curY) * 0.22;
      el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    });
  }, true);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    stateRef.current.dragging = true;
    stateRef.current.offsetX = e.clientX - rect.left;
    stateRef.current.offsetY = e.clientY - rect.top;
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stateRef.current.dragging) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    stateRef.current.x = e.clientX - rect.left;
    stateRef.current.y = e.clientY - rect.top;
  };
  const onUp = () => {
    stateRef.current.dragging = false;
  };

  const vars = {
    '--tp-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="tp-root"
      style={vars}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="tp-frame">
        {Array.from({ length: safeStrips }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              stripRefs.current[i] = el;
            }}
            className="tp-strip"
            style={{
              backgroundImage: src ? `url("${src}")` : undefined,
              backgroundPosition: `50% ${(i / safeStrips) * 100}%`,
              backgroundSize: 'cover',
              height: `${100 / safeStrips}%`,
              ...(!src
                ? {
                    background:
                      `linear-gradient(180deg, ${NOX_COLORS.gold}, #0a0c10 ${(i / safeStrips) * 100}%)`,
                  }
                : {}),
            }}
          />
        ))}
      </div>
      <p className="tp-hint">DRAG TO TEAR</p>
      <style>{`
.tp-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);cursor:grab;touch-action:none}
.tp-root:active{cursor:grabbing}
.tp-frame{position:relative;width:min(62%,420px);aspect-ratio:3/4;overflow:hidden;
  border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.5);
  border:1px solid color-mix(in srgb,var(--tp-gold) 18%,transparent)}
.tp-strip{position:absolute;left:0;top:0;width:100%;will-change:transform;
  border-bottom:1px solid rgba(0,0,0,.35)}
.tp-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@media (prefers-reduced-motion:reduce){
  .tp-strip{transition:none}
  .tp-hint{display:none}
}
`}</style>
    </div>
  );
}

export default TearingPhotoDrag;
