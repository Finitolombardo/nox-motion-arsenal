import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// PathFollowHeroScroll — Hero folgt einer SVG-Kurve durch die Scroll-Choreo-
// grafie. Eine glatte Bézier-Kurve (deterministisch aus dem Seed) ist die
// "Schiene"; der Hero (Titel + Orbit) wandert per getPointAtLength() entlang
// der Kurve und rotiert dabei leicht. Kein Layout-Write pro Frame (nur
// transform auf 2 Elemente). Reduced Motion: Hero bleibt zentriert.
// ---------------------------------------------------------------------------

export interface PathFollowHeroScrollProps {
  /** Hero-Titel. */
  title?: string;
  /** Untertitel. */
  subtitle?: string;
  /** Kurven-Stil: 's' | 'wave' | 'loop' (deterministische Schiene). */
  curve?: 's' | 'wave' | 'loop';
  /** Deterministischer Seed für Kurven-Parameter. */
  seed?: number;
}

export function PathFollowHeroScroll({
  title = 'NOX MOTION',
  subtitle = 'SCROLL DRIVEN CHOREOGRAPHY',
  curve = 's',
  seed = 20260810,
}: PathFollowHeroScrollProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Kurve: Kontrollpunkte aus dem Seed, aber stets im
  // Sichtbereich (0..100). Die Schiene wird als Pfad gezeichnet (dekorativ).
  const pathD = useMemo(() => {
    const amp = 18 + rng() * 14;
    const mid = 42 + rng() * 16;
    if (curve === 'loop') {
      return `M -5,${50 + amp} C 25,${mid} 25,${100 - mid} 50,${50 + amp} C 75,${mid} 75,${100 - mid} 105,${50 - amp}`;
    }
    if (curve === 'wave') {
      return `M -5,${50 - amp} C 25,${100 - mid} 50,${mid} 75,${100 - mid} 105,${50 - amp}`;
    }
    return `M -5,${50 + amp} C 25,${50 - amp * 1.6} 75,${100 - 50 + amp * 1.6} 105,${50 - amp}`;
  }, [curve, rng]);

  const pathRef = useMemo(() => {
    // SVG-Pfad in einen Pfad-String für getPointAtLength (via <path>-Element).
    return pathD;
  }, [pathD]);

  const progressRef = useScrollProgress(rootRef);

  // Position entlang der Kurve per getPointAtLength — im rAF-Loop.
  useRafLoop((_dt) => {
    if (reduced) return;
    const p = progressRef.current;
    const hero = heroRef.current;
    if (!hero) return;
    // Pfad-Länge messen (einmalig) und Punkt interpolieren.
    const pathEl = document.querySelector<SVGPathElement>('#pfh-path');
    if (!pathEl) return;
    const len = pathEl.getTotalLength();
    const pt = pathEl.getPointAtLength(clamp(p, 0, 1) * len);
    const angle = curve === 'loop' ? Math.sin(p * Math.PI * 2) * 14 : Math.sin(p * Math.PI) * 10;
    hero.style.transform = `translate3d(${pt.x}%, ${pt.y}%, 0) rotate(${angle}deg)`;
  }, true);

  const vars = {
    '--pfh-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="pfh-root" style={vars}>
      <svg className="pfh-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path id="pfh-path" d={pathRef} fill="none" stroke="var(--pfh-gold)" strokeOpacity="0.28" strokeWidth="0.4" strokeDasharray="1.6 1.2" />
      </svg>
      <div ref={heroRef} className="pfh-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <style>{`
.pfh-root{position:absolute;inset:0;overflow:hidden;background:
  radial-gradient(110% 90% at 50% 20%,#0d1019,#06080c)}
.pfh-svg{position:absolute;inset:0;width:100%;height:100%}
.pfh-hero{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;
  will-change:transform;color:var(--pfh-gold)}
.pfh-hero h1{margin:0;font:900 clamp(38px,8vw,88px)/1 system-ui;letter-spacing:-.04em;
  text-shadow:0 0 34px color-mix(in srgb,var(--pfh-gold) 38%,transparent)}
.pfh-hero p{margin:0;font:11px ui-monospace,monospace;letter-spacing:.34em;color:#b9b2a2}
@media (prefers-reduced-motion:reduce){
  .pfh-hero{transform:translate(-50%,-50%) !important}
}
`}</style>
    </div>
  );
}

export default PathFollowHeroScroll;
