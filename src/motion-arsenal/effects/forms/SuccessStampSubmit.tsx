import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SuccessStampSubmit — NOX Forms DNA.
// Absenden endet mit einem Stempel: das Badge faehrt gross und leicht gedreht
// ein und rastet mit Feder-Overshoot ein, Funken fliegen radial weg. Richtung
// und Verzoegerung der Funken stammen aus einem seeded PRNG, damit derselbe
// Abschluss immer gleich aussieht.
// Der Zustandswechsel wird in einer aria-live-Region angesagt — eine
// Bestaetigung, die nur visuell existiert, ist fuer einen Teil der Nutzer
// keine Bestaetigung.
// ---------------------------------------------------------------------------

export interface SuccessStampSubmitProps {
  /** Aufschrift des Stempels. */
  text?: string;
  /** Beschriftung des Buttons. */
  buttonLabel?: string;
  /** Menge der Funken. */
  intensity?: number;
  /** Farbe von Stempel und Funken. */
  color?: string;
  /** Drehung des Stempels in Grad. */
  rotation?: number;
  /** Wartezeit bis zum Stempel in Millisekunden. */
  delay?: number;
  /** Seed fuer die Funkenrichtung. */
  seed?: number;
}

function det(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function SuccessStampSubmit({
  text = 'APPROVED',
  buttonLabel = 'Antrag absenden',
  intensity = 0.6,
  color = NOX_COLORS.gold,
  rotation = -8,
  delay = 620,
  seed = 5,
}: SuccessStampSubmitProps) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle');
  const timer = useRef<number | undefined>(undefined);

  const sparkCount = Math.round(clamp(intensity, 0, 1) * 12);

  const sparks = useMemo(
    () =>
      Array.from({ length: sparkCount }, (_, i) => ({
        angle: (i / Math.max(sparkCount, 1)) * 360 + det(i, seed) * 24,
        distance: 52 + det(i, seed + 17) * 46,
        delay: det(i, seed + 41) * 0.12,
        size: 3 + det(i, seed + 63) * 3,
      })),
    [sparkCount, seed],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = useCallback(() => {
    if (state !== 'idle') return;
    setState('pending');
    timer.current = window.setTimeout(() => setState('done'), clamp(delay, 0, 3000));
  }, [state, delay]);

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    setState('idle');
  }, []);

  const style = {
    '--sss-color': color,
    '--sss-rot': `${clamp(rotation, -30, 30)}deg`,
    '--sss-dur': reduced ? '0s' : '.62s',
  } as React.CSSProperties;

  return (
    <div className={`nox-sss is-${state}`} style={style}>
      <style>{CSS}</style>

      <div className="nox-sss__sheet">
        <div className="nox-sss__rows" aria-hidden="true">
          <span style={{ width: '68%' }} />
          <span style={{ width: '92%' }} />
          <span style={{ width: '54%' }} />
        </div>

        {state === 'done' && (
          <div className="nox-sss__stamp-wrap">
            <div className="nox-sss__stamp">{text}</div>
            {sparks.map((spark, i) => (
              <span
                key={i}
                className="nox-sss__spark"
                aria-hidden="true"
                style={
                  {
                    '--sss-angle': `${spark.angle.toFixed(1)}deg`,
                    '--sss-dist': `${spark.distance.toFixed(1)}px`,
                    '--sss-delay': `${spark.delay.toFixed(3)}s`,
                    '--sss-size': `${spark.size.toFixed(1)}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="nox-sss__button"
        onClick={state === 'done' ? reset : submit}
        disabled={state === 'pending'}
      >
        {state === 'idle' && buttonLabel}
        {state === 'pending' && 'Wird geprueft …'}
        {state === 'done' && 'Zuruecksetzen'}
      </button>

      <p className="nox-sss__status" aria-live="polite">
        {state === 'done' ? `Bestaetigt: ${text}` : state === 'pending' ? 'Wird geprueft' : ''}
      </p>
    </div>
  );
}

const CSS = String.raw`
.nox-sss { display:grid; place-content:center; justify-items:center; gap:15px; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-sss__sheet { position:relative; display:grid; align-content:center; width:min(268px,80vw); aspect-ratio:1.42; padding:20px; border-radius:12px; border:1px solid rgba(236,231,219,.09); background:rgba(255,255,255,.024); }
.nox-sss__rows { display:grid; gap:9px; }
.nox-sss__rows span { display:block; height:8px; border-radius:999px; background:rgba(236,231,219,.09); }
.nox-sss__stamp-wrap { position:absolute; inset:0; display:grid; place-items:center; }
/* Overshoot im Easing gibt dem Aufsetzen das Gewicht. */
.nox-sss__stamp { padding:9px 18px; border:3px solid var(--sss-color); border-radius:7px; color:var(--sss-color); font-size:19px; font-weight:820; letter-spacing:.14em; mix-blend-mode:screen; transform:rotate(var(--sss-rot)); animation:nox-sss-stamp var(--sss-dur) cubic-bezier(.3,1.7,.5,1) both; }
@keyframes nox-sss-stamp { from { transform:rotate(var(--sss-rot)) scale(2.2); opacity:0; } to { transform:rotate(var(--sss-rot)) scale(1); opacity:1; } }
.nox-sss__spark { position:absolute; width:var(--sss-size); height:var(--sss-size); border-radius:50%; background:var(--sss-color); opacity:0; animation:nox-sss-spark .58s ease-out var(--sss-delay) both; }
@keyframes nox-sss-spark {
  0% { opacity:0; transform:rotate(var(--sss-angle)) translateX(0) scale(.4); }
  22% { opacity:1; }
  100% { opacity:0; transform:rotate(var(--sss-angle)) translateX(var(--sss-dist)) scale(.8); }
}
.nox-sss__button { padding:11px 24px; border-radius:999px; border:1px solid color-mix(in srgb, var(--sss-color) 45%, transparent); background:color-mix(in srgb, var(--sss-color) 13%, transparent); color:#f2ecd9; font:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:background .24s ease; }
.nox-sss__button:hover:not(:disabled) { background:color-mix(in srgb, var(--sss-color) 22%, transparent); }
.nox-sss__button:disabled { opacity:.5; cursor:default; }
.nox-sss__button:focus-visible { outline:2px solid var(--sss-color); outline-offset:3px; }
.nox-sss__status { min-height:1em; margin:0; color:rgba(236,231,219,.36); font-size:11px; letter-spacing:.1em; }
@media (prefers-reduced-motion:reduce) {
  .nox-sss__stamp { animation:none; }
  .nox-sss__spark { display:none; }
}
`;

export default SuccessStampSubmit;
