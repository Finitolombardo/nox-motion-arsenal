import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// VerticalSlitSlideshow — Slideshow mit vertikalen Gold-Slits: Beim Wechsel
// zerfällt das aktuelle Bild in N Streifen, die gestaffelt kippen (3D:
// translateZ/RotateX) und das nächste freigeben. Streifen-Stagger und
// Kipp-Richtung deterministisch (det-PRNG). Gold-Kanten-Licht auf den
// Schnittkanten. Autoplay mit konfigurierbarer Dauer; nur transform/opacity.
// Reduced Motion: Direkter Bildwechsel ohne Slit-Choreografie.
// ---------------------------------------------------------------------------

export interface VerticalSlitSlideshowProps {
  /** Bild-URLs (bei Leere: deterministische NOX-Gradient-Slides). */
  images?: string[];
  /** Slit-Anzahl (4–16). */
  slits?: number;
  /** Autoplay-Dauer in s (2–10). */
  interval?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function VerticalSlitSlideshow({
  images,
  slits = 8,
  interval = 4,
  seed = 20260810,
}: VerticalSlitSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  const reduced = usePrefersReducedMotion();
  const safeSlits = clamp(Math.round(slits), 4, 16);
  const safeInterval = clamp(interval, 2, 10);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const stagger = useMemo(
    () => Array.from({ length: safeSlits }, () => ({ d: rng() * 0.5, dir: rng() > 0.5 ? 1 : -1 })),
    [safeSlits, rng]
  );

  // Deterministische Gradient-Slides, wenn keine Bilder gegeben sind.
  const fallback = useMemo(() => {
    const stops = [0.25, 0.5, 0.75, 1].map((p) => `#${(NOX_COLORS.gold + '1a')} ${p * 100}%`).join(',');
    return [
      `linear-gradient(135deg, #0d1019 0%, ${NOX_COLORS.gold}55 100%)`,
      `linear-gradient(225deg, #0a0c10 0%, ${NOX_COLORS.gold}44 100%)`,
    ];
  }, []);

  const slides = images && images.length > 0 ? images : fallback;

  const next = () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
      transitioningRef.current = false;
      setTransitioning(false);
    }, reduced ? 0 : 750);
  };
  const prev = () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      setIndex((i) => (i - 1 + slides.length) % slides.length);
      transitioningRef.current = false;
      setTransitioning(false);
    }, reduced ? 0 : 750);
  };

  // Autoplay.
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (!transitioningRef.current) next();
    }, safeInterval * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeInterval, reduced, slides.length]);

  const vars = {
    '--vss-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div className="vss-root" style={vars}>
      <div className="vss-stage">
        <div
          className="vss-slide"
          style={{ backgroundImage: `url("${slides[index]}")`, zIndex: transitioning ? 0 : 1 }}
        />
        {transitioning && (
          <div className="vss-slits" key={index}>
            {stagger.map((s, i) => (
              <div
                key={i}
                className="vss-slit"
                style={{
                  width: `${100 / safeSlits}%`,
                  backgroundImage: `url("${slides[index]}")`,
                  backgroundSize: `${safeSlits * 100}% 100%`,
                  backgroundPosition: `${(i / safeSlits) * 100}% 0`,
                  animationDelay: `${s.d}s`,
                  '--vss-dir': s.dir,
                } as CSSProperties}
              />
            ))}
          </div>
        )}
        <div className="vss-shade" />
      </div>
      <div className="vss-nav">
        <button type="button" className="vss-btn" onClick={prev} aria-label="Vorheriges Bild">←</button>
        <span className="vss-count">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
        <button type="button" className="vss-btn" onClick={next} aria-label="Nächstes Bild">→</button>
      </div>
      <style>{`
.vss-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.vss-stage{position:relative;width:min(84%,560px);aspect-ratio:16/9;border-radius:12px;
  overflow:hidden;border:1px solid color-mix(in srgb,var(--vss-gold) 20%,transparent);
  box-shadow:0 18px 60px rgba(0,0,0,.5)}
.vss-slide{position:absolute;inset:0;background-size:cover;background-position:center;
  transition:opacity .4s}
.vss-slits{position:absolute;inset:0;display:flex;pointer-events:none;z-index:2}
.vss-slit{height:100%;background-size:cover;transform-origin:center;
  border-right:1px solid color-mix(in srgb,var(--vss-gold) 55%,transparent);
  animation:vss-slit .75s cubic-bezier(.2,.9,.3,1.05) forwards;
  will-change:transform,opacity}
@keyframes vss-slit{
  0%{transform:rotateX(0) translateZ(0);opacity:1}
  100%{transform:rotateX(calc(var(--vss-dir) * 86deg)) translateZ(-60px);opacity:0}
}
.vss-shade{position:absolute;inset:0;pointer-events:none;z-index:3;
  background:radial-gradient(120% 90% at 50% 30%,transparent 60%,rgba(0,0,0,.35))}
.vss-nav{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:14px;z-index:4}
.vss-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.16);
  color:var(--vss-gold);font:700 14px/1 ui-monospace,monospace;width:34px;height:34px;
  border-radius:8px;cursor:pointer;transition:border-color .2s}
.vss-btn:hover{border-color:var(--vss-gold)}
.vss-count{color:#8a8578;font:600 11px/1 ui-monospace,monospace;letter-spacing:.18em}
@media (prefers-reduced-motion:reduce){
  .vss-slit{animation:none;opacity:1}
  .vss-btn{display:none}
}
`}</style>
    </div>
  );
}

export default VerticalSlitSlideshow;
