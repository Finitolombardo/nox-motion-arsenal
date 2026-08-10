import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GoldHighlightSweep — NOX Hero DNA.
// Fließtext, in dem markierte Wörter beim Einlaufen einen Gold-Marker
// bekommen: der Verlauf wächst über background-size von 0% auf 100%, sodass
// nur der Hintergrund animiert wird und der Text selbst nie neu gezeichnet
// werden muss. Markiert wird über *Sternchen* im Text, die Marker laufen
// gestaffelt nach Reihenfolge — kein Zufall, damit die Betonung reproduzierbar
// bleibt.
// ---------------------------------------------------------------------------

export interface GoldHighlightSweepProps {
  /** Text; *markierte* Stellen bekommen den Marker. */
  text?: string;
  /** Farbe des Markers. */
  color?: string;
  /** Tempo des Wischers. */
  speed?: number;
  /** Marker leicht schräg wie mit dem Textmarker gezogen. */
  skew?: boolean;
  /** Höhe des Markers relativ zur Zeile. */
  thickness?: number;
  /** Schriftgröße als CSS-Wert. */
  fontSize?: string;
  /** Versatz zwischen den Markern in Sekunden. */
  stagger?: number;
  // Skilltree-Erweiterungen. Defaults bilden das bisherige Verhalten exakt ab.
  /** Aus welcher Richtung der Marker gezogen wird. */
  direction?: 'left' | 'right' | 'center';
  /** Form der Markierung. */
  style?: 'marker' | 'underline' | 'box' | 'strike';
  /** Was den Marker ausloest. */
  trigger?: 'scroll' | 'hover' | 'always';
}

// Ansatzpunkt des wachsenden Verlaufs. 'left' entspricht dem Original.
const ORIGINS: Record<string, string> = {
  left: '0 88%',
  right: '100% 88%',
  center: '50% 88%',
};

interface Segment {
  text: string;
  marked: boolean;
}

export function GoldHighlightSweep({
  text = 'Wir bauen *Motion-Systeme*, die eine Marke *ernst* wirken lassen — messbar schneller, ruhiger und *wiedererkennbar*.',
  color = NOX_COLORS.gold,
  speed = 1,
  skew = true,
  thickness = 0.42,
  fontSize = 'clamp(1.1rem, 2.6vw, 1.9rem)',
  stagger = 0.18,
  direction = 'left',
  style: markStyle = 'marker',
  trigger = 'scroll',
}: GoldHighlightSweepProps) {
  const reduced = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // *markiert* zerlegen; ungerade Indizes sind die Treffer.
  const segments = useMemo<Segment[]>(
    () =>
      text
        .split(/\*([^*]+)\*/g)
        .map((part, index) => ({ text: part, marked: index % 2 === 1 }))
        .filter((segment) => segment.text.length > 0),
    [text],
  );

  useEffect(() => {
    setActive(false);
  }, [text, speed, stagger, direction, markStyle, trigger]);

  useEffect(() => {
    if (reduced || trigger === 'always') {
      setActive(true);
      return;
    }
    // Bei 'hover' uebernimmt der Pointer; kein Beobachter noetig.
    if (trigger === 'hover') return;
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
      { threshold: 0.3 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [reduced, text, speed, stagger, direction, markStyle, trigger]);

  // Form der Markierung: Hoehe und Lage des Verlaufs. 'marker' ist das Original.
  const heightEm = clamp(thickness, 0.1, 1);
  const SHAPES: Record<string, { size: string; position: string }> = {
    marker: { size: `${heightEm.toFixed(2)}em`, position: ORIGINS[direction] ?? ORIGINS.left },
    underline: { size: '0.12em', position: (ORIGINS[direction] ?? ORIGINS.left).replace('88%', '100%') },
    box: { size: '1.15em', position: (ORIGINS[direction] ?? ORIGINS.left).replace('88%', '50%') },
    strike: { size: '0.1em', position: (ORIGINS[direction] ?? ORIGINS.left).replace('88%', '54%') },
  };
  const shape = SHAPES[markStyle] ?? SHAPES.marker;

  const style = {
    '--ghs-color': color,
    '--ghs-dur': `${clamp(0.62 / clamp(speed, 0.1, 3), 0.05, 6).toFixed(3)}s`,
    '--ghs-height': shape.size,
    '--ghs-pos': shape.position,
    '--ghs-skew': skew && markStyle === 'marker' ? '-1.6deg' : '0deg',
    '--ghs-size': fontSize,
    '--ghs-radius': markStyle === 'box' ? '4px' : '2px',
  } as React.CSSProperties;

  let markIndex = -1;

  return (
    <div
      ref={hostRef}
      className={`nox-ghs${active ? ' is-active' : ''}${trigger === 'hover' ? ' on-hover' : ''}`}
      style={style}
      onMouseEnter={trigger === 'hover' && !reduced ? () => setActive(true) : undefined}
      onMouseLeave={trigger === 'hover' && !reduced ? () => setActive(false) : undefined}
    >
      <style>{CSS}</style>
      <p className="nox-ghs__text">
        {segments.map((segment, index) => {
          if (!segment.marked) return <span key={index}>{segment.text}</span>;
          markIndex += 1;
          return (
            <span
              key={index}
              className="nox-ghs__mark"
              style={{ '--ghs-delay': `${(markIndex * clamp(stagger, 0, 1)).toFixed(3)}s` } as React.CSSProperties}
            >
              {segment.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}

const CSS = String.raw`
.nox-ghs { display:grid; place-items:center; width:100%; height:100%; padding:clamp(18px,5vw,52px); font-family:var(--sans,system-ui,sans-serif); }
.nox-ghs__text { max-width:22ch; margin:0; font-size:var(--ghs-size); font-weight:600; line-height:1.5; letter-spacing:-.015em; color:#ece7db; }
/* background-size wächst — der Text selbst wird dabei nie neu gezeichnet. */
.nox-ghs__mark { background-image:linear-gradient(var(--ghs-color), var(--ghs-color)); background-repeat:no-repeat; background-position:var(--ghs-pos); background-size:0% var(--ghs-height); border-radius:var(--ghs-radius); transition:background-size var(--ghs-dur) cubic-bezier(.22,1,.36,1) var(--ghs-delay); }
/* Bei 'box' liegt der Text auf der Flaeche — dunkle Schrift bleibt lesbar. */
.nox-ghs.is-active .nox-ghs__mark { --ghs-on:1; }
.nox-ghs__text { transition:color var(--ghs-dur) ease; }
.nox-ghs.on-hover { cursor:default; }
.nox-ghs.is-active .nox-ghs__mark { background-size:100% var(--ghs-height); }
.nox-ghs__mark { display:inline-block; transform:skewX(var(--ghs-skew)); }
@media (prefers-reduced-motion:reduce) {
  .nox-ghs__mark { transition:none; background-size:100% var(--ghs-height); }
}
`;

export default GoldHighlightSweep;
