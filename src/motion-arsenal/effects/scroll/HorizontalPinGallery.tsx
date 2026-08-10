import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// HorizontalPinGallery — gepinnte horizontale Bilderstrecke mit Fortschritts-
// rail. Während die Sektion im Viewport "gepinnt" ist (Sticky-Pinning über
// die Abschnittshöhe), fährt der Streifen horizontal durch — mit einer
// Fortschrittsrail am unteren Rand. Kein ScrollTrigger nötig: Pinning via
// position: sticky, Progress via useScrollProgress im rAF-Loop (transform-
// only). Deterministische Motiv-Farbverläufe. Reduced Motion: erste Karte.
// ---------------------------------------------------------------------------

export interface HorizontalPinGalleryProps {
  /** Kartentitel (bestimmt Anzahl, 3–8). */
  cards?: string[];
  /** Track-Höhe der Sektion in vh (120–320). */
  pinHeight?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

const HUES = ['#8a6a3a', '#2f6f8f', '#4a7a4a', '#7a3a4a', '#5a4a7a', '#6a7a2a', '#2a6a6a', '#8a3a2a'];

export function HorizontalPinGallery({
  cards = ['01 / SIGNAL', '02 / STRUCTURE', '03 / MOTION', '04 / SYSTEM', '05 / ARSENAL'],
  pinHeight = 220,
  seed = 20260810,
}: HorizontalPinGalleryProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const safeCards = cards.length > 0 ? cards.slice(0, 8) : ['NOX'];
  const safeHeight = clamp(pinHeight, 120, 320);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const motiffs = useMemo(
    () => safeCards.map(() => ({ h: 20 + rng() * 40, s: 30 + rng() * 25 })),
    [safeCards, rng]
  );

  const progressRef = useScrollProgress(rootRef);

  useRafLoop((_dt) => {
    if (reduced) return;
    const p = progressRef.current;
    const track = trackRef.current;
    const rail = railRef.current;
    if (!track || !rail) return;
    // Max. Verschiebung: Track-Breite minus Sichtbreite (ca. 1 Karte bleibt).
    const maxShift = Math.max(0, track.scrollWidth - track.clientWidth);
    track.style.transform = `translate3d(${-p * maxShift}px, 0, 0)`;
    rail.style.transform = `scaleX(${p})`;
  }, true);

  const vars = {
    '--hpg-gold': NOX_COLORS.gold,
    '--hpg-height': `${safeHeight}vh`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="hpg-root" style={vars}>
      <div className="hpg-sticky">
        <div ref={trackRef} className="hpg-track">
          {safeCards.map((label, i) => (
            <div key={i} className="hpg-card" style={{ '--hpg-hue': `hsl(${motiffs[i].h} ${motiffs[i].s}% 30%)` } as CSSProperties}>
              <div className="hpg-art">
                <span>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <p>{label}</p>
            </div>
          ))}
        </div>
        <div className="hpg-rail">
          <div ref={railRef} className="hpg-rail-fill" />
        </div>
      </div>
      <style>{`
.hpg-root{position:absolute;inset:0;overflow:hidden;height:var(--hpg-height);
  background:linear-gradient(180deg,#0a0d13,#06080c)}
.hpg-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;
  align-items:center}
.hpg-track{display:flex;gap:3vw;padding:0 6vw;will-change:transform;
  align-items:center}
.hpg-card{flex:0 0 min(340px,62vw);aspect-ratio:4/3;position:relative;overflow:hidden;
  border:1px solid color-mix(in srgb,var(--hpg-gold) 26%,transparent);
  background:#0b0e14;box-shadow:0 18px 44px #0008}
.hpg-art{position:absolute;inset:0;background:
  radial-gradient(90% 70% at 30% 22%,color-mix(in srgb,var(--hpg-hue) 70%,#0b0e14),#0b0e14 75%);
  display:grid;place-items:center;font:700 clamp(28px,4vw,44px) ui-monospace,monospace;
  color:color-mix(in srgb,var(--hpg-gold) 85%,#fff)}
.hpg-art::after{content:'';position:absolute;inset:0;
  background:linear-gradient(115deg,transparent 42%,#ffffff14 50%,transparent 58%)}
.hpg-card p{position:absolute;left:14px;bottom:10px;margin:0;font:10px ui-monospace,monospace;
  letter-spacing:.22em;color:var(--hpg-gold)}
.hpg-rail{position:absolute;left:6vw;right:6vw;bottom:22px;height:2px;background:#1a1f2a}
.hpg-rail-fill{height:100%;background:var(--hpg-gold);transform:scaleX(0);
  transform-origin:left;will-change:transform}
@media (prefers-reduced-motion:reduce){
  .hpg-track{transform:none !important}
  .hpg-rail-fill{transform:none !important}
}
`}</style>
    </div>
  );
}

export default HorizontalPinGallery;
