import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TextShakeJitter — NOX OriginKit DNA.
// Kurzes Ruetteln mit abklingender Amplitude — als Fehlerhinweis oder als
// Aufmerksamkeitsimpuls. Die Bewegung laeuft ueber translate-Keyframes und ist
// nach rund 400 ms vorbei; sie wiederholt sich nicht von selbst, weil ein
// dauerhaft zitternder Text nur nervt.
// Der Schriftzug bekommt den Gold-Verlauf ueber background-clip:text, damit die
// Farbe zur Signatur passt, ohne dass ein zweites Element noetig waere.
// ---------------------------------------------------------------------------

export interface TextShakeJitterProps {
  /** Text. */
  text?: string;
  /** Ausschlag der Bewegung. */
  intensity?: number;
  /** Dauer in Sekunden. */
  duration?: number;
  /** Was das Ruetteln ausloest. */
  trigger?: 'event' | 'hover' | 'loop';
  /** Farbe des Verlaufs. */
  color?: string;
  /** Zweite Verlaufsfarbe. */
  accentColor?: string;
  /** Schriftgroesse als CSS-Wert. */
  fontSize?: string;
}

export function TextShakeJitter({
  text = 'ZUGRIFF VERWEIGERT',
  intensity = 0.5,
  duration = 0.4,
  trigger = 'event',
  color = NOX_COLORS.gold,
  accentColor = '#f7e8a4',
  fontSize = 'clamp(1.4rem, 5vw, 3rem)',
}: TextShakeJitterProps) {
  const reduced = usePrefersReducedMotion();
  const [shaking, setShaking] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const amount = clamp(intensity, 0, 1);
  const seconds = clamp(duration, 0.2, 1);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const fire = useCallback(() => {
    if (reduced) return;
    window.clearTimeout(timer.current);
    // Klasse kurz abwerfen, damit dieselbe Animation erneut startet.
    setShaking(false);
    window.requestAnimationFrame(() => {
      setShaking(true);
      timer.current = window.setTimeout(() => setShaking(false), seconds * 1000);
    });
  }, [reduced, seconds]);

  const style = {
    '--tsj-color': color,
    '--tsj-accent': accentColor,
    '--tsj-size': fontSize,
    '--tsj-amp': `${(amount * 9).toFixed(2)}px`,
    '--tsj-dur': `${seconds.toFixed(2)}s`,
  } as React.CSSProperties;

  const active = trigger === 'loop' ? !reduced : shaking;

  return (
    <div className="nox-tsj" style={style}>
      <style>{CSS}</style>
      <span
        className={`nox-tsj__text${active ? ' is-shaking' : ''}${trigger === 'hover' ? ' on-hover' : ''}${trigger === 'loop' ? ' is-loop' : ''}`}
        onMouseEnter={trigger === 'hover' ? fire : undefined}
      >
        {text}
      </span>
      {trigger === 'event' && (
        <button type="button" className="nox-tsj__button" onClick={fire}>
          Ausloesen
        </button>
      )}
    </div>
  );
}

const CSS = String.raw`
.nox-tsj { display:grid; place-content:center; justify-items:center; gap:20px; width:100%; height:100%; padding:clamp(16px,4vw,36px); font-family:var(--sans,system-ui,sans-serif); }
.nox-tsj__text { display:inline-block; font-size:var(--tsj-size); font-weight:800; letter-spacing:-.02em; text-align:center; background:linear-gradient(100deg, var(--tsj-color), var(--tsj-accent) 48%, var(--tsj-color)); -webkit-background-clip:text; background-clip:text; color:transparent; }
/* Abklingende Amplitude: der letzte Ausschlag ist ein Bruchteil des ersten. */
.nox-tsj__text.is-shaking { animation:nox-tsj-shake var(--tsj-dur) cubic-bezier(.36,.07,.19,.97) both; }
.nox-tsj__text.is-loop { animation-iteration-count:infinite; }
@keyframes nox-tsj-shake {
  0%   { transform:translate3d(0,0,0); }
  12%  { transform:translate3d(calc(var(--tsj-amp) * -1), 0, 0); }
  25%  { transform:translate3d(var(--tsj-amp), 0, 0); }
  38%  { transform:translate3d(calc(var(--tsj-amp) * -.68), 0, 0); }
  50%  { transform:translate3d(calc(var(--tsj-amp) * .58), 0, 0); }
  63%  { transform:translate3d(calc(var(--tsj-amp) * -.36), 0, 0); }
  75%  { transform:translate3d(calc(var(--tsj-amp) * .24), 0, 0); }
  88%  { transform:translate3d(calc(var(--tsj-amp) * -.1), 0, 0); }
  100% { transform:translate3d(0,0,0); }
}
.nox-tsj__button { padding:9px 20px; border-radius:999px; border:1px solid color-mix(in srgb, var(--tsj-color) 42%, transparent); background:color-mix(in srgb, var(--tsj-color) 11%, transparent); color:#f2ecd9; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
.nox-tsj__button:focus-visible { outline:2px solid var(--tsj-color); outline-offset:3px; }
@media (prefers-reduced-motion:reduce) {
  .nox-tsj__text.is-shaking, .nox-tsj__text.is-loop { animation:none; }
}
`;

export default TextShakeJitter;
