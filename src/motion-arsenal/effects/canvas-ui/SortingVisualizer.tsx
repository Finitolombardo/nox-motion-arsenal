import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SortingVisualizer — deterministisch generierter Balken-Sortieralgorithmus
// (Bubble Sort) als Live-Visualisierung. Der Algorithmus läuft in Chunks
// (mehrere Vergleiche pro Frame, feste Dauer), das Array wird deterministisch
// aus dem Seed erzeugt. Aktive Elemente leuchten gold, sortierte Bereiche
// dimmen. Nur transform/opacity im rAF-Loop (Balken via flex-Basis + scaleY),
// kein Layout-Write pro Frame.
// Reduced Motion: statisches, fertig sortiertes Balkenbild.
// ---------------------------------------------------------------------------

export interface SortingVisualizerProps {
  /** Anzahl der Balken (12–80). */
  bars?: number;
  /** Sortier-Tempo (0.25–2, 1 = ~1s pro Durchlauf). */
  speed?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function SortingVisualizer({
  bars = 32,
  speed = 1,
  seed = 20260810,
}: SortingVisualizerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef({ done: false });
  const reduced = usePrefersReducedMotion();
  const safeBars = clamp(Math.round(bars), 12, 80);
  const safeSpeed = clamp(speed, 0.25, 2);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const base = useMemo(() => {
    return Array.from({ length: safeBars }, (_, i) => {
      // Deterministische "Fast-sortierte" Verteilung fürs Schöne.
      const noise = rng() * 0.55 + 0.15;
      const trend = 0.25 + 0.75 * (i / safeBars);
      return clamp(trend * noise, 0.08, 1);
    });
  }, [safeBars, rng]);

  // Bubble-Sort-Schritte vorberechnen (deterministisch).
  const steps = useMemo(() => {
    const arr = [...base];
    const out: Array<{ a: number; b: number; swap: boolean }> = [];
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          out.push({ a: j, b: j + 1, swap: true });
        } else {
          out.push({ a: j, b: j + 1, swap: false });
        }
      }
    }
    return out;
  }, [base]);

  const stepRef = useRef(0);
  useRafLoop((t) => {
    if (reduced) return;
    const s = stateRef.current;
    if (s.done) return;
    const step = stepRef.current;
    if (step >= steps.length) {
      s.done = true;
      return;
    }
    // Pro Frame 2 Schritte (Tempo-Skalierung).
    const perFrame = Math.max(1, Math.round(2 * safeSpeed));
    for (let k = 0; k < perFrame && stepRef.current < steps.length; k++) {
      const st = steps[stepRef.current];
      stepRef.current += 1;
      if (st.swap) {
        const a = barRefs.current[st.a];
        const b = barRefs.current[st.b];
        if (a && b) {
          const tmp = a.style.transform;
          a.style.transform = b.style.transform;
          b.style.transform = tmp;
        }
      }
    }
    // Highlight aktuelles Paar.
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = i === steps[stepRef.current]?.a || i === steps[stepRef.current]?.b ? '1' : '0.55';
    });
  }, true);

  const vars = {
    '--sv-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="sv-root" style={vars} aria-hidden="true">
      <div className="sv-stage">
        {base.map((v, i) => (
          <div
            key={i}
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="sv-bar"
            style={{ transform: `scaleY(${v})`, animationDelay: `${i * 0.02}s` }}
          />
        ))}
      </div>
      <p className="sv-hint">BUBBLE SORT</p>
      <style>{`
.sv-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.sv-stage{display:flex;align-items:flex-end;gap:3px;height:62%;width:88%;
  padding:8px;border:1px solid color-mix(in srgb,var(--sv-gold) 22%,transparent);
  border-radius:10px;background:rgba(255,255,255,.02)}
.sv-bar{flex:1;background:linear-gradient(180deg,var(--sv-gold),color-mix(in srgb,var(--sv-gold) 45%,#000));
  border-radius:2px 2px 0 0;transform-origin:bottom;opacity:.55;will-change:transform,opacity;
  animation:sv-in .5s ease-out backwards}
@keyframes sv-in{from{transform:scaleY(.02);opacity:0}}
.sv-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@media (prefers-reduced-motion:reduce){
  .sv-bar{animation:none;transform:scaleY(1)}
  .sv-hint{display:none}
}
`}</style>
    </div>
  );
}

export default SortingVisualizer;
