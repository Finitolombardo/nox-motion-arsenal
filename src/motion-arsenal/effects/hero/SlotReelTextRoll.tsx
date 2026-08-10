import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SlotReelTextRoll — Headline-Zeichen rollen wie Slot-Machine-Rollen aus dem
// Zufall in den finalen Text. Jeder Buchstabe liegt in einer Maske (overflow:
// hidden) und rollt per translateY von einem deterministischen Start-Offset
// (seededRandom → det()-PRNG) auf 0 — mit cubic-bezier + Overshoot. Start-
// Offsets und Delays sind deterministisch: gleicher Text + gleicher Seed =
// identische Choreografie. Reine CSS-Animation beim Mount, kein rAF-Loop.
// Reduced Motion: Text erscheint direkt.
// ---------------------------------------------------------------------------

export interface SlotReelTextRollProps {
  /** Text, der in die Rolle läuft. */
  text?: string;
  /** Roll-Dauer pro Zeichen in s (0.3–1.6). */
  duration?: number;
  /** Deterministischer Seed für Offsets/Delays. */
  seed?: number;
}

export function SlotReelTextRoll({
  text = 'JACKPOT',
  duration = 0.9,
  seed = 20260810,
}: SlotReelTextRollProps) {
  const safeDuration = clamp(duration, 0.3, 1.6);
  const chars = useMemo(() => text.split(''), [text]);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const rolls = useMemo(() => {
    return chars.map((_, i) => ({
      offset: (rng() * 8 + 3) * (rng() > 0.5 ? 1 : -1),
      delay: i * 0.055 + rng() * 0.12,
    }));
  }, [chars, rng]);

  const vars = {
    '--srt-gold': NOX_COLORS.gold,
    '--srt-duration': `${safeDuration}s`,
  } as CSSProperties;

  return (
    <div className="srt-root" style={vars} aria-hidden="true">
      <div className="srt-word">
        {chars.map((ch, i) => (
          <span key={i} className="srt-cell">
            <span
              className="srt-reel"
              style={{
                animationDuration: `${safeDuration}s`,
                animationDelay: `${rolls[i].delay}s`,
                '--srt-from': `${rolls[i].offset}em`,
              } as CSSProperties}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          </span>
        ))}
      </div>
      <style>{`
.srt-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.srt-word{display:flex;font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.02em}
.srt-cell{overflow:hidden;display:inline-block;line-height:1;padding-bottom:.08em;
  color:var(--srt-gold)}
.srt-reel{display:inline-block;will-change:transform;
  animation:srt-roll var(--srt-duration) cubic-bezier(.2,.9,.3,1.15) forwards;
  text-shadow:0 0 26px color-mix(in srgb,var(--srt-gold) 40%,transparent)}
@keyframes srt-roll{
  0%{transform:translateY(var(--srt-from, 4em))}
  100%{transform:translateY(0)}
}
@media (prefers-reduced-motion:reduce){
  .srt-reel{animation:none;transform:none !important}
}
`}</style>
    </div>
  );
}

export default SlotReelTextRoll;
