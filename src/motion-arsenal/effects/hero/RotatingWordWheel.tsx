import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion, useInView } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// RotatingWordWheel — NOX Hero DNA.
// Ein Wort im Satz wechselt, indem ein vertikaler Track weiterrollt. Die
// Schrittweite ist die Zeilenhoehe als CSS-Variable, sodass der Track unabhaengig
// von der Schriftgroesse exakt einrastet.
// Der Timer laeuft nur, solange der Hero im Bild ist — ein Karussell, das im
// Hintergrund weiterdreht, kostet Strom ohne dass es jemand sieht.
// Alle Woerter stehen im DOM; das aktive traegt aria-current, damit
// Screenreader den Satz einmal vollstaendig lesen koennen.
// ---------------------------------------------------------------------------

export interface RotatingWordWheelProps {
  /** Text vor dem Rad. */
  prefix?: string;
  /** Wechselnde Woerter, mit / getrennt. */
  words?: string;
  /** Text nach dem Rad. */
  suffix?: string;
  /** Tempo des Uebergangs. */
  speed?: number;
  /** Standzeit je Wort in Sekunden. */
  pause?: number;
  /** Farbe der wechselnden Woerter. */
  color?: string;
  /** Schriftgroesse als CSS-Wert. */
  fontSize?: string;
}

export function RotatingWordWheel({
  prefix = 'Wir bauen',
  words = 'Interfaces / Systeme / Erlebnisse / Marken',
  suffix = 'die bleiben.',
  speed = 1,
  pause = 2,
  color = NOX_COLORS.gold,
  fontSize = 'clamp(1.5rem, 4.4vw, 3.2rem)',
}: RotatingWordWheelProps) {
  const reduced = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const inView = useInView(hostRef);
  const [index, setIndex] = useState(0);

  const list = useMemo(
    () => words.split('/').map((w) => w.trim()).filter(Boolean),
    [words],
  );

  useEffect(() => {
    setIndex(0);
  }, [words]);

  useEffect(() => {
    // Kein Timer, wenn niemand hinsieht oder Bewegung unerwuenscht ist.
    if (reduced || !inView || list.length < 2) return;
    const hold = clamp(pause, 0.5, 6) * 1000;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % list.length);
    }, hold);
    return () => window.clearInterval(timer);
  }, [reduced, inView, list.length, pause]);

  const style = {
    '--rww-color': color,
    '--rww-size': fontSize,
    '--rww-dur': reduced ? '0s' : `${(0.62 / clamp(speed, 0.1, 3)).toFixed(3)}s`,
    '--rww-index': index,
  } as React.CSSProperties;

  return (
    <div ref={hostRef} className="nox-rww" style={style}>
      <style>{CSS}</style>
      <p className="nox-rww__line">
        {prefix && <span className="nox-rww__static">{prefix}</span>}
        <span className="nox-rww__window">
          <span className="nox-rww__track">
            {list.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="nox-rww__word"
                aria-current={i === index ? 'true' : undefined}
              >
                {word}
              </span>
            ))}
          </span>
        </span>
        {suffix && <span className="nox-rww__static">{suffix}</span>}
      </p>
    </div>
  );
}

const CSS = String.raw`
.nox-rww { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,44px); font-family:var(--sans,system-ui,sans-serif); }
.nox-rww__line { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:.28em; max-width:20ch; margin:0; font-size:var(--rww-size); font-weight:720; line-height:1.22; letter-spacing:-.035em; color:#f0ebe1; text-align:center; }
/* Fenster genau eine Zeile hoch; der Track rastet in Zeilenhoehen ein. */
.nox-rww__window { display:inline-block; height:1.22em; overflow:hidden; vertical-align:bottom; -webkit-mask-image:linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent); mask-image:linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent); }
.nox-rww__track { display:flex; flex-direction:column; transform:translateY(calc(var(--rww-index) * -1.22em)); transition:transform var(--rww-dur) cubic-bezier(.22,1,.36,1); }
.nox-rww__word { display:block; height:1.22em; line-height:1.22em; color:var(--rww-color); white-space:nowrap; }
@media (prefers-reduced-motion:reduce) {
  .nox-rww__track { transition:none; }
  .nox-rww__window { -webkit-mask-image:none; mask-image:none; }
}
`;

export default RotatingWordWheel;
