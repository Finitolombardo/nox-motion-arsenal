import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// WordFadeReading — Wörter einer Passage faden mit der Scrolltiefe ein und
// aus (Reading-Highlight). Der Fokus wandert als "Lesezeile" durch den Text;
// aktive Wörter gold + scharf, Randbereich gedimmt. Deterministische Wort-
// Phasen (seeded), Steuerung im rAF-Loop per opacity/color (kein Layout).
// Reduced Motion: voller Text lesbar.
// ---------------------------------------------------------------------------

export interface WordFadeReadingProps {
  /** Passage (wird in Wörter zerlegt). */
  text?: string;
  /** Breite des Fokusbandes in Wörtern (3–9). */
  focusWidth?: number;
  /** Deterministischer Seed für die Wort-Phasen. */
  seed?: number;
}

export function WordFadeReading({
  text = 'MOTION IS THE LANGUAGE OF ATTENTION. EVERY FRAME CARRIES INTENT, EVERY TRANSITION TELLS THE NEXT CHAPTER.',
  focusWidth = 5,
  seed = 20260810,
}: WordFadeReadingProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  const words = useMemo(() => text.split(/\s+/).filter(Boolean).slice(0, 120), [text]);
  const safeFocus = clamp(Math.round(focusWidth), 3, 9);

  // Deterministische Wort-Phasen: jedes Wort bekommt eine Scroll-Position.
  const phases = useMemo(() => {
    const base = 1 / Math.max(1, words.length);
    return words.map((_, i) => base * (i + ((seed + i * 7) % 50) / 50));
  }, [words, seed]);

  const progressRef = useScrollProgress(rootRef);

  useRafLoop((_dt) => {
    if (reduced) return;
    const p = progressRef.current;
    const focusPos = p * 1.05;
    wordRefs.current.forEach((el, i) => {
      if (!el) return;
      const wp = phases[i];
      const dist = Math.abs(wp - focusPos);
      const active = dist < safeFocus * 0.02;
      const near = dist < safeFocus * 0.045;
      el.style.opacity = active ? '1' : near ? '0.55' : '0.14';
      el.style.color = active ? 'var(--wfr-gold)' : near ? '#cfc9bd' : '#6a6f7a';
    });
  }, true);

  const vars = {
    '--wfr-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="wfr-root" style={vars}>
      <div className="wfr-body">
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className="wfr-word"
          >
            {w}{' '}
          </span>
        ))}
      </div>
      <style>{`
.wfr-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  padding:10% 12%;background:radial-gradient(120% 90% at 50% 30%,#0c0f17,#06080c)}
.wfr-body{max-width:820px;font:400 clamp(17px,2.2vw,26px)/1.75 Georgia,serif;color:#6a6f7a;
  text-align:left;letter-spacing:.01em}
.wfr-word{transition:opacity .12s linear,color .12s linear;will-change:opacity,color}
@media (prefers-reduced-motion:reduce){
  .wfr-word{opacity:1 !important;color:#cfc9bd !important}
}
`}</style>
    </div>
  );
}

export default WordFadeReading;
