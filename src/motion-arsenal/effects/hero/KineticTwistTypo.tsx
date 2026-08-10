import { useMemo, useState, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// KineticTwistTypo — drehende Display-Typografie für große Marken-Statements.
// Jeder Buchstabe rotiert in einem preserve-3d-Container um die Hochachse
// (Y-Twist) mit deterministischem Delay/Offset aus seededRandom; beim Hover
// beschleunigt der Twist und eine Gold-Kante flammt auf. CSS-only nach dem
// Mount, kein rAF — Reduced Motion legt die Ruhelage an.
// ---------------------------------------------------------------------------

export interface KineticTwistTypoProps {
  /** Anzuzeigender Text (max. 14 Zeichen). */
  text?: string;
  /** Twist-Tempo (0.4–3). */
  speed?: number;
  /** Drehachse des Twists. */
  axis?: 'y' | 'x';
  /** Grundfarbe der Typografie. */
  color?: string;
  /** Gold-Kante beim Hover. */
  goldEdge?: boolean;
  /** Seed für die deterministische Phasenverteilung. */
  seed?: number;
}

export function KineticTwistTypo({
  text = 'NOX',
  speed = 1,
  axis = 'y',
  color = NOX_COLORS.gold,
  goldEdge = true,
  seed = 20260810,
}: KineticTwistTypoProps) {
  const safeText = useMemo(() => text.slice(0, 14).toUpperCase() || 'NOX', [text]);
  const safeSpeed = clamp(speed, 0.4, 3);
  const [hover, setHover] = useState(false);

  const rnd = useMemo(() => seededRandom(seed), [seed]);
  // Deterministische Phase + Delay pro Buchstabe.
  const letters = useMemo(
    () =>
      Array.from(safeText).map((ch) => ({
        ch,
        phase: Math.round(rnd() * 360),
        delay: Math.round(rnd() * 900),
      })),
    [safeText, rnd]
  );

  const vars = {
    '--ktt-speed': `${(3.6 / safeSpeed).toFixed(2)}s`,
    '--ktt-hover-speed': `${(1.4 / safeSpeed).toFixed(2)}s`,
    '--ktt-color': color,
  } as CSSProperties;

  return (
    <div
      className="ktt-root"
      style={vars}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      role="img"
      aria-label={safeText}
    >
      {letters.map((l, i) => (
        <span
          key={i}
          className={`ktt-letter${hover ? ' ktt-letter-hover' : ''}${goldEdge ? '' : ' ktt-noedge'}`}
          style={
            {
              '--ktt-i': i,
              '--ktt-phase': `${l.phase}deg`,
              '--ktt-delay': `${l.delay}ms`,
              '--ktt-axis': axis === 'y' ? 'rotateY' : 'rotateX',
            } as CSSProperties
          }
        >
          <span className="ktt-face ktt-face-front">{l.ch}</span>
          <span className="ktt-face ktt-face-back">{l.ch}</span>
        </span>
      ))}
      <style>{`
.ktt-root{position:relative;display:flex;justify-content:center;align-items:center;
  min-height:160px;gap:clamp(2px,1vw,10px);perspective:640px;user-select:none}
.ktt-letter{position:relative;display:inline-block;transform-style:preserve-3d;
  font-family:var(--nox-font-display,Georgia,serif);font-weight:800;
  font-size:clamp(56px,14vw,150px);line-height:1;letter-spacing:.04em;
  color:var(--ktt-color);text-shadow:0 0 26px color-mix(in srgb, var(--ktt-color) 42%, transparent);
  animation:kttTwist var(--ktt-speed) ease-in-out var(--ktt-delay) infinite alternate;
  transform:rotateY(var(--ktt-phase,0deg))}
.ktt-letter-hover{animation-duration:var(--ktt-hover-speed);
  filter:brightness(1.25);text-shadow:0 0 44px color-mix(in srgb, var(--ktt-color) 72%, transparent)}
.ktt-face{position:absolute;inset:0;display:grid;place-items:center;backface-visibility:hidden}
.ktt-face-back{transform:rotateY(180deg);color:#f0ece4;
  text-shadow:0 0 18px rgba(212,162,74,.55)}
.ktt-letter:not(.ktt-noedge)::after{content:"";position:absolute;left:-6%;right:-6%;top:50%;height:2px;
  background:linear-gradient(90deg,transparent,var(--ktt-color),transparent);
  opacity:.55;transform:scaleX(.2);transition:transform .5s cubic-bezier(.2,1.6,.4,1),opacity .5s}
.ktt-letter:hover::after{transform:scaleX(1);opacity:1}
@keyframes kttTwist{
  0%{transform:var(--ktt-axis)(-14deg) scale(1)}
  100%{transform:var(--ktt-axis)(14deg) scale(1.02)}
}
@media (prefers-reduced-motion:reduce){
  .ktt-letter{animation:none;transform:rotateY(0deg) rotateX(0deg)}
  .ktt-letter-hover{filter:none}
}
`}</style>
    </div>
  );
}

export default KineticTwistTypo;
