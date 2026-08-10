import { useEffect, useRef, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ScrollDrivenCssReveal — progressive In-View-Reveals mit nativen Scroll-
// Timelines (animation-timeline: view()). Primär CSS-only mit automatischem
// JS-Fallback (useScrollProgress + rAF-Loop setzt custom properties), falls
// die Timeline-API nicht verfügbar ist. Jede Zeile/Block hat deterministische
// Verzögerung und Richtung (seededRandom). Kein Layout-Write pro Frame.
// Reduced Motion: alles sofort sichtbar.
// ---------------------------------------------------------------------------

export interface ScrollDrivenCssRevealProps {
  /** Zu enthüllende Zeilen/Blöcke. */
  items?: string[];
  /** Versatz-Richtung: 'up' | 'left' | 'right' | 'scale'. */
  direction?: 'up' | 'left' | 'right' | 'scale';
  /** Deterministischer Seed für Stagger. */
  seed?: number;
}

export function ScrollDrivenCssReveal({
  items = ['FORM FOLLOWS', 'FUNCTION', 'MOTION IS', 'MEANING'],
  direction = 'up',
  seed = 20260810,
}: ScrollDrivenCssRevealProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();
  const safeItems = items.length > 0 ? items.slice(0, 8) : ['NOX'];

  // Deterministische Stagger-Phasen pro Item (0..1).
  const phases = useRef(safeItems.map((_, i) => ((seed + i * 37) % 100) / 100));

  const supportsTimeline =
    typeof CSS !== 'undefined' && 'animationTimeline' in CSS;

  const progressRef = useScrollProgress(rootRef);

  // JS-Fallback: setzt pro Item custom properties --r0/--r1 als Reveal-Range.
  useRafLoop((_dt) => {
    if (reduced || supportsTimeline) return;
    const p = progressRef.current;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const phase = phases.current[i];
      const from = Math.max(0, p * 1.15 - phase * 0.35);
      const to = Math.min(1, from + 0.55);
      el.style.setProperty('--r0', String(from));
      el.style.setProperty('--r1', String(to));
    });
  }, true);

  // Reduced Motion: Items sofort sichtbar (CSS-Regel unten greift).
  useEffect(() => {
    if (!reduced) return;
    itemRefs.current.forEach((el) => el && el.classList.add('sdr-item--static'));
  }, [reduced]);

  const vars = {
    '--sdr-gold': NOX_COLORS.gold,
    '--sdr-dir': direction,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="sdr-root" style={vars}>
      <div className="sdr-list">
        {safeItems.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="sdr-item"
            style={{ '--sdr-phase': phases.current[i] } as CSSProperties}
          >
            <span>{item}</span>
          </div>
        ))}
      </div>
      <style>{`
.sdr-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(110% 90% at 50% 20%,#0d1019 0%,#06080c 75%)}
.sdr-list{display:flex;flex-direction:column;gap:0.4em;padding:8vh 6vw;width:100%}
.sdr-item{font:900 clamp(30px,7vw,74px)/1.02 system-ui;letter-spacing:-.03em;color:var(--sdr-gold);
  opacity:0;transform:translateY(2.4em);will-change:transform,opacity;
  animation:sdr-reveal linear both;animation-timeline:view();
  animation-range:entry 12% cover 44%}
.sdr-item span{display:inline-block;background:linear-gradient(90deg,#fff 0%,var(--sdr-gold) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes sdr-reveal{
  0%{opacity:0;transform:translateY(2.4em)}
  100%{opacity:1;transform:translateY(0)}
}
@supports not (animation-timeline: view()){
  .sdr-item{animation:none;opacity:calc(var(--r0, 1) * 1);transform:
    translateY(calc((1 - var(--r1, 0)) * 2.4em))}
  .sdr-item--static{opacity:1 !important;transform:none !important}
}
@media (prefers-reduced-motion:reduce){
  .sdr-item{animation:none;opacity:1;transform:none}
}
`}</style>
    </div>
  );
}

export default ScrollDrivenCssReveal;
