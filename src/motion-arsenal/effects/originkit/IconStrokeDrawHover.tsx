import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// IconStrokeDrawHover — NOX OriginKit DNA.
// Icons zeichnen sich beim Hover selbst: stroke-dasharray auf pathLength=1
// laesst den Strich als Anteil laufen, unabhaengig von der tatsaechlichen
// Pfadlaenge — ohne das muesste jede Kontur einzeln vermessen werden.
// Kein JS. Der Stagger im Raster ist ein Index-Faktor, kein Zufall.
// :focus-visible loest dasselbe aus wie :hover, damit der Effekt auch bei
// Tastaturbedienung sichtbar ist und nicht nur mit Maus existiert.
// ---------------------------------------------------------------------------

export interface IconStrokeDrawHoverProps {
  /** Tempo des Zeichnens. */
  speed?: number;
  /** Staerke des Glows. */
  glow?: number;
  /** Strichbreite. */
  stroke?: number;
  /** Farbe der Kontur. */
  color?: string;
  /** Beschriftungen unter den Icons. */
  showLabels?: boolean;
}

// Konturen mit je einem durchgehenden Pfad — so wirkt das Zeichnen wie ein
// Federstrich statt wie mehrere zuckende Teilstuecke.
const ICONS: { label: string; path: string }[] = [
  { label: 'Schild', path: 'M32 6 L54 15 V32 C54 44 44 54 32 58 C20 54 10 44 10 32 V15 Z' },
  { label: 'Blitz', path: 'M36 5 L16 35 H30 L26 59 L48 27 H34 Z' },
  { label: 'Kompass', path: 'M32 5 A27 27 0 1 1 31.9 5 M42 22 L36 36 L22 42 L28 28 Z' },
  { label: 'Ebenen', path: 'M32 8 L56 21 L32 34 L8 21 Z M8 32 L32 45 L56 32 M8 43 L32 56 L56 43' },
  { label: 'Ziel', path: 'M32 6 A26 26 0 1 1 31.9 6 M32 17 A15 15 0 1 1 31.9 17 M32 27 A5 5 0 1 1 31.9 27' },
  { label: 'Puls', path: 'M6 32 H20 L26 16 L34 48 L40 32 H58' },
];

export function IconStrokeDrawHover({
  speed = 1,
  glow = 0.5,
  stroke = 2,
  color = NOX_COLORS.gold,
  showLabels = true,
}: IconStrokeDrawHoverProps) {
  const glowAmount = clamp(glow, 0, 1);

  const style = {
    '--isd-color': color,
    '--isd-dur': `${(0.85 / clamp(speed, 0.1, 3)).toFixed(3)}s`,
    '--isd-stroke': clamp(stroke, 1, 4),
    '--isd-glow': `${(glowAmount * 8).toFixed(1)}px`,
    '--isd-glow-alpha': glowAmount.toFixed(2),
  } as React.CSSProperties;

  return (
    <div className="nox-isd" style={style}>
      <style>{CSS}</style>
      <ul className="nox-isd__grid">
        {ICONS.map((icon, index) => (
          <li key={icon.label} className="nox-isd__cell">
            <button
              type="button"
              className="nox-isd__item"
              style={{ '--isd-delay': `${(index % 3) * 0.05}s` } as React.CSSProperties}
              aria-label={icon.label}
            >
              <svg viewBox="0 0 64 64" className="nox-isd__svg" aria-hidden="true">
                <path d={icon.path} pathLength={1} />
              </svg>
              {showLabels && <span className="nox-isd__label">{icon.label}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CSS = String.raw`
.nox-isd { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-isd__grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; width:min(400px,100%); margin:0; padding:0; list-style:none; }
.nox-isd__cell { display:block; }
.nox-isd__item { display:grid; place-items:center; gap:7px; width:100%; padding:15px 8px; border:1px solid rgba(236,231,219,.08); border-radius:13px; background:rgba(255,255,255,.02); color:rgba(236,231,219,.4); font:inherit; cursor:pointer; transition:border-color .3s ease, background .3s ease, color .3s ease; }
.nox-isd__item:hover, .nox-isd__item:focus-visible { border-color:color-mix(in srgb, var(--isd-color) 42%, transparent); background:color-mix(in srgb, var(--isd-color) 6%, transparent); color:#f0ebe1; }
.nox-isd__item:focus-visible { outline:2px solid var(--isd-color); outline-offset:2px; }
.nox-isd__svg { width:38px; height:38px; overflow:visible; }
/* pathLength=1 macht den Strich zum Anteil — unabhaengig von der echten Laenge. */
.nox-isd__svg path { fill:none; stroke:var(--isd-color); stroke-width:calc(var(--isd-stroke) * 1px); stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; transition:stroke-dashoffset var(--isd-dur) cubic-bezier(.22,1,.36,1) var(--isd-delay); }
.nox-isd__item:hover .nox-isd__svg path,
.nox-isd__item:focus-visible .nox-isd__svg path { stroke-dashoffset:0; filter:drop-shadow(0 0 var(--isd-glow) color-mix(in srgb, var(--isd-color) calc(var(--isd-glow-alpha) * 100%), transparent)); }
.nox-isd__label { font-size:10px; letter-spacing:.16em; text-transform:uppercase; }
@media (prefers-reduced-motion:reduce) {
  .nox-isd__svg path { transition:none; stroke-dashoffset:0; }
  .nox-isd__item { transition:none; }
}
`;

export default IconStrokeDrawHover;
