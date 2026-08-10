import { useMemo } from 'react';
import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NeonTubeFlickerText — NOX Hero DNA.
// Schriftzug als Leuchtroehre: ein gestapelter text-shadow bildet Kern, Blur
// und Halo, das Flackern kommt aus versetzten Keyframes je Buchstabe. Die
// Versaetze stammen aus einem seeded PRNG, nicht aus Math.random — derselbe
// Seed ergibt also immer dasselbe Flackermuster, was bei einem Markenschriftzug
// wichtiger ist als echte Zufaelligkeit.
// Der Text steht als zusammenhaengendes Wort im DOM (aria-label am Container,
// Buchstaben aria-hidden), damit Screenreader nicht Buchstabe fuer Buchstabe
// vorlesen.
// ---------------------------------------------------------------------------

export interface NeonTubeFlickerTextProps {
  /** Schriftzug. */
  text?: string;
  /** Staerke des Leuchtens. */
  glow?: number;
  /** Haeufigkeit und Tiefe der Aussetzer. */
  flicker?: number;
  /** Farbe der Roehre. */
  color?: string;
  /** Schriftgroesse als CSS-Wert. */
  fontSize?: string;
  /** Seed fuer das Flackermuster. */
  seed?: number;
}

// Deterministischer Streuwert — gleiche Eingabe, gleiches Muster.
function det(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function NeonTubeFlickerText({
  text = 'NOX',
  glow = 0.7,
  flicker = 0.4,
  color = NOX_COLORS.gold,
  fontSize = 'clamp(3rem, 14vw, 9rem)',
  seed = 7,
}: NeonTubeFlickerTextProps) {
  const intensity = clamp(glow, 0, 1);
  const flickerAmount = clamp(flicker, 0, 1);

  const letters = useMemo(() => text.split(''), [text]);

  const style = {
    '--ntf-color': color,
    '--ntf-size': fontSize,
    // Der Halo waechst mit der Glow-Staerke, der Kern bleibt scharf.
    '--ntf-glow-1': `${(2 + intensity * 4).toFixed(1)}px`,
    '--ntf-glow-2': `${(8 + intensity * 18).toFixed(1)}px`,
    '--ntf-glow-3': `${(20 + intensity * 52).toFixed(1)}px`,
    '--ntf-dim': (0.28 + (1 - flickerAmount) * 0.5).toFixed(3),
  } as React.CSSProperties;

  return (
    <div className="nox-ntf" style={style}>
      <style>{CSS}</style>
      <div className="nox-ntf__tube" role="img" aria-label={text}>
        {letters.map((letter, index) => {
          const wobble = det(index, seed);
          // Nur ein Teil der Buchstaben flackert — eine Roehre, in der jeder
          // Buchstabe zuckt, wirkt wie ein Defekt, nicht wie Neon.
          const flickers = flickerAmount > 0 && wobble < 0.15 + flickerAmount * 0.4;
          return (
            <span
              key={`${letter}-${index}`}
              className={`nox-ntf__letter${flickers ? ' is-flicker' : ''}`}
              aria-hidden="true"
              style={
                {
                  '--ntf-delay': `${(wobble * 5).toFixed(2)}s`,
                  '--ntf-dur': `${(3.4 + det(index, seed + 11) * 4).toFixed(2)}s`,
                } as React.CSSProperties
              }
            >
              {letter === ' ' ? ' ' : letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const CSS = String.raw`
.nox-ntf { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,44px); background:radial-gradient(ellipse 60% 70% at 50% 55%, color-mix(in srgb, var(--ntf-color) 7%, transparent), transparent 70%); font-family:var(--sans,system-ui,sans-serif); }
.nox-ntf__tube { display:flex; font-size:var(--ntf-size); font-weight:760; letter-spacing:.06em; line-height:1; }
.nox-ntf__letter { color:#fff8e6; text-shadow:
    0 0 var(--ntf-glow-1) #fff8e6,
    0 0 var(--ntf-glow-2) var(--ntf-color),
    0 0 var(--ntf-glow-3) var(--ntf-color); }
.nox-ntf__letter.is-flicker { animation:nox-ntf-flicker var(--ntf-dur) steps(1,end) var(--ntf-delay) infinite; }
/* Kurze, unregelmaessige Aussetzer statt gleichmaessigem Pulsieren. */
@keyframes nox-ntf-flicker {
  0%, 41%, 43%, 46%, 71%, 74%, 100% { opacity:1; }
  42%, 45%, 72% { opacity:var(--ntf-dim); }
}
@media (prefers-reduced-motion:reduce) {
  .nox-ntf__letter.is-flicker { animation:none; opacity:1; }
}
`;

export default NeonTubeFlickerText;
