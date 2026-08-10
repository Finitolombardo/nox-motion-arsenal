import { useEffect, useRef, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ScrollSyncedTypoBackground — große Marken-Typografie rotiert subtil mit der
// Scrolltiefe. Primär CSS Scroll-Driven Animations (animation-timeline: view)
// mit automatischem JS-Fallback (useScrollProgress + transform im rAF-Loop),
// falls die Timeline-API fehlt. Zwei Text-Lagen (Gold + Kontur) drehen gegen-
// läufig — lesbar bleibt die Komposition immer, der Rotationsbereich ist eng.
// Reduced Motion: statische Typo.
// ---------------------------------------------------------------------------

export interface ScrollSyncedTypoBackgroundProps {
  /** Marken-Text (mehrzeilig via Array). */
  lines?: string[];
  /** Max. Rotation in Grad (4–24). */
  maxRotation?: number;
  /** Vertikaler Drift der Zeilen in % (0–40). */
  drift?: number;
  /** Abstand zwischen den Zeilen in em. */
  lineGap?: number;
  /** Kontur-Version der Typo anzeigen (zweite Lage). */
  showOutline?: boolean;
  /** Deterministischer Versatz zwischen den Zeilen (0–1). */
  seed?: number;
}

export function ScrollSyncedTypoBackground({
  lines = ['NOX', 'ARSENAL'],
  maxRotation = 10,
  drift = 18,
  lineGap = 0.16,
  showOutline = true,
  seed = 20260810,
}: ScrollSyncedTypoBackgroundProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  const safeRot = clamp(maxRotation, 4, 24);
  const safeDrift = clamp(drift, 0, 40);
  const safeGap = clamp(lineGap, 0, 0.6);
  const safeLines = lines.length > 0 ? lines.slice(0, 6) : ['NOX'];
  // Deterministische Gegenläufigkeit pro Zeile: abwechselnd +/-, mit leichtem
  // Versatz aus dem Seed (0..1 → Phase 0..1, so bleiben Muster reproduzierbar).
  const phases = useRef(safeLines.map((_, i) => (i % 2 === 0 ? 1 : -1) * (0.72 + ((seed + i * 7) % 29) / 100)));

  const progressRef = useScrollProgress(rootRef);

  // Feature-Erkennung: native CSS Scroll-Driven Timeline unterstützt?
  // (Chromium 115+). Fallback bleibt der rAF-Loop.
  const supportsTimeline = typeof CSS !== 'undefined' && 'animationTimeline' in CSS;

  useEffect(() => {
    // Bei Reduced Motion: Zeilen in neutrale Position bringen.
    if (!reduced) return;
    lineRefs.current.forEach((el) => {
      if (el) el.style.transform = 'translate3d(0,0,0) rotate(0deg)';
    });
  }, [reduced]);

  useRafLoop((_dt) => {
    if (reduced || supportsTimeline) return;
    const p = progressRef.current;
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const phase = phases.current[i];
      const rot = (p - 0.5) * 2 * safeRot * phase;
      const ty = ((p - 0.5) * 2 * safeDrift * 0.35 * phase) / 100;
      el.style.transform = `translate3d(0, ${ty * el.offsetHeight}px, 0) rotate(${rot}deg)`;
    });
  }, true);

  const vars = {
    '--sty-gold': NOX_COLORS.gold,
    '--sty-rot': `${safeRot}deg`,
    '--sty-drift': `${safeDrift}%`,
    '--sty-gap': `${safeGap}em`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="sty-root" style={vars} aria-hidden="true">
      <div className="sty-lines">
        {safeLines.map((line, i) => (
          <div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`sty-line ${showOutline && i % 2 === 1 ? 'sty-line--outline' : ''}`}
            style={{ animationDelay: `${((seed + i * 13) % 100) / 100 * -2}s` }}
          >
            {line}
          </div>
        ))}
      </div>
      <style>{`
.sty-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:linear-gradient(180deg,#080a0f 0%,#0b0e16 55%,#080a0f 100%)}
.sty-lines{display:flex;flex-direction:column;align-items:center;gap:var(--sty-gap);
  width:100%;padding:0 4vw;transform:translateY(var(--sty-drift))}
.sty-line{font:900 clamp(52px,13vw,150px)/0.86 system-ui;letter-spacing:-.045em;
  color:var(--sty-gold);text-align:center;white-space:nowrap;
  text-shadow:0 0 26px color-mix(in srgb,var(--sty-gold) 34%,transparent);
  will-change:transform}
.sty-line--outline{color:transparent;-webkit-text-stroke:1.5px
  color-mix(in srgb,var(--sty-gold) 62%,transparent);text-shadow:none;
  opacity:.72}
@supports (animation-timeline: view()){
  .sty-line{animation:sty-rotate linear both;animation-timeline:view();
    animation-range:entry 10% exit 90%}
  .sty-line--outline{animation-name:sty-rotate-rev}
}
@keyframes sty-rotate{
  0%{transform:translate3d(0,calc(var(--sty-drift) * .4),0) rotate(calc(var(--sty-rot) * -1))}
  100%{transform:translate3d(0,calc(var(--sty-drift) * -.4),0) rotate(var(--sty-rot))}
}
@keyframes sty-rotate-rev{
  0%{transform:translate3d(0,calc(var(--sty-drift) * .5),0) rotate(var(--sty-rot))}
  100%{transform:translate3d(0,calc(var(--sty-drift) * -.5),0) rotate(calc(var(--sty-rot) * -1))}
}
@media (prefers-reduced-motion:reduce){
  .sty-line{animation:none;transform:none}
  .sty-lines{transform:none}
}
`}</style>
    </div>
  );
}

export default ScrollSyncedTypoBackground;
