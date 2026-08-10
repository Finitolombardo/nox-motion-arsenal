import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SkeletonShimmerLoader — NOX System DNA.
// Ladeplatzhalter in vier Layouts. Der Shimmer ist ein ::after-Gradient, der
// per translateX über die Form fährt: eine Compositor-Transform statt einer
// background-position-Animation, die jeden Frame neu zeichnen müsste. Kein JS,
// kein rAF. Der ganze Block trägt aria-busy und einen Statustext für
// Screenreader — sonst wäre der Ladezustand rein visuell.
// ---------------------------------------------------------------------------

export interface SkeletonShimmerLoaderProps {
  /** Layout des Platzhalters. */
  variant?: 'card' | 'list' | 'avatar' | 'line';
  /** Tempo des Shimmers. */
  speed?: number;
  /** Grundfläche der Blöcke. */
  baseColor?: string;
  /** Farbe des Lichtstreifens. */
  shimmerColor?: string;
  /** Zeilen bzw. Einträge. */
  rows?: number;
  /** Eckenradius in px. */
  radius?: number;
}

export function SkeletonShimmerLoader({
  variant = 'card',
  speed = 1,
  baseColor = '#1a1a1e',
  shimmerColor = NOX_COLORS.gold,
  rows = 4,
  radius = 10,
}: SkeletonShimmerLoaderProps) {
  const count = clamp(Math.round(rows), 1, 12);
  const style = {
    '--sk-base': baseColor,
    '--sk-shimmer': shimmerColor,
    '--sk-dur': `${clamp(1.5 / clamp(speed, 0.1, 3), 0.2, 12).toFixed(2)}s`,
    '--sk-radius': `${clamp(radius, 0, 24)}px`,
  } as React.CSSProperties;

  return (
    <div className="nox-sk" style={style} aria-busy="true" aria-live="polite">
      <style>{CSS}</style>
      <span className="nox-sk__sr">Inhalte werden geladen</span>

      {variant === 'card' && (
        <div className="nox-sk__card">
          <div className="nox-sk__block nox-sk__media" />
          <div className="nox-sk__stack">
            {Array.from({ length: count }, (_, index) => (
              <div
                key={index}
                className="nox-sk__block nox-sk__line"
                style={{ width: `${lineWidth(index, count)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {variant === 'list' && (
        <div className="nox-sk__stack">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className="nox-sk__row">
              <div className="nox-sk__block nox-sk__dot" />
              <div className="nox-sk__stack nox-sk__stack--tight">
                <div className="nox-sk__block nox-sk__line" style={{ width: '62%' }} />
                <div className="nox-sk__block nox-sk__line nox-sk__line--sm" style={{ width: '38%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'avatar' && (
        <div className="nox-sk__row">
          <div className="nox-sk__block nox-sk__dot nox-sk__dot--lg" />
          <div className="nox-sk__stack nox-sk__stack--tight">
            {Array.from({ length: count }, (_, index) => (
              <div
                key={index}
                className="nox-sk__block nox-sk__line"
                style={{ width: `${lineWidth(index, count)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {variant === 'line' && (
        <div className="nox-sk__stack">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="nox-sk__block nox-sk__line"
              style={{ width: `${lineWidth(index, count)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Absteigende, aber nicht monotone Breiten — echte Textblöcke enden auch
// unterschiedlich. Rein aus dem Index, damit jeder Aufruf gleich aussieht.
function lineWidth(index: number, total: number) {
  if (index === total - 1) return 48;
  const pattern = [96, 88, 92, 78, 94, 84];
  return pattern[index % pattern.length];
}

const CSS = String.raw`
.nox-sk { display:grid; align-content:center; width:min(460px,100%); margin:0 auto; padding:clamp(16px,4vw,30px); font-family:var(--sans,system-ui,sans-serif); }
.nox-sk__sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
.nox-sk__card { display:grid; gap:14px; padding:16px; border-radius:calc(var(--sk-radius) + 5px); border:1px solid rgba(236,231,219,.07); background:rgba(255,255,255,.014); }
.nox-sk__stack { display:grid; gap:10px; }
.nox-sk__stack--tight { gap:7px; }
.nox-sk__row { display:flex; align-items:center; gap:13px; }
.nox-sk__row + .nox-sk__row { margin-top:13px; }
.nox-sk__block { position:relative; overflow:hidden; border-radius:var(--sk-radius); background:var(--sk-base); }
.nox-sk__media { height:118px; }
.nox-sk__line { height:11px; }
.nox-sk__line--sm { height:8px; }
.nox-sk__dot { flex:0 0 auto; width:38px; height:38px; border-radius:50%; }
.nox-sk__dot--lg { width:62px; height:62px; }
.nox-sk__stack--tight { flex:1 1 auto; }
/* Der Streifen ist breiter als die Form und fährt einmal pro Zyklus durch. */
.nox-sk__block::after { content:''; position:absolute; inset:0; background:linear-gradient(100deg, transparent 26%, color-mix(in srgb, var(--sk-shimmer) 17%, transparent) 50%, transparent 74%); transform:translateX(-100%); animation:nox-sk-sweep var(--sk-dur) linear infinite; }
@keyframes nox-sk-sweep { to { transform:translateX(100%); } }
@media (prefers-reduced-motion:reduce) {
  .nox-sk__block::after { animation:none; transform:none; background:color-mix(in srgb, var(--sk-shimmer) 7%, transparent); }
}
`;

export default SkeletonShimmerLoader;
