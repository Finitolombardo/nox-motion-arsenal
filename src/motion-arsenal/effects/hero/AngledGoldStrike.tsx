import { useMemo } from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// AngledGoldStrike — schräger Gold-Durchstrich, der über den Text wischt.
// Pure CSS (transition/scaleX-Keyframes, kein RAF, keine JS-Animation):
// Hover-/Fokus-Strike oder Auto-Sweep-Loop pro Zeile mit deterministischem
// Stagger. Referenz-Mechanik: „Bottom-to-Top Angled Text Strikethrough Effect
// in Pure CSS" (codemyui) — eigene NOX-Variante mit Gold-Gradient und
// Controllable `struck`-Prop.
// ---------------------------------------------------------------------------

export interface AngledGoldStrikeProps {
  lines?: string[];
  /** Gold-Farbe des Strike-Gradienten (hex). */
  color?: string;
  /** Winkel des Durchstrichs -20..20 Grad (geclampt). */
  angle?: number;
  /** Strichstärke 1..8 px (geclampt). */
  thickness?: number;
  /** Geschwindigkeit 0.1..3 (geclampt) — skaliert transition/animation. */
  speed?: number;
  /** 'hover' = Strike zeichnet bei Hover/Fokus · 'auto' = Endlos-Sweep. */
  trigger?: 'hover' | 'auto';
  /** Kontrollierter Zustand: erzwingt dauerhaft durchgestrichen. */
  struck?: boolean;
}

export function AngledGoldStrike({
  lines = ['NOX MOTION ARSENAL'],
  color = NOX_COLORS.gold,
  angle = -7,
  thickness = 3,
  speed = 1,
  trigger = 'hover',
  struck = false,
}: AngledGoldStrikeProps) {
  const reduced = usePrefersReducedMotion();

  // Props mit Clamping — keine unkontrollierten Werte in CSS-Vars.
  const ang = clamp(angle, -20, 20);
  const thick = clamp(thickness, 1, 8);
  const sp = clamp(speed, 0.1, 3);

  const durations = useMemo(
    () =>
      lines.map((_, i) => ({
        transitionMs: Math.round(0.9 * sp * 1000), // Sekunden × 1000 → ms
        delayMs: Math.round(i * 0.9 * sp * 1000),
      })),
    [lines, sp],
  );

  // Bei Reduced Motion nur statisch sichtbar, wenn kontrolliert gestrichen;
  // die Media-Query im Stylesheet ist das zusätzliche Sicherheitsnetz.
  const showLine = struck || !reduced;

  const gradient = `linear-gradient(90deg, transparent 0%, ${color} 28%, #ffe9b0 50%, ${color} 72%, transparent 100%)`;

  return (
    <div
      className={`ags-root${struck ? ' ags-struck' : ''}${trigger === 'auto' ? ' ags-auto' : ''}`}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '0.55em',
        overflow: 'hidden',
        padding: '0 8%',
        background: `radial-gradient(120% 95% at 50% 115%, #14100a 0%, ${NOX_COLORS.bg} 62%)`,
      }}
    >
      <style>{`
        .ags-line {
          position: absolute;
          left: -6%;
          right: -6%;
          top: 50%;
          height: var(--ags-thick);
          border-radius: 999px;
          background: var(--ags-gradient);
          filter: drop-shadow(0 0 8px var(--ags-color));
          transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0);
          transform-origin: 0% 50%;
          pointer-events: none;
        }
        .ags-root:hover .ags-line,
        .ags-root:focus-visible .ags-line,
        .ags-root.ags-struck .ags-line {
          transform: rotate(var(--ags-angle)) translateY(0) scaleX(1);
        }
        .ags-root.ags-auto .ags-line {
          animation: ags-sweep calc(var(--ags-sp) * 2400ms) ease-in-out var(--ags-delay) infinite;
        }
        .ags-root.ags-auto.ags-struck .ags-line {
          animation: none;
        }
        @keyframes ags-sweep {
          0%   { transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0); }
          38%  { transform: rotate(var(--ags-angle)) translateY(0) scaleX(1); }
          58%  { transform: rotate(var(--ags-angle)) translateY(0) scaleX(1); }
          100% { transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0); }
        }
        @media (max-width: 520px) {
          .ags-line-wrap { font-size: 15px !important; letter-spacing: 0.06em !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ags-line { animation: none !important; transition: none !important; }
          .ags-root:not(.ags-struck) .ags-line {
            transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0) !important;
          }
          .ags-root.ags-struck .ags-line {
            transform: rotate(var(--ags-angle)) translateY(0) scaleX(1) !important;
          }
        }
      `}</style>

      {lines.map((line, i) => {
        const dur = durations[i] ?? durations[0];
        return (
          <div
            key={`${line}-${i}`}
            className="ags-line-wrap"
            style={{
              position: 'relative',
              fontFamily: 'var(--display, inherit)',
              fontSize: 'clamp(22px, 4.6vw, 52px)',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1.35,
              color: NOX_COLORS.text,
              whiteSpace: 'nowrap',
              ['--ags-angle' as string]: `${ang}deg`,
              ['--ags-thick' as string]: `${thick}px`,
              ['--ags-color' as string]: color,
              ['--ags-gradient' as string]: gradient,
              ['--ags-sp' as string]: sp.toFixed(2),
              ['--ags-delay' as string]: `${(dur.delayMs / 1000).toFixed(2)}s`,
            }}
          >
            {line}
            {showLine && (
              <span
                aria-hidden
                className="ags-line"
                style={{
                  transition: `transform ${dur.transitionMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AngledGoldStrike;
