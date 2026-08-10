import { type CSSProperties } from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// HolographicTypeEffect — irideszente Gold-Typografie mit kontrollierter
// Lichtmaske. Der Text bekommt einen holografischen Verlauf (Gold → Kupfer →
// Blau-Gold) via background-clip:text; eine weiche Lichtmaske (CSS mask,
// radial) wandert langsam über die Zeichen — rein CSS, keine Animation pro
// Frame, kein Layout-Write. Deterministische Farbwinkel aus dem Seed.
// Reduced Motion: statischer Hologramm-Glanz.
// ---------------------------------------------------------------------------

export interface HolographicTypeEffectProps {
  /** Anzuzeigender Text. */
  text?: string;
  /** Hologramm-Winkel des Farbverlaufs (0–360). */
  hue?: number;
  /** Intensität des Irideszenz-Glanzes (0–1). */
  intensity?: number;
  /** Deterministischer Seed für die Lichtmaske. */
  seed?: number;
}

export function HolographicTypeEffect({
  text = 'HOLOGRAPHIC',
  hue = 42,
  intensity = 0.85,
  seed = 20260810,
}: HolographicTypeEffectProps) {
  const safeHue = ((hue % 360) + 360) % 360;
  const safeIntensity = clamp(intensity, 0, 1);
  const lightX = ((seed % 100) / 100) * 100;

  const vars = {
    '--hot-gold': NOX_COLORS.gold,
    '--hot-hue': `${safeHue}`,
    '--hot-intensity': `${safeIntensity}`,
    '--hot-light-x': `${lightX}%`,
  } as CSSProperties;

  return (
    <div className="hot-root" style={vars} aria-hidden="true">
      <span className="hot-text" data-text={text}>{text}</span>
      <span className="hot-shine" />
      <style>{`
.hot-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0c0f17,#06080c)}
.hot-text{position:relative;font:900 clamp(42px,9vw,110px)/1 system-ui;letter-spacing:-.04em;
  background:linear-gradient(${safeHue}deg,
    hsl(${safeHue} 70% 62%) 0%,
    hsl(${(safeHue + 30) % 360} 65% 46%) 32%,
    hsl(${(safeHue + 200) % 360} 45% 58%) 62%,
    hsl(${safeHue} 75% 66%) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 26px hsl(${safeHue} 70% 55% / calc(var(--hot-intensity) * .4)))}
.hot-text::after{content:attr(data-text);position:absolute;inset:0;
  -webkit-text-stroke:1px hsl(${safeHue} 70% 70% / .5);opacity:.35}
.hot-shine{position:absolute;inset:-20%;pointer-events:none;opacity:.5;
  background:radial-gradient(32% 42% at var(--hot-light-x) 38%,
    rgba(255,244,214,.9),transparent 70%);
  mix-blend-mode:screen;
  -webkit-mask-image:radial-gradient(42% 60% at 50% 50%,#000 30%,transparent 78%);
  mask-image:radial-gradient(42% 60% at 50% 50%,#000 30%,transparent 78%);
  animation:hot-drift 14s ease-in-out infinite alternate;will-change:transform}
@keyframes hot-drift{
  0%{transform:translateX(-6%)}
  100%{transform:translateX(6%)}
}
@media (prefers-reduced-motion:reduce){
  .hot-shine{animation:none;transform:none}
}
`}</style>
    </div>
  );
}

export default HolographicTypeEffect;
