import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// AuroraBorealisBackground — ruhige, goldgesäumte Gradient-Atmosphäre ohne
// Canvas. Drei bis fünf große Radial-Gradient-Blobs (Gold, Teal, Tiefblau)
// werden ausschließlich per transform animiert (translate/scale) und liegen
// hinter einer feinen Gold-Vignette. Deterministische Blob-Geometrie via
// seededRandom — kein Math.random, kein Canvas, keine Layout-Writes pro Frame.
// Reduced Motion: statische Komposition.
// ---------------------------------------------------------------------------

export interface AuroraBorealisBackgroundProps {
  /** Animationsgeschwindigkeit (0 = statisch, 1 = normal, 2 = doppelt). */
  speed?: number;
  /** Intensität der Gold-Säume (0–1). */
  goldIntensity?: number;
  /** Anzahl der Gradient-Blobs (3–6). */
  blobCount?: number;
  /** Basisfarbe für die Blobs (wird mit Teal/Tiefblau gemischt). */
  accent?: string;
  /** Deterministischer Seed für die Blob-Geometrie. */
  seed?: number;
}

interface BlobSpec {
  x: number;
  y: number;
  r: number;
  driftX: number;
  driftY: number;
  scale: number;
  dur: number;
  delay: number;
  hue: string;
}

export function AuroraBorealisBackground({
  speed = 1,
  goldIntensity = 0.7,
  blobCount = 4,
  accent = NOX_COLORS.gold,
  seed = 20260810,
}: AuroraBorealisBackgroundProps) {
  const safeSpeed = clamp(speed, 0, 2.5);
  const safeGold = clamp(goldIntensity, 0, 1);
  const count = clamp(Math.round(blobCount), 3, 6);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Blob-Geometrie: Position, Radius, Drift-Richtung und
  // Animations-Dauer/Delay kommen aus dem Seed — bei gleichem Seed identisch.
  const blobs = useMemo<BlobSpec[]>(() => {
    const hues = [accent, '#2f6f8f', '#1b2a4a', '#4a5a8a', '#6f4a2a', accent];
    return Array.from({ length: count }, (_, i) => ({
      x: 12 + rng() * 76,
      y: 10 + rng() * 70,
      r: 26 + rng() * 38,
      driftX: (rng() - 0.5) * 2,
      driftY: (rng() - 0.5) * 2,
      scale: 1 + rng() * 0.8,
      dur: 16 + rng() * 18,
      delay: -rng() * 20,
      hue: hues[i % hues.length],
    }));
  }, [count, rng, accent]);

  const vars = {
    '--aur-gold': NOX_COLORS.gold,
    '--aur-accent': accent,
    '--aur-speed': `${safeSpeed}`,
    '--aur-gold-i': `${safeGold}`,
  } as CSSProperties;

  return (
    <div className="aur-root" style={vars} aria-hidden="true">
      <div className="aur-field">
        {blobs.map((b, i) => (
          <div
            key={i}
            className="aur-blob"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.r}%`,
              height: `${b.r}%`,
              background: `radial-gradient(circle at 38% 34%, ${b.hue}, transparent 68%)`,
              animationDuration: `${b.dur * (1 / Math.max(0.1, safeSpeed))}s`,
              animationDelay: `${b.delay}s`,
              '--drift-x': `${b.driftX * 14}px`,
              '--drift-y': `${b.driftY * 14}px`,
              '--blob-scale': `${b.scale}`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="aur-vignette" />
      <style>{`
.aur-root{position:absolute;inset:0;overflow:hidden;background:
  linear-gradient(165deg,#05070c 0%,#0a0d16 42%,#10131f 100%);isolation:isolate}
.aur-field{position:absolute;inset:-6%;filter:blur(42px);will-change:transform}
.aur-blob{position:absolute;border-radius:50%;opacity:.55;mix-blend-mode:screen;
  animation:aur-drift var(--aur-dur,22s) ease-in-out var(--aur-delay,0s) infinite alternate;
  will-change:transform}
@keyframes aur-drift{
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(var(--drift-x),var(--drift-y),0) scale(var(--blob-scale))}
  100%{transform:translate3d(calc(var(--drift-x) * -1.2),calc(var(--drift-y) * 0.7),0) scale(0.92)}
}
.aur-vignette{position:absolute;inset:0;
  background:
    radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(4,6,10,.72) 100%),
    linear-gradient(115deg,color-mix(in srgb,var(--aur-gold) calc(var(--aur-gold-i) * 14%),transparent),
      transparent 34%,transparent 68%,
      color-mix(in srgb,var(--aur-gold) calc(var(--aur-gold-i) * 10%),transparent));
  border:1px solid color-mix(in srgb,var(--aur-gold) calc(var(--aur-gold-i) * 26%),transparent);
  opacity:.9}
@media (prefers-reduced-motion:reduce){
  .aur-blob{animation:none;transform:translate3d(0,0,0) scale(1)}
  .aur-field{filter:blur(48px)}
}
`}</style>
    </div>
  );
}

export default AuroraBorealisBackground;
