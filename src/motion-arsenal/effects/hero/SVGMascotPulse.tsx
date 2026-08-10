import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SVGMascotPulse — pulsierendes SVG-Maskottchen (deterministisch generiert):
// Ein abstraktes "Nox-Kopf"-Emblem aus Kreisen/Bögen pulsiert mit weichem
// Herzschlag-Rhythmus (doppeltes Puls-Plateau), dazu ein Ring-Echo. Reine
// CSS-Animation auf transform (scale) — kein rAF-Loop. Seed steuert Größen-
// verhältnisse und Phasenversatz. Reduced Motion: statisches Emblem.
// ---------------------------------------------------------------------------

export interface SVGMascotPulseProps {
  /** Emblem-Größe in px (80–320). */
  size?: number;
  /** Puls-Intensität (0–1). */
  intensity?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function SVGMascotPulse({
  size = 180,
  intensity = 0.8,
  seed = 20260810,
}: SVGMascotPulseProps) {
  const safeSize = clamp(size, 80, 320);
  const safeIntensity = clamp(intensity, 0, 1);
  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Emblem-Geometrie (Kopf + Augen + Gold-Kern).
  const geom = useMemo(() => {
    const eyeGap = 16 + rng() * 10;
    const eyeY = 46 + rng() * 8;
    return { eyeGap, eyeY };
  }, [rng]);

  const vars = {
    '--smp-gold': NOX_COLORS.gold,
    '--smp-size': `${safeSize}px`,
    '--smp-intensity': `${safeIntensity}`,
    '--smp-phase': `${(seed % 100) / 100}`,
  } as CSSProperties;

  return (
    <div className="smp-root" style={vars} aria-hidden="true">
      <svg className="smp-svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="smp-core">
            <stop offset="0" stopColor="#fff6dd" />
            <stop offset="1" stopColor="var(--smp-gold)" />
          </radialGradient>
        </defs>
        <circle className="smp-ring" cx="60" cy="60" r="46" fill="none" stroke="var(--smp-gold)" strokeOpacity=".5" strokeWidth="1.5" />
        <circle className="smp-head" cx="60" cy="60" r="38" fill="none" stroke="var(--smp-gold)" strokeWidth="2.5" />
        <circle className="smp-core" cx="60" cy="60" r="20" fill="url(#smp-core)" />
        <circle cx={60 - geom.eyeGap} cy={geom.eyeY} r="3.4" fill="#0a0c10" />
        <circle cx={60 + geom.eyeGap} cy={geom.eyeY} r="3.4" fill="#0a0c10" />
        <path d="M 44 74 Q 60 86 76 74" fill="none" stroke="#0a0c10" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <style>{`
.smp-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.smp-svg{width:var(--smp-size);height:var(--smp-size);overflow:visible}
.smp-head{transform-origin:60px 60px;animation:smp-beat 1.6s ease-in-out infinite;
  animation-delay:calc(var(--smp-phase) * -1.6s)}
.smp-core{transform-origin:60px 60px;animation:smp-core 1.6s ease-in-out infinite;
  animation-delay:calc(var(--smp-phase) * -1.6s)}
.smp-ring{transform-origin:60px 60px;animation:smp-ring 1.6s ease-out infinite;
  animation-delay:calc(var(--smp-phase) * -1.6s)}
@keyframes smp-beat{
  0%,100%{transform:scale(1)}
  12%{transform:scale(calc(1 + var(--smp-intensity) * .05))}
  24%{transform:scale(1)}
  30%{transform:scale(calc(1 + var(--smp-intensity) * .035))}
  42%{transform:scale(1)}
}
@keyframes smp-core{
  0%,100%{transform:scale(1)}
  12%{transform:scale(calc(1 + var(--smp-intensity) * .12))}
  24%{transform:scale(1)}
  30%{transform:scale(calc(1 + var(--smp-intensity) * .08))}
  42%{transform:scale(1)}
}
@keyframes smp-ring{
  0%{transform:scale(.86);opacity:.7}
  60%{transform:scale(1.14);opacity:0}
  100%{transform:scale(1.14);opacity:0}
}
@media (prefers-reduced-motion:reduce){
  .smp-head,.smp-core,.smp-ring{animation:none}
}
`}</style>
    </div>
  );
}

export default SVGMascotPulse;
