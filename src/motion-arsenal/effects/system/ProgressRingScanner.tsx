import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ProgressRingScanner — NOX System DNA.
// Fortschrittsring mit rotierendem Radar-Keil. Der Bogen ist ein SVG-Kreis mit
// stroke-dasharray auf pathLength=1, der Fortschritt also direkt als Anteil
// statt als errechneter Umfang — das bleibt korrekt, egal wie gross der Ring
// gerendert wird. Der Sweep ist ein conic-gradient, das rotiert; kein Canvas.
// Der Wert steht als role="progressbar" mit aria-valuenow im DOM, damit der
// Fortschritt nicht nur als Bogen existiert.
// ---------------------------------------------------------------------------

export interface ProgressRingScannerProps {
  /** Fortschritt von 0 bis 1. */
  progress?: number;
  /** Tempo des Radar-Sweeps. */
  speed?: number;
  /** Farbe von Bogen und Sweep. */
  color?: string;
  /** Durchmesser in px. */
  size?: number;
  /** Strichbreite des Rings. */
  thickness?: number;
  /** Prozentwert in der Mitte anzeigen. */
  showValue?: boolean;
  /** Beschriftung unter dem Wert. */
  label?: string;
}

export function ProgressRingScanner({
  progress = 0.64,
  speed = 1,
  color = NOX_COLORS.gold,
  size = 190,
  thickness = 6,
  showValue = true,
  label = 'SCAN',
}: ProgressRingScannerProps) {
  const value = clamp(progress, 0, 1);
  const diameter = clamp(size, 90, 400);
  const stroke = clamp(thickness, 2, 20);
  const percent = Math.round(value * 100);

  const style = {
    '--prs-color': color,
    '--prs-size': `${diameter}px`,
    '--prs-dur': `${(3.2 / clamp(speed, 0.1, 3)).toFixed(2)}s`,
  } as React.CSSProperties;

  return (
    <div className="nox-prs" style={style}>
      <style>{CSS}</style>
      <div
        className="nox-prs__ring"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Fortschritt'}
      >
        <span className="nox-prs__sweep" aria-hidden="true" />
        <svg viewBox="0 0 100 100" className="nox-prs__svg" aria-hidden="true">
          <circle className="nox-prs__track" cx="50" cy="50" r="44" strokeWidth={stroke} pathLength={1} />
          {/* pathLength=1 macht den Fortschritt zum direkten Anteil. */}
          <circle
            className="nox-prs__arc"
            cx="50"
            cy="50"
            r="44"
            strokeWidth={stroke}
            pathLength={1}
            strokeDasharray={`${value} 1`}
          />
        </svg>
        {showValue && (
          <div className="nox-prs__center">
            <strong>{percent}%</strong>
            {label && <span>{label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = String.raw`
.nox-prs { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-prs__ring { position:relative; width:var(--prs-size); height:var(--prs-size); }
.nox-prs__svg { position:relative; z-index:2; width:100%; height:100%; transform:rotate(-90deg); overflow:visible; }
.nox-prs__track { fill:none; stroke:rgba(236,231,219,.08); }
.nox-prs__arc { fill:none; stroke:var(--prs-color); stroke-linecap:round; filter:drop-shadow(0 0 5px color-mix(in srgb, var(--prs-color) 60%, transparent)); transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1); }
/* Radar-Keil: ein rotierendes conic-gradient, per Maske auf den Ring begrenzt. */
.nox-prs__sweep { position:absolute; inset:0; z-index:1; border-radius:50%; background:conic-gradient(from 0deg, color-mix(in srgb, var(--prs-color) 34%, transparent), transparent 42%); animation:nox-prs-sweep var(--prs-dur) linear infinite; }
@keyframes nox-prs-sweep { to { transform:rotate(360deg); } }
.nox-prs__center { position:absolute; inset:0; z-index:3; display:grid; place-content:center; justify-items:center; gap:3px; pointer-events:none; }
.nox-prs__center strong { font-size:calc(var(--prs-size) * .19); font-weight:740; letter-spacing:-.03em; color:#f2ece1; font-variant-numeric:tabular-nums; }
.nox-prs__center span { color:rgba(236,231,219,.36); font-size:9.5px; letter-spacing:.3em; }
@media (prefers-reduced-motion:reduce) {
  .nox-prs__sweep { animation:none; opacity:.35; }
  .nox-prs__arc { transition:none; }
}
`;

export default ProgressRingScanner;
