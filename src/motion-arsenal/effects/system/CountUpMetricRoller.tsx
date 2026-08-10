import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// CountUpMetricRoller — NOX System DNA.
// Kennzahl, die beim Einlaufen von null auf den Zielwert zaehlt. Zwei Modi:
// `fade` animiert eine registrierte CSS-@property und laesst counter() die
// Zahl setzen — der Zaehler laeuft damit im Compositor, ohne dass JS pro Frame
// arbeitet. `slot` rollt jede Ziffer als eigene 0-9-Spalte hoch, mit einem
// Stagger, der sich aus Position und Seed ergibt statt aus Zufall.
// Der Wert steht zusaetzlich als Text im DOM, damit Screenreader und
// Suchmaschinen die Zahl sehen und nicht nur eine leere Huelle.
// ---------------------------------------------------------------------------

export interface CountUpMetricRollerProps {
  /** Zielwert. */
  target?: number;
  /** Zaehlmodus. */
  variant?: 'fade' | 'slot';
  /** Dauer in Millisekunden. */
  duration?: number;
  /** Nachkommastellen. */
  decimals?: number;
  /** Text vor der Zahl. */
  prefix?: string;
  /** Text nach der Zahl. */
  suffix?: string;
  /** Beschriftung unter der Zahl. */
  label?: string;
  /** Farbe der Zahl. */
  color?: string;
  /** Seed fuer den Ziffern-Stagger im slot-Modus. */
  salt?: number;
}

// Deterministischer Streuwert je Ziffer — gleiche Eingabe, gleiches Ergebnis.
function det(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function CountUpMetricRoller({
  target = 100000,
  variant = 'fade',
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '+',
  label = 'Aufrufe im Quartal',
  color = NOX_COLORS.gold,
  salt = 3,
}: CountUpMetricRollerProps) {
  const reduced = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const safeDecimals = clamp(Math.round(decimals), 0, 2);
  const safeTarget = clamp(target, 0, 9_999_999);
  const ms = clamp(Math.round(duration), 300, 3000);

  const formatted = useMemo(
    () => safeTarget.toFixed(safeDecimals),
    [safeTarget, safeDecimals],
  );

  useEffect(() => {
    setActive(false);
  }, [target, variant, duration, decimals, salt]);

  useEffect(() => {
    if (reduced) {
      setActive(true);
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [reduced, target, variant, duration, decimals, salt]);

  const style = {
    '--cmr-color': color,
    '--cmr-dur': `${ms}ms`,
    '--cmr-target': Math.round(safeTarget * 10 ** safeDecimals),
  } as React.CSSProperties;

  const digits = formatted.split('');

  return (
    <div ref={hostRef} className={`nox-cmr${active ? ' is-active' : ''}`} style={style}>
      <style>{CSS}</style>
      <div className="nox-cmr__value">
        {prefix && <span className="nox-cmr__affix">{prefix}</span>}

        {variant === 'fade' ? (
          // @property-Zaehler: sichtbar ist das Pseudo-Element, der Text
          // daneben bleibt fuer Screenreader stehen.
          <span className="nox-cmr__counter" aria-hidden="true" data-decimals={safeDecimals} />
        ) : (
          <span className="nox-cmr__slots" aria-hidden="true">
            {digits.map((char, index) => {
              if (char < '0' || char > '9') {
                return (
                  <span key={index} className="nox-cmr__sep">
                    {char}
                  </span>
                );
              }
              const delay = det(index, salt) * 0.22;
              return (
                <span key={index} className="nox-cmr__slot">
                  <span
                    className="nox-cmr__reel"
                    style={
                      {
                        '--cmr-digit': Number(char),
                        '--cmr-delay': `${delay.toFixed(3)}s`,
                      } as React.CSSProperties
                    }
                  >
                    {Array.from({ length: 10 }, (_, n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </span>
                </span>
              );
            })}
          </span>
        )}

        <span className="nox-cmr__sr">
          {prefix}
          {formatted}
          {suffix}
        </span>
        {suffix && <span className="nox-cmr__affix">{suffix}</span>}
      </div>
      {label && <p className="nox-cmr__label">{label}</p>}
    </div>
  );
}

const CSS = String.raw`
@property --cmr-n { syntax: '<integer>'; initial-value: 0; inherits: true; }
.nox-cmr { display:grid; place-content:center; justify-items:center; gap:10px; width:100%; height:100%; padding:clamp(16px,4vw,40px); font-family:var(--sans,system-ui,sans-serif); text-align:center; }
.nox-cmr__value { display:flex; align-items:baseline; gap:.06em; font-size:clamp(2.2rem,7vw,4.6rem); font-weight:780; letter-spacing:-.045em; line-height:1; color:var(--cmr-color); font-variant-numeric:tabular-nums; }
.nox-cmr__affix { opacity:.62; font-size:.62em; }
.nox-cmr__sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
/* fade: der Zaehler ist eine animierte @property, counter() rendert sie. */
.nox-cmr__counter::after { counter-reset: cmr var(--cmr-n); content: counter(cmr); }
.nox-cmr.is-active .nox-cmr__counter { animation: nox-cmr-count var(--cmr-dur) cubic-bezier(.22,1,.36,1) forwards; }
@keyframes nox-cmr-count { from { --cmr-n: 0; } to { --cmr-n: var(--cmr-target); } }
/* slot: jede Ziffer ist eine Spalte, die auf ihre Zielziffer hochrollt. */
.nox-cmr__slots { display:inline-flex; }
.nox-cmr__slot { display:inline-block; overflow:hidden; height:1em; }
.nox-cmr__reel { display:flex; flex-direction:column; transform:translateY(0); }
.nox-cmr__reel > span { display:block; height:1em; line-height:1; }
.nox-cmr.is-active .nox-cmr__reel { transition:transform var(--cmr-dur) cubic-bezier(.22,1,.36,1) var(--cmr-delay); transform:translateY(calc(var(--cmr-digit) * -1em)); }
.nox-cmr__sep { display:inline-block; }
.nox-cmr__label { margin:0; color:rgba(236,231,219,.4); font-size:11px; letter-spacing:.24em; text-transform:uppercase; }
@media (prefers-reduced-motion:reduce) {
  .nox-cmr__counter { animation:none !important; }
  .nox-cmr__counter::after { counter-reset: cmr var(--cmr-target); }
  .nox-cmr__reel { transition:none !important; transform:translateY(calc(var(--cmr-digit) * -1em)); }
}
`;

export default CountUpMetricRoller;
