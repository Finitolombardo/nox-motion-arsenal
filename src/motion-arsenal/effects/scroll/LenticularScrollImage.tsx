import { useRef, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// LenticularScrollImage — Scroll-synchroner Interlace-Wechsel durch vorbe-
// reitete Bildframes: Ein Sprite-Strip (mehrere Frames nebeneinander) wird
// per background-position-x entlang der Scrolltiefe abgefahren. Der Sprite
// wird aus einem Basis-Bild + NOX-Gold-Farbvarianten erzeugt (kein externer
// Asset-Input nötig). Deterministische Frame-Zahl und -Reihenfolge.
// Reduced Motion: erstes Frame statisch.
// ---------------------------------------------------------------------------

export interface LenticularScrollImageProps {
  /** Basis-Bild-URL (optional — sonst deterministischer NOX-Verlauf). */
  src?: string;
  /** Anzahl der Interlace-Frames (3–12). */
  frames?: number;
  /** Scroll-Richtung des Sprite-Ablaufs. */
  reverse?: boolean;
  /** Deterministischer Seed für die Farbvarianten. */
  seed?: number;
}

export function LenticularScrollImage({
  src,
  frames = 6,
  reverse = false,
  seed = 20260810,
}: LenticularScrollImageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const safeFrames = clamp(Math.round(frames), 3, 12);

  const progressRef = useScrollProgress(rootRef);

  // Farbvarianten für die Frame-Looks: deterministische Gold-/Blau-/Dunkel-
  // Verläufe (wenn kein Bild übergeben wird).
  const looks = Array.from({ length: safeFrames }, (_, i) => {
    const h = (seed + i * 47) % 360;
    return {
      from: `hsl(${h} 42% 32%)`,
      to: `hsl(${(h + 40) % 360} 55% 12%)`,
    };
  });

  useRafLoop((_dt) => {
    if (reduced) return;
    const el = stripRef.current;
    if (!el) return;
    const p = progressRef.current;
    const frame = Math.min(safeFrames - 1, Math.max(0, Math.floor(p * safeFrames)));
    const x = reverse ? frame * 100 : -frame * 100;
    el.style.backgroundPositionX = `${x}%`;
  }, true);

  const vars = {
    '--lsi-gold': NOX_COLORS.gold,
    '--lsi-frames': `${safeFrames}`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="lsi-root" style={vars} aria-hidden="true">
      <div
        ref={stripRef}
        className="lsi-strip"
        style={
          src
            ? { backgroundImage: `url(${src})` }
            : undefined
        }
      >
        {!src &&
          looks.map((l, i) => (
            <div
              key={i}
              className="lsi-frame"
              style={{ background: `linear-gradient(140deg, ${l.from} 0%, ${l.to} 100%)` }}
            />
          ))}
      </div>
      <div className="lsi-grain" />
      <div className="lsi-hud">
        <span>INTERLACE</span>
        <i>{safeFrames} FRAMES</i>
      </div>
      <style>{`
.lsi-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:#07090d}
.lsi-strip{width:min(420px,70%);aspect-ratio:4/3;background-size:100% 100%;
  background-repeat:repeat-x;background-position-x:0;
  display:flex;will-change:background-position-x;
  border:1px solid color-mix(in srgb,var(--lsi-gold) 30%,transparent);
  box-shadow:0 24px 60px #0009}
.lsi-frame{flex:0 0 100%;height:100%}
.lsi-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")}
.lsi-hud{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
  display:flex;gap:14px;font:10px ui-monospace,monospace;letter-spacing:.2em;
  color:var(--lsi-gold);background:#0b0d12cc;padding:6px 12px;border:1px solid
  color-mix(in srgb,var(--lsi-gold) 40%,transparent)}
@media (prefers-reduced-motion:reduce){
  .lsi-strip{background-position-x:0 !important}
}
`}</style>
    </div>
  );
}

export default LenticularScrollImage;
