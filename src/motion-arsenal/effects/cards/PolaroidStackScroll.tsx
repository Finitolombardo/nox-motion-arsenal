import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// PolaroidStackScroll — gestreute Polaroids ordnen sich beim Scrollen zu
// einem Stack. Jede Karte startet mit deterministischem Offset, Rotation und
// Blur (seededRandom) und scrubbt über den Progress auf ihre Stack-Position
// (zentriert, leicht versetzt, scharfer Fokus). Steuerung im rAF-Loop per
// transform/opacity/filter — kein Layout-Write pro Frame. Die Motiv-Fläche
// nutzt NOX-Farbverläufe (deterministisch), kein Bild-Input nötig.
// Reduced Motion: Karten stehen direkt im Stack.
// ---------------------------------------------------------------------------

export interface PolaroidStackScrollProps {
  /** Anzahl der Polaroids (3–8). */
  count?: number;
  /** Stack-Versatz der Karten in px (2–16). */
  stackOffset?: number;
  /** Streu-Radius der Ausgangsposition in % (10–45). */
  scatter?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

interface CardSpec {
  id: number;
  sx: number;
  sy: number;
  rot: number;
  blur: number;
  hue: string;
}

const HUES = ['#8a6a3a', '#3a5a7a', '#4a7a4a', '#7a3a4a', '#5a4a7a', '#7a6a2a', '#2a6a6a', '#6a3a2a'];

export function PolaroidStackScroll({
  count = 5,
  stackOffset = 6,
  scatter = 30,
  seed = 20260810,
}: PolaroidStackScrollProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();
  const safeCount = clamp(Math.round(count), 3, 8);
  const safeOffset = clamp(stackOffset, 2, 16);
  const safeScatter = clamp(scatter, 10, 45);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  const cards = useMemo<CardSpec[]>(() => {
    return Array.from({ length: safeCount }, (_, i) => ({
      id: i,
      sx: (rng() - 0.5) * 2 * safeScatter,
      sy: (rng() - 0.5) * 2 * safeScatter,
      rot: (rng() - 0.5) * 34,
      blur: 1 + rng() * 4,
      hue: HUES[i % HUES.length],
    }));
  }, [safeCount, rng, safeScatter]);

  const progressRef = useScrollProgress(rootRef);

  useRafLoop((_dt) => {
    if (reduced) return;
    const p = progressRef.current;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const c = cards[i];
      const t = Math.min(1, Math.max(0, (p - i * 0.12) / 0.6)); // gestaffelter Scrub
      const e = 1 - (1 - t) * (1 - t); // easeOut
      const dx = c.sx * (1 - e) + ((i - (safeCount - 1) / 2) * safeOffset) * e;
      const dy = c.sy * (1 - e) + (i * safeOffset * 0.4) * e;
      const rot = c.rot * (1 - e);
      const blur = c.blur * (1 - e);
      const opacity = 0.25 + e * 0.75;
      el.style.transform = `translate3d(${dx}%, ${dy}%, 0) rotate(${rot}deg)`;
      el.style.filter = `blur(${blur}px)`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(i + 1);
    });
  }, true);

  const vars = {
    '--pps-gold': NOX_COLORS.gold,
    '--pps-count': `${safeCount}`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="pps-root" style={vars} aria-hidden="true">
      <div className="pps-field">
        {cards.map((c) => (
          <div
            key={c.id}
            ref={(el) => {
              cardRefs.current[c.id] = el;
            }}
            className="pps-card"
            style={{ '--pps-hue': c.hue } as CSSProperties}
          >
            <div className="pps-photo" />
            <div className="pps-caption">
              <span>NOX — {String(c.id + 1).padStart(2, '0')}</span>
              <i />
            </div>
          </div>
        ))}
      </div>
      <style>{`
.pps-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(120% 100% at 50% 0%,#0e1120 0%,#07090d 70%)}
.pps-field{position:relative;width:min(320px,62%);aspect-ratio:3/4;max-height:78%}
.pps-card{position:absolute;left:50%;top:50%;width:56%;aspect-ratio:3/4;
  margin-left:-28%;margin-top:-22%;background:#f6f1e6;border-radius:3px;
  padding:5% 5% 0;box-shadow:0 18px 44px #000a;will-change:transform,opacity,filter}
.pps-photo{width:100%;height:76%;background:
  linear-gradient(150deg,var(--pps-hue),#0a0d13 120%);
  border:1px solid #00000022;position:relative}
.pps-photo::after{content:'';position:absolute;inset:0;
  background:radial-gradient(80% 60% at 30% 20%,#ffffff26,transparent 60%)}
.pps-caption{display:flex;align-items:center;justify-content:space-between;
  padding:8% 2% 6%;font:10px ui-monospace,monospace;letter-spacing:.12em;color:#3a342a}
.pps-caption i{width:14px;height:14px;border:1px solid var(--pps-gold);border-radius:50%}
@media (prefers-reduced-motion:reduce){
  .pps-card{transform:none;filter:none;opacity:1}
}
`}</style>
    </div>
  );
}

export default PolaroidStackScroll;
