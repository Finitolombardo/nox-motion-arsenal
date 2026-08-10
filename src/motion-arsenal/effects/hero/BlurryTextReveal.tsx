import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// BlurryTextReveal — NOX Hero DNA.
// Die Headline steht zunächst weichgezeichnet und leicht abgesenkt im Raum und
// zieht zeilenweise in die Schärfe, sobald sie ins Bild kommt. Ein einmaliger
// IntersectionObserver schaltet eine Klasse — danach laufen nur noch
// CSS-Transitions auf filter und transform, also keine rAF-Schleife und keine
// Kosten nach dem Auftritt. Der Zeilenversatz ist ein reiner Index-Stagger,
// damit die Reihenfolge bei jedem Aufruf identisch bleibt.
// ---------------------------------------------------------------------------

export interface BlurryTextRevealProps {
  /** Zeilen der Headline, mit | getrennt. */
  text?: string;
  /** Stärke der Startunschärfe. */
  intensity?: number;
  /** Tempo der Schärfung. */
  speed?: number;
  /** Versatz zwischen den Zeilen in Sekunden. */
  stagger?: number;
  /** Schriftgröße als CSS-Wert. */
  fontSize?: string;
  /** Textfarbe. */
  color?: string;
  /** Ausrichtung im Rahmen. */
  align?: 'left' | 'center' | 'right';
  // Skilltree-Erweiterungen. Defaults bilden das bisherige Verhalten exakt ab.
  /** Aus welcher Richtung die Zeilen in die Schaerfe ziehen. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Reihenfolge, in der die Zeilen erscheinen. */
  order?: 'forward' | 'reverse' | 'center';
  /** Auftritt bei jedem Sichtbarwerden wiederholen statt nur einmal. */
  replay?: boolean;
}

// Startversatz je Richtung. 'up' entspricht dem urspruenglichen translateY(20%).
const OFFSETS: Record<string, string> = {
  up: 'translateY(20%)',
  down: 'translateY(-20%)',
  left: 'translateX(14%)',
  right: 'translateX(-14%)',
  none: 'none',
};

export function BlurryTextReveal({
  text = 'Bewegung, die|Vertrauen schafft',
  intensity = 0.5,
  speed = 1,
  stagger = 0.12,
  fontSize = 'clamp(1.8rem, 5.5vw, 4rem)',
  color = '#f2ece2',
  align = 'center',
  direction = 'up',
  order = 'forward',
  replay = false,
}: BlurryTextRevealProps) {
  const reduced = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  const lines = useMemo(
    () => text.split('|').map((line) => line.trim()).filter(Boolean),
    [text],
  );

  // Werte ändern sich über das PropsPanel; der Auftritt soll dann erneut laufen.
  useEffect(() => {
    setRevealed(false);
  }, [text, intensity, speed, stagger, direction, order, replay]);

  useEffect(() => {
    if (reduced) {
      setRevealed(true);
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            // Im Einmal-Modus wird der Beobachter sofort abgemeldet; im
            // Wiederholmodus bleibt er und setzt beim Verlassen zurueck.
            if (!replay) observer.disconnect();
          } else if (replay) {
            setRevealed(false);
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [reduced, text, intensity, speed, stagger, direction, order, replay]);

  const blur = clamp(intensity, 0, 1) * 28;
  const duration = clamp(0.9 / clamp(speed, 0.1, 3), 0.08, 6);
  const step = clamp(stagger, 0, 0.3);

  const style = {
    '--btr-blur': `${blur.toFixed(2)}px`,
    '--btr-dur': `${duration.toFixed(3)}s`,
    '--btr-size': fontSize,
    '--btr-color': color,
    '--btr-offset': OFFSETS[direction] ?? OFFSETS.up,
    textAlign: align,
  } as React.CSSProperties;

  // Der Stagger-Faktor bestimmt nur die Reihenfolge, nicht das Tempo:
  // 'center' laesst die mittlere Zeile zuerst erscheinen und arbeitet sich
  // nach aussen vor.
  const middle = (lines.length - 1) / 2;
  const delayFactor = (index: number) => {
    if (order === 'reverse') return lines.length - 1 - index;
    if (order === 'center') return Math.abs(index - middle);
    return index;
  };

  return (
    <div ref={hostRef} className={`nox-btr${revealed ? ' is-revealed' : ''}`} style={style}>
      <style>{CSS}</style>
      <h2 className="nox-btr__headline">
        {lines.map((line, index) => (
          <span
            key={`${line}-${index}`}
            className="nox-btr__line"
            style={{ '--btr-delay': `${(delayFactor(index) * step).toFixed(3)}s` } as React.CSSProperties}
          >
            {line}
          </span>
        ))}
      </h2>
    </div>
  );
}

const CSS = String.raw`
.nox-btr { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,48px); font-family:var(--sans,system-ui,sans-serif); }
.nox-btr__headline { display:flex; flex-direction:column; gap:.12em; margin:0; font-size:var(--btr-size); font-weight:760; line-height:1.04; letter-spacing:-.035em; color:var(--btr-color); }
.nox-btr__line { display:block; filter:blur(var(--btr-blur)); opacity:0; transform:var(--btr-offset); transition:filter var(--btr-dur) cubic-bezier(.22,1,.36,1) var(--btr-delay), opacity var(--btr-dur) ease var(--btr-delay), transform var(--btr-dur) cubic-bezier(.22,1,.36,1) var(--btr-delay); will-change:filter,transform; }
.nox-btr.is-revealed .nox-btr__line { filter:blur(0); opacity:1; transform:translateY(0); }
/* Nach dem Auftritt fällt der Compositor-Hint weg. */
.nox-btr.is-revealed .nox-btr__line { will-change:auto; }
@media (prefers-reduced-motion:reduce) {
  .nox-btr__line { filter:none; opacity:1; transform:none; transition:none; }
}
`;

export default BlurryTextReveal;
