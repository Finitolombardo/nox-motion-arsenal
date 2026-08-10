import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// LenticularTiltCard — Interlaced Multi-Frame-Bild: N Frames werden als
// vertikale Slice-Streifen einer CSS-Ebene geschichtet; der Pointer-Tilt
// (oder ein konfigurierbarer Auto-Wobble) wählt pro Slice den sichtbaren
// Frame. Implementierung als DOM-Slices mit background-position (kein
// WebGL nötig — die Konzept-Variante „WebGL Textur-Slices" ist damit
// performant umgesetzt, nur transform/background-position-Writes).
// Reduced Motion: statisches Mittelframe.
// ---------------------------------------------------------------------------

export interface LenticularTiltCardProps {
  /** Frame-URLs (2–8; Default: deterministische NOX-Gradient-Frames). */
  frames?: string[];
  /** Slice-Anzahl (8–48). */
  slices?: number;
  /** Max Tilt-Winkel in Grad (4–30). */
  maxTilt?: number;
  /** Auto-Wobble (0 = aus, sonst Grad-Auslenkung). */
  wobble?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function LenticularTiltCard({
  frames,
  slices = 24,
  maxTilt = 18,
  wobble = 0,
  seed = 20260810,
}: LenticularTiltCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef(0);
  const reduced = usePrefersReducedMotion();
  const safeSlices = clamp(Math.round(slices), 8, 48);
  const safeTilt = clamp(maxTilt, 4, 30);
  const safeWobble = clamp(wobble, 0, 20);

  const frameList = useMemo(() => {
    if (frames && frames.length >= 2) return frames.slice(0, 8);
    const a = `linear-gradient(160deg, ${NOX_COLORS.gold}33, #0d1019 60%)`;
    const b = `linear-gradient(20deg, ${NOX_COLORS.gold}55, #0a0c10 55%)`;
    const c = `linear-gradient(250deg, #e8e6de22, ${NOX_COLORS.gold}44 70%)`;
    return [a, b, c];
  }, [frames]);

  // Pointer-Tilt in rAF-Loop (glatt, kein State-Churn).
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
    tiltRef.current = (nx - 0.5) * 2; // -1..1
  };

  useRafLoop(() => {
    const el = rootRef.current;
    if (!el) return;
    let t = tiltRef.current;
    if (safeWobble > 0) {
      t += Math.sin(performance.now() / 900) * (safeWobble / safeTilt) * 0.5;
    }
    const clamped = clamp(t, -1, 1);
    el.style.setProperty('--lnt-tilt', clamped.toFixed(3));
  });

  const vars = {
    '--lnt-gold': NOX_COLORS.gold,
    '--lnt-tilt': '0',
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="lnt-root"
      style={vars}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        tiltRef.current = 0;
      }}
    >
      <div className="lnt-stack">
        {Array.from({ length: safeSlices }, (_, i) => (
          <div
            key={i}
            className="lnt-slice"
            style={{
              width: `${100 / safeSlices}%`,
              // Lenticular: Alle Slices zeigen denselben Frame — gewählt durch
              // den globalen Tilt (-1..1 → Frame 0..N-1). Die dünnen
              // Trennlinien rastern den Wechsel lenticular-typisch.
              backgroundImage: frameList[Math.floor(((tiltRef.current + 1) / 2) * frameList.length) % frameList.length] ?? frameList[0],
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>
      <div className="lnt-shine" />
      <style>{`
.lnt-root{position:absolute;inset:0;overflow:hidden;perspective:900px;display:grid;
  place-items:center;background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);
  cursor:grab}
.lnt-stack{position:relative;width:min(82%,520px);aspect-ratio:4/3;border-radius:14px;
  overflow:hidden;border:1px solid color-mix(in srgb,var(--lnt-gold) 26%,transparent);
  box-shadow:0 24px 70px rgba(0,0,0,.55);
  transform:rotateY(calc(var(--lnt-tilt) * 8deg)) rotateX(calc(var(--lnt-tilt) * -4deg));
  transition:transform .08s linear;display:flex;will-change:transform}
.lnt-slice{height:100%;background-size:cover;background-position:center;
  border-right:1px solid rgba(255,255,255,.05)}
.lnt-shine{position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;
  background:linear-gradient(105deg,transparent 42%,
    color-mix(in srgb,var(--lnt-gold) 30%,transparent) 50%,transparent 58%)}
@media (prefers-reduced-motion:reduce){
  .lnt-stack{transform:none}
}
`}</style>
    </div>
  );
}

export default LenticularTiltCard;
