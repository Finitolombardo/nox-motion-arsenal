import { useMemo } from 'react';
import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// WarpTunnelDepth — NOX Backgrounds DNA.
// Lichtstreifen rasen aus der Bildmitte nach aussen und erzeugen einen Tunnel
// aus drei Tiefenebenen. Jeder Streifen ist ein DOM-Element mit eigenen
// CSS-Variablen fuer Winkel, Startabstand und Dauer — alles deterministisch aus
// einem Seed, damit derselbe Hintergrund immer gleich aussieht.
// Kein Canvas und kein rAF: die Bewegung sind reine transform-Keyframes, die
// der Compositor uebernimmt. Die Schicht ist dekorativ und traegt aria-hidden.
// ---------------------------------------------------------------------------

export interface WarpTunnelDepthProps {
  /** Anzahl der Streifen. */
  streaks?: number;
  /** Tempo des Flugs. */
  speed?: number;
  /** Laenge der Streifen. */
  streakLength?: number;
  /** Farbe der Streifen. */
  color?: string;
  /** Zweite Farbe fuer die ferne Ebene. */
  deepColor?: string;
  /** Leuchten in der Fluchtpunktmitte. */
  coreGlow?: boolean;
  /** Seed fuer Winkel und Verteilung. */
  seed?: number;
}

function det(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function WarpTunnelDepth({
  streaks = 70,
  speed = 1,
  streakLength = 1,
  color = NOX_COLORS.gold,
  deepColor = '#8ab4ff',
  coreGlow = true,
  seed = 9,
}: WarpTunnelDepthProps) {
  const total = clamp(Math.round(streaks), 10, 200);
  const tempo = clamp(speed, 0.1, 3);
  const length = clamp(streakLength, 0.3, 3);

  const items = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => {
        // Drei Ebenen: nah fliegt schnell und gross, fern langsam und klein.
        const layer = i % 3;
        const depthScale = [1, 0.7, 0.45][layer];
        return {
          angle: det(i, seed) * 360,
          start: 4 + det(i, seed + 13) * 16,
          duration: (2.6 + det(i, seed + 29) * 2.4) / (tempo * depthScale),
          delay: -det(i, seed + 47) * 5,
          thickness: (1 + det(i, seed + 61) * 1.8) * depthScale,
          length: (14 + det(i, seed + 83) * 26) * length * depthScale,
          layer,
        };
      }),
    [total, tempo, length, seed],
  );

  const style = {
    '--wtd-color': color,
    '--wtd-deep': deepColor,
  } as React.CSSProperties;

  return (
    <div className="nox-wtd" style={style}>
      <style>{CSS}</style>
      <div className="nox-wtd__field" aria-hidden="true">
        {items.map((item, index) => (
          <span
            key={index}
            className={`nox-wtd__streak is-layer-${item.layer}`}
            style={
              {
                '--wtd-angle': `${item.angle.toFixed(2)}deg`,
                '--wtd-start': `${item.start.toFixed(2)}%`,
                '--wtd-dur': `${item.duration.toFixed(3)}s`,
                '--wtd-delay': `${item.delay.toFixed(3)}s`,
                '--wtd-w': `${item.thickness.toFixed(2)}px`,
                '--wtd-len': `${item.length.toFixed(1)}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      {coreGlow && <span className="nox-wtd__core" aria-hidden="true" />}
      <span className="nox-wtd__vignette" aria-hidden="true" />
    </div>
  );
}

const CSS = String.raw`
.nox-wtd { position:relative; width:100%; height:100%; overflow:hidden; background:radial-gradient(ellipse 60% 60% at 50% 50%, #0a0c14, #040406 72%); }
.nox-wtd__field { position:absolute; inset:0; }
/* Jeder Streifen wird um den Mittelpunkt gedreht und faehrt dann nach aussen —
   dadurch entsteht der Fluchtpunkt ohne 3D-Rechnung. */
.nox-wtd__streak { position:absolute; top:50%; left:50%; width:var(--wtd-w); height:var(--wtd-len); border-radius:999px; transform-origin:50% 0; background:linear-gradient(180deg, transparent, var(--wtd-color)); animation:nox-wtd-fly var(--wtd-dur) linear var(--wtd-delay) infinite; }
.nox-wtd__streak.is-layer-2 { background:linear-gradient(180deg, transparent, var(--wtd-deep)); opacity:.5; }
.nox-wtd__streak.is-layer-1 { opacity:.75; }
@keyframes nox-wtd-fly {
  0%   { transform:rotate(var(--wtd-angle)) translateY(var(--wtd-start)) scaleY(.35); opacity:0; }
  14%  { opacity:1; }
  100% { transform:rotate(var(--wtd-angle)) translateY(88vmax) scaleY(1); opacity:0; }
}
.nox-wtd__core { position:absolute; top:50%; left:50%; width:130px; height:130px; transform:translate(-50%,-50%); border-radius:50%; pointer-events:none; background:radial-gradient(circle, color-mix(in srgb, var(--wtd-color) 55%, transparent), transparent 68%); filter:blur(18px); }
.nox-wtd__vignette { position:absolute; inset:0; pointer-events:none; box-shadow:inset 0 0 130px 34px rgb(0 0 0 / .8); }
@media (prefers-reduced-motion:reduce) {
  .nox-wtd__streak { animation:none; opacity:.32; transform:rotate(var(--wtd-angle)) translateY(calc(var(--wtd-start) * 3)); }
}
`;

export default WarpTunnelDepth;
