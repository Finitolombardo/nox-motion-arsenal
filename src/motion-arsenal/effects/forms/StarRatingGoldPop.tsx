import { useEffect, useRef, useState } from 'react';
import { clamp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// StarRatingGoldPop — NOX Forms DNA.
// Sterne-Bewertung mit Pop-Sequenz: Hover-Vorlauf füllt die Sterne, beim
// Auswählen springen sie deterministisch nacheinander mit Feder-Bounce auf
// (Stagger über --i) und der Score zählt im Label hoch. Als echte Radio-Group
// gebaut — Tastatur und Screenreader sehen die Auswahl (fieldset + legend,
// native inputs), nicht nur die Animation. Keine unseeded Zufallswerte, kein Canvas.
// ---------------------------------------------------------------------------

export interface StarRatingGoldPopProps {
  /** Aktueller Wert (0 = nichts gewählt). */
  value?: number;
  /** Anzahl Sterne (3–10). */
  max?: number;
  /** Stern-Größe in px (16–64). */
  size?: number;
  /** Pop-Animation beim Auswählen. */
  pop?: boolean;
  /** Gold-Ton der Sterne. */
  color?: string;
  /** Label unter/über den Sternen (leer = keins). */
  label?: string;
}

const STAR_PATH =
  'M12 2.4l2.93 5.94 6.57.95-4.75 4.63 1.12 6.54L12 17.37l-5.87 3.09 1.12-6.54-4.75-4.63 6.57-.95z';

export function StarRatingGoldPop({
  value = 3,
  max = 5,
  size = 32,
  pop = true,
  color = NOX_COLORS.gold,
  label = '',
}: StarRatingGoldPopProps) {
  const reduced = usePrefersReducedMotion();
  const safeMax = clamp(Math.round(max), 3, 10);
  const safeSize = clamp(size, 16, 64);
  const initial = clamp(Math.round(value), 0, safeMax);

  const [val, setVal] = useState(initial);
  const [hover, setHover] = useState(0);
  const [show, setShow] = useState(initial);
  const [flash, setFlash] = useState(false);
  const lastValRef = useRef(initial);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Externe value-Prop (PropsPanel) nachziehen — nur bei echtem Wechsel.
  useEffect(() => {
    const next = clamp(Math.round(value), 0, safeMax);
    if (next !== lastValRef.current) {
      lastValRef.current = next;
      setVal(next);
      setShow(next);
    }
  }, [value, safeMax]);

  const effective = hover > 0 ? hover : val;

  const commit = (next: number) => {
    if (next === lastValRef.current) return;
    lastValRef.current = next;
    setVal(next);
    if (pop && !reduced) {
      // Pop-Sequenz neu starten: alle gefüllten Sterne springen mit
      // deterministischem Stagger (--i) nacheinander auf; Klasse wird nach
      // Animationsdauer entfernt, damit der nächste Klick neu triggert.
      window.clearTimeout(flashTimer.current);
      setFlash(true);
      flashTimer.current = window.setTimeout(() => setFlash(false), 650);
    }
    setShow(next);
  };

  // Score-Count-up — kurzer rAF nur bei Wert-Änderung, stoppt danach.
  useRafLoop((_dt, elapsed) => {
    const from = show;
    const to = val;
    if (from === to) return;
    const t = Math.min(elapsed / 450, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    setShow(from + (to - from) * eased);
  }, show !== val);

  const fill = (i: number) => (effective >= i ? 1 : 0);

  return (
    <div className="srgp-root" style={{ '--srgp-color': color, '--srgp-size': `${safeSize}px` } as React.CSSProperties}>
      <fieldset className="srgp-field">
        {label ? <legend className="srgp-legend">{label}</legend> : null}
        <div
          className="srgp-row"
          role="radiogroup"
          aria-label={label || 'Bewertung'}
          onMouseLeave={() => setHover(0)}
        >
          {Array.from({ length: safeMax }, (_, i) => {
            const n = i + 1;
            const filled = fill(n) === 1;
            return (
              <span key={n} className={`srgp-item${filled && flash ? ' srgp-pop' : ''}`}>
                <input
                  className="srgp-input"
                  type="radio"
                  name="srgp-rating"
                  id={`srgp-${n}`}
                  value={n}
                  checked={val === n}
                  onChange={() => commit(n)}
                  onFocus={() => setHover(n)}
                  onBlur={() => setHover(0)}
                  aria-label={`${n} von ${safeMax} Sternen`}
                />
                <label
                  className="srgp-star"
                  htmlFor={`srgp-${n}`}
                  style={{ '--i': i } as React.CSSProperties}
                  onMouseEnter={() => setHover(n)}
                >
                  <svg viewBox="0 0 24 24" className="srgp-svg" aria-hidden="true">
                    <path
                      className="srgp-outline"
                      d={STAR_PATH}
                      fill={filled ? 'var(--srgp-color)' : 'transparent'}
                      stroke={filled ? 'var(--srgp-color)' : 'rgba(240,236,228,0.34)'}
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </label>
              </span>
            );
          })}
        </div>
      </fieldset>
      <output className="srgp-score" aria-live="polite">
        {Math.round(show)}<span className="srgp-total"> / {safeMax}</span>
      </output>
      <style>{`
.srgp-root{display:inline-flex;flex-direction:column;gap:10px;align-items:center;font-family:var(--sans,sans-serif)}
.srgp-field{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;align-items:center}
.srgp-legend{padding:0;font:700 10px/1 var(--mono,monospace);letter-spacing:.16em;text-transform:uppercase;color:rgba(240,236,228,.46);margin-bottom:2px}
.srgp-row{display:flex;gap:6px;padding:6px;border-radius:14px;background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.06)}
.srgp-item{position:relative;display:flex}
.srgp-input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.srgp-input:focus-visible + .srgp-star{outline:2px solid var(--srgp-color);outline-offset:3px;border-radius:8px}
.srgp-star{display:flex;cursor:pointer;padding:2px;--i:0}
.srgp-svg{width:var(--srgp-size);height:var(--srgp-size);display:block;
  filter:drop-shadow(0 0 6px color-mix(in srgb, var(--srgp-color) 30%, transparent));
  transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
.srgp-star:hover .srgp-svg{transform:scale(1.14)}
.srgp-item.srgp-pop .srgp-svg{animation:srgpPop .52s cubic-bezier(.34,1.56,.64,1) calc(var(--i) * 60ms) both}
.srgp-score{font:800 13px/1 var(--mono,monospace);letter-spacing:.08em;color:var(--srgp-color);
  min-width:56px;text-align:center;text-shadow:0 0 14px color-mix(in srgb, var(--srgp-color) 45%, transparent)}
.srgp-total{color:rgba(240,236,228,.38);font-weight:600}
@keyframes srgpPop{
  0%{transform:scale(.4)}
  60%{transform:scale(1.28)}
  100%{transform:scale(1)}
}
@media (prefers-reduced-motion:reduce){
  .srgp-star:hover .srgp-svg{transform:none}
  .srgp-item.srgp-pop .srgp-svg{animation:none}
}
@media (max-width:640px){
  .srgp-row{gap:2px}
  .srgp-star{padding:4px}
}
`}</style>
    </div>
  );
}

export default StarRatingGoldPop;
