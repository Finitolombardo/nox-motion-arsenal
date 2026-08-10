import { type CSSProperties } from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// StrobeLightText — Strobe-Effekt auf Headline-Ebene: Der Text pulsiert mit
// hartem Ein/Aus (Strobe-Frequenz), dazwischen bleiben einzelne Zeichen
// deterministisch "stehen" (Lücken im Strobe-Rhythmus via seed). Reine CSS-
// Animation (steps()), kein rAF-Loop, kein Layout-Write. Achtung: Strobe
// kann bei lichtempfindlichen Personen Auslöser sein — deshalb Dauer-Strobe
// nur auf expliziten Trigger (Hover), sonst sanfter Puls. Reduced Motion:
// Text bleibt voll sichtbar.
// ---------------------------------------------------------------------------

export interface StrobeLightTextProps {
  /** Text. */
  text?: string;
  /** Strobe-Frequenz in Hz (0.5–12). */
  frequency?: number;
  /** Modus: 'pulse' (sanft, Default) | 'strobe' (hart, nur bei Interaktion). */
  mode?: 'pulse' | 'strobe';
  /** Deterministischer Seed für Zeichen-Lücken. */
  seed?: number;
}

export function StrobeLightText({
  text = 'STROBE',
  frequency = 4,
  mode = 'pulse',
  seed = 20260810,
}: StrobeLightTextProps) {
  const safeFreq = clamp(frequency, 0.5, 12);
  const chars = text.split('');
  const period = 1 / safeFreq;

  // Deterministische "Lücken": manche Zeichen stroben nicht mit (bleiben an).
  const gaps = chars.map((_, i) => ((seed + i * 31) % 7) === 0);

  const vars = {
    '--slt-gold': NOX_COLORS.gold,
    '--slt-period': `${period}s`,
    '--slt-mode': mode,
  } as CSSProperties;

  return (
    <div className="slt-root" style={vars} aria-hidden="true">
      <div className="slt-word">
        {chars.map((ch, i) => (
          <span key={i} className={`slt-char ${gaps[i] ? 'slt-char--gap' : ''}`}>
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </div>
      <p className="slt-hint">{mode === 'strobe' ? 'HOVER FOR STROBE' : 'AMBIENT PULSE'}</p>
      <style>{`
.slt-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.slt-word{display:flex;font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.02em;
  color:var(--slt-gold);text-shadow:0 0 30px color-mix(in srgb,var(--slt-gold) 40%,transparent)}
.slt-char{animation:slt-pulse calc(var(--slt-period) * 2) ease-in-out infinite;
  animation-delay:calc(var(--slt-period) * var(--slt-i, 0))}
.slt-char--gap{animation:none;opacity:.9}
.slt-hint{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@keyframes slt-pulse{
  0%,100%{opacity:1}
  50%{opacity:.12}
}
@media (prefers-reduced-motion:reduce){
  .slt-char{animation:none;opacity:1}
  .slt-hint{display:none}
}
.slt-root:hover .slt-char{animation-name:slt-strobe;animation-duration:var(--slt-period);
  animation-timing-function:steps(1,end)}
@keyframes slt-strobe{
  0%{opacity:1}
  50%{opacity:0}
  100%{opacity:1}
}
`}</style>
    </div>
  );
}

export default StrobeLightText;
