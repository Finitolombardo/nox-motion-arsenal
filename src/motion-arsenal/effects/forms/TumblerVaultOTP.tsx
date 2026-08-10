import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TumblerVaultOTP — mechanische OTP-Eingabe mit rollenden Ziffern: Jede
// Stelle ist ein "Ziffernrad" (transform-Rad mit 10 Positionen), das beim
// Tippen, bei Pfeiltasten oder Paste um den Delta-Wert weiterrollt (Federn-
// Kurve via CSS transition mit cubic-bezier). Keyboard: Ziffern 0–9,
// Backspace, Pfeiltasten, Enter (onComplete). Paste wird aufgeteilt.
// aria-label + verstecktes Input-Muster für Screenreader.
// Reduced Motion: Ziffern springen ohne Roll-Animation.
// ---------------------------------------------------------------------------

export interface TumblerVaultOTPProps {
  /** Anzahl der Stellen (4–8). */
  length?: number;
  /** Callback bei vollständiger Eingabe. */
  onComplete?: (code: string) => void;
  /** Deterministischer Startwert (Ziffern 0–9). */
  initial?: string;
}

export function TumblerVaultOTP({
  length = 6,
  onComplete,
  initial = '',
}: TumblerVaultOTPProps) {
  const safeLength = clamp(Math.round(length), 4, 8);
  const [digits, setDigits] = useState<string[]>(() => {
    const init = (initial || '').slice(0, safeLength);
    return Array.from({ length: safeLength }, (_, i) => init[i] ?? '');
  });
  const [active, setActive] = useState(0);
  const wheelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  // Wheel-Mapping: Ziffern 0–9 vertikal im Rad.
  const wheelHeight = 2.4; // em pro Ziffern-Slot
  const offsetFor = (d: string) => (d === '' ? 0 : -parseInt(d, 10) * wheelHeight);

  const commit = useCallback(
    (next: string[]) => {
      setDigits(next);
      const code = next.join('');
      if (code.length === safeLength) onComplete?.(code);
    },
    [safeLength, onComplete]
  );

  const setDigitAt = useCallback(
    (idx: number, ch: string) => {
      if (!/^\d$/.test(ch)) return;
      commit(digits.map((d, i) => (i === idx ? ch : d)));
      setActive((a) => Math.min(safeLength - 1, a + 1));
    },
    [digits, commit, safeLength]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        setDigitAt(active, e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        const next = [...digits];
        if (next[active]) next[active] = '';
        else if (active > 0) {
          next[active - 1] = '';
          setActive(active - 1);
        }
        commit(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((a) => Math.min(safeLength - 1, a + 1));
      } else if (e.key === 'Enter') {
        const code = digits.join('');
        if (code.length === safeLength) onComplete?.(code);
      }
    },
    [active, digits, commit, safeLength, onComplete, setDigitAt]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, safeLength);
      if (!txt) return;
      const next = digits.map((d, i) => txt[i] ?? d);
      commit(next);
      setActive(Math.min(safeLength - 1, txt.length));
    },
    [digits, commit, safeLength]
  );

  // Rad-Positionen aktualisieren (transform-Write, kein Layout pro Frame).
  useEffect(() => {
    wheelRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transform = `translateY(${offsetFor(digits[i])}em)`;
    });
  }, [digits]);

  const vars = {
    '--tw-gold': NOX_COLORS.gold,
    '--tw-wheel': `${wheelHeight}em`,
  } as CSSProperties;

  return (
    <div
      className="tw-root"
      style={vars}
      tabIndex={0}
      role="group"
      aria-label={`OTP-Eingabe, ${safeLength} Stellen`}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    >
      <div className="tw-wheels">
        {Array.from({ length: safeLength }, (_, i) => (
          <div
            key={i}
            className={`tw-wheel ${i === active ? 'tw-wheel--active' : ''} ${digits[i] ? '' : 'tw-wheel--empty'}`}
            onPointerDown={() => setActive(i)}
          >
            <div
              className="tw-reel"
              ref={(el) => {
                wheelRefs.current[i] = el;
              }}
              style={{
                transition: reduced
                  ? 'none'
                  : 'transform .5s cubic-bezier(.2,.9,.3,1.12)',
              }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="tw-digit">
                  {d}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="tw-hint">TYPE · PASTE · ARROWS</p>
      <style>{`
.tw-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);
  outline:none;cursor:text}
.tw-wheels{display:flex;gap:10px;padding:14px 16px;border:1px solid
  color-mix(in srgb,var(--tw-gold) 26%,transparent);border-radius:14px;
  background:rgba(255,255,255,.03);box-shadow:0 14px 40px rgba(0,0,0,.45)}
.tw-wheel{width:2.2em;height:2.6em;overflow:hidden;border-radius:8px;
  border:1px solid rgba(255,255,255,.08);background:#0b0e15;
  display:flex;align-items:center;justify-content:center;position:relative}
.tw-wheel--active{border-color:color-mix(in srgb,var(--tw-gold) 65%,transparent);
  box-shadow:0 0 18px color-mix(in srgb,var(--tw-gold) 22%,transparent)}
.tw-wheel--empty::after{content:'·';position:absolute;color:#5f5b52;font-size:1.4em}
.tw-reel{display:flex;flex-direction:column;will-change:transform}
.tw-digit{height:var(--tw-wheel);display:grid;place-items:center;
  font:700 1.3em/1 ui-monospace,monospace;color:#e8e6de}
.tw-wheel--active .tw-digit{color:var(--tw-gold)}
.tw-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
`}</style>
    </div>
  );
}

export default TumblerVaultOTP;
