import { useMemo } from 'react';
import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// BarcodeScanLine — NOX System DNA.
// Barcode mit wanderndem Laser: die Streifen sind ein repeating-linear-gradient,
// die Scanlinie faehrt per translateY darueber, der Beep ist ein skalierender
// Ring. Alles CSS, kein Canvas.
// Die Streifenbreiten kommen aus einem seeded PRNG, damit derselbe Code immer
// gleich aussieht — ein Barcode, der bei jedem Rendern anders ist, wirkt wie
// ein Fehler.
// ---------------------------------------------------------------------------

export interface BarcodeScanLineProps {
  /** Tempo des Scans. */
  speed?: number;
  /** Beep-Puls am Rand. */
  beep?: boolean;
  /** Farbe von Laser und Puls. */
  color?: string;
  /** Anzahl der Streifen. */
  bars?: number;
  /** Nummer unter dem Code (leer = keine). */
  code?: string;
  /** Seed fuer das Streifenmuster. */
  seed?: number;
}

function det(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function BarcodeScanLine({
  speed = 1,
  beep = true,
  color = NOX_COLORS.gold,
  bars = 42,
  code = '4 018 293 771 204',
  seed = 11,
}: BarcodeScanLineProps) {
  const count = clamp(Math.round(bars), 12, 90);

  // Streifen als Gradient-Stops: abwechselnd Strich und Luecke mit
  // deterministisch schwankender Breite.
  const gradient = useMemo(() => {
    const stops: string[] = [];
    let position = 0;
    for (let i = 0; i < count; i += 1) {
      const width = 0.6 + det(i, seed) * 2.4;
      const gap = 0.5 + det(i, seed + 31) * 1.6;
      stops.push(`transparent ${position.toFixed(2)}%`);
      stops.push(`#e9e3d6 ${position.toFixed(2)}%`);
      position += width;
      stops.push(`#e9e3d6 ${position.toFixed(2)}%`);
      stops.push(`transparent ${position.toFixed(2)}%`);
      position += gap;
    }
    // Auf 100 % normalisieren, damit der Code die Flaeche exakt fuellt.
    const scale = 100 / position;
    return `linear-gradient(90deg, ${stops
      .map((stop) => {
        const [colorPart, percent] = stop.split(' ');
        return `${colorPart} ${(parseFloat(percent) * scale).toFixed(2)}%`;
      })
      .join(', ')})`;
  }, [count, seed]);

  const style = {
    '--bsl-color': color,
    '--bsl-dur': `${(2.4 / clamp(speed, 0.3, 3)).toFixed(2)}s`,
    '--bsl-bars': gradient,
  } as React.CSSProperties;

  return (
    <div className="nox-bsl" style={style}>
      <style>{CSS}</style>
      <div className="nox-bsl__unit">
        <div className="nox-bsl__code" role="img" aria-label={code ? `Barcode ${code}` : 'Barcode'}>
          <span className="nox-bsl__bars" aria-hidden="true" />
          <span className="nox-bsl__laser" aria-hidden="true" />
        </div>
        {code && <span className="nox-bsl__digits">{code}</span>}
        {beep && <span className="nox-bsl__beep" aria-hidden="true" />}
      </div>
    </div>
  );
}

const CSS = String.raw`
.nox-bsl { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,36px); font-family:var(--mono,monospace); }
.nox-bsl__unit { position:relative; display:grid; gap:9px; justify-items:center; width:min(320px,86%); }
.nox-bsl__code { position:relative; width:100%; height:104px; overflow:hidden; border-radius:6px; background:#0c0b0d; }
.nox-bsl__bars { position:absolute; inset:9px 10px; background-image:var(--bsl-bars); }
/* Die Linie faehrt ueber die volle Hoehe und traegt ihren Glow selbst. */
.nox-bsl__laser { position:absolute; left:0; right:0; height:2px; background:var(--bsl-color); box-shadow:0 0 9px var(--bsl-color), 0 0 26px color-mix(in srgb, var(--bsl-color) 65%, transparent); animation:nox-bsl-scan var(--bsl-dur) linear infinite; }
@keyframes nox-bsl-scan { 0% { transform:translateY(0); } 100% { transform:translateY(104px); } }
.nox-bsl__digits { color:rgba(236,231,219,.42); font-size:11px; letter-spacing:.28em; }
.nox-bsl__beep { position:absolute; top:-7px; right:-7px; width:11px; height:11px; border-radius:50%; background:var(--bsl-color); box-shadow:0 0 10px var(--bsl-color); animation:nox-bsl-beep var(--bsl-dur) ease-out infinite; }
@keyframes nox-bsl-beep { 0%, 84% { transform:scale(.6); opacity:.28; } 90% { transform:scale(1.5); opacity:1; } 100% { transform:scale(.6); opacity:.28; } }
@media (prefers-reduced-motion:reduce) {
  .nox-bsl__laser { animation:none; top:50%; }
  .nox-bsl__beep { animation:none; opacity:.5; }
}
`;

export default BarcodeScanLine;
