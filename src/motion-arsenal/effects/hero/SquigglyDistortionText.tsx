import { type CSSProperties } from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SquigglyDistortionText — feine SVG-Displacement-Wellen beleben Headlines.
// feTurbulence + feDisplacementMap auf einem SVG-Filter, der über eine CSS-
// Variable die Amplitude steuert (0 = scharf, 1 = maximal gewellt). Die
// Turbulence-Frequenz und -Animation laufen nativ im Browser (kein rAF-Loop,
// kein Layout-Write). Deterministische Frequenz aus dem Seed.
// Reduced Motion: Filter deaktiviert (scharfer Text).
// ---------------------------------------------------------------------------

export interface SquigglyDistortionTextProps {
  /** Text. */
  text?: string;
  /** Distortion-Amplitude (0–1). */
  amount?: number;
  /** Deterministischer Seed für Frequenz. */
  seed?: number;
}

export function SquigglyDistortionText({
  text = 'DISTORTED',
  amount = 0.5,
  seed = 20260810,
}: SquigglyDistortionTextProps) {
  const safeAmount = clamp(amount, 0, 1);
  const freq = 0.006 + ((seed % 90) / 90) * 0.012;

  const vars = {
    '--sqt-gold': NOX_COLORS.gold,
    '--sqt-amount': `${safeAmount * 14}`,
    '--sqt-freq': `${freq.toFixed(4)}`,
  } as CSSProperties;

  return (
    <div className="sqt-root" style={vars} aria-hidden="true">
      <svg className="sqt-svg">
        <defs>
          <filter id="sqt-displace">
            <feTurbulence type="fractalNoise" baseFrequency={freq.toFixed(4)} numOctaves="2" seed={seed % 100} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={safeAmount * 14} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <span className="sqt-text" style={{ filter: safeAmount > 0 ? 'url(#sqt-displace)' : undefined }}>
        {text}
      </span>
      <style>{`
.sqt-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.sqt-svg{position:absolute;width:0;height:0}
.sqt-text{font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.04em;color:var(--sqt-gold);
  text-shadow:0 0 30px color-mix(in srgb,var(--sqt-gold) 36%,transparent);
  will-change:filter;display:inline-block}
@media (prefers-reduced-motion:reduce){
  .sqt-text{filter:none !important}
}
`}</style>
    </div>
  );
}

export default SquigglyDistortionText;
