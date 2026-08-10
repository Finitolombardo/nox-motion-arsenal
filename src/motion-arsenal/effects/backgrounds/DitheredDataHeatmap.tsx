import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// DitheredDataHeatmap — dichtebasierte Heatmap im Bayer-Print-Look. Ein
// deterministisches Datenfeld (seededRandom) wird als Raster aus DOM-Zellen
// gezeichnet; die Intensität jeder Zelle steuert Farbe UND ein Bayer-Dither-
// Muster (4×4-Matrix als SVG <pattern>), das die Zelle je nach Schwelle
// teilweise füllt. Kein Canvas, kein Math.random, keine Animation pro Frame —
// reine Render-Ausgabe mit optionalem langsamen "Scan"-Effekt.
// ---------------------------------------------------------------------------

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface DitheredDataHeatmapProps {
  /** Spalten des Datenrasters (8–48). */
  cols?: number;
  /** Zeilen des Datenrasters (8–32). */
  rows?: number;
  /** Deterministischer Daten-Seed. */
  seed?: number;
  /** Kontrast der Dichte (0.2–1.5). */
  contrast?: number;
  /** Anteil "heißer" Zellen (0–1) für die Gold-Spitzen. */
  hotRatio?: number;
  /** Langsamer Scan-Balken anzeigen (rein dekorativ, CSS-only). */
  scanline?: boolean;
}

interface Cell {
  i: number;
  v: number;
  bayer: number;
  hot: boolean;
}

export function DitheredDataHeatmap({
  cols = 28,
  rows = 16,
  seed = 20260810,
  contrast = 1,
  hotRatio = 0.14,
  scanline = true,
}: DitheredDataHeatmapProps) {
  const c = clamp(Math.round(cols), 8, 48);
  const r = clamp(Math.round(rows), 8, 32);
  const safeContrast = clamp(contrast, 0.2, 1.5);
  const safeHot = clamp(hotRatio, 0, 0.5);

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministisches Datenfeld: Basis-Dichte + 2 weiche "Cluster" (Gauß-
  // artige Erhebungen), damit die Heatmap echte Struktur zeigt statt Rauschen.
  const field = useMemo(() => {
    const cx1 = rng() * c;
    const cy1 = rng() * r;
    const cx2 = rng() * c;
    const cy2 = rng() * r;
    const s1 = 1.6 + rng() * 2.2;
    const s2 = 1.2 + rng() * 2.6;
    const noise = Array.from({ length: c * r }, () => rng());
    return noise.map((n, i) => {
      const x = i % c;
      const y = Math.floor(i / c);
      const g1 = Math.exp(-(((x - cx1) ** 2) / (2 * s1 ** 2) + ((y - cy1) ** 2) / (2 * s1 ** 2)));
      const g2 = Math.exp(-(((x - cx2) ** 2) / (2 * s2 ** 2) + ((y - cy2) ** 2) / (2 * s2 ** 2)));
      return Math.min(1, Math.max(0, n * 0.45 + (g1 * 0.62 + g2 * 0.5) * safeContrast));
    });
  }, [c, r, rng, safeContrast]);

  const fieldMax = useMemo(() => Math.max(...field), [field]);

  const cells = useMemo<Cell[]>(() => {
    const hot = field.map((v) => v).sort((a, b) => b - a).slice(0, Math.max(1, Math.round(field.length * safeHot)));
    const hotSet = new Set(hot);
    return field.map((v, i) => ({
      i,
      v: fieldMax > 0 ? v / fieldMax : 0,
      bayer: BAYER_4[i % 4][Math.floor(i / c) % 4],
      hot: hotSet.has(v),
    }));
  }, [field, fieldMax, safeHot, c, r]);

  const vars = {
    '--ddh-gold': NOX_COLORS.gold,
    '--ddh-cols': `${c}`,
    '--ddh-rows': `${r}`,
  } as CSSProperties;

  return (
    <div className="ddh-root" style={vars} aria-hidden="true">
      <svg className="ddh-pattern" aria-hidden="true">
        <defs>
          <pattern id="ddh-bayer" width="4" height="4" patternUnits="userSpaceOnUse">
            {BAYER_4.flat().map((t, i) => (
              <rect key={i} x={i % 4} y={Math.floor(i / 4)} width="1" height="1" fill={t >= 8 ? 'currentColor' : 'none'} />
            ))}
          </pattern>
        </defs>
      </svg>
      <div className="ddh-grid">
        {cells.map((cell) => {
          const level = Math.round(cell.v * 15);
          const dither = cell.bayer < level;
          return (
            <div
              key={cell.i}
              className={`ddh-cell ${cell.hot ? 'ddh-cell--hot' : ''} ${dither ? 'ddh-cell--dither' : ''}`}
              style={{ opacity: 0.18 + cell.v * 0.82 }}
            />
          );
        })}
      </div>
      {scanline && <div className="ddh-scan" />}
      <style>{`
.ddh-root{position:absolute;inset:0;overflow:hidden;background:#07090d;color:var(--ddh-gold);
  display:grid;place-items:center;padding:6%}
.ddh-pattern{position:absolute;width:0;height:0}
.ddh-grid{display:grid;grid-template-columns:repeat(var(--ddh-cols),1fr);
  grid-template-rows:repeat(var(--ddh-rows),1fr);gap:1px;width:100%;height:100%;
  background:#0a0d13;border:1px solid color-mix(in srgb,var(--ddh-gold) 22%,transparent)}
.ddh-cell{background:var(--ddh-gold);box-shadow:0 0 6px color-mix(in srgb,var(--ddh-gold) 30%,transparent)}
.ddh-cell--hot{background:#ffd98a;box-shadow:0 0 10px color-mix(in srgb,#ffd98a 55%,transparent)}
.ddh-cell--dither{background:url(#ddh-bayer)}
.ddh-scan{position:absolute;inset-inline:0;height:3px;top:0;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--ddh-gold) 55%,transparent),transparent);
  animation:ddh-scan 7s ease-in-out infinite;pointer-events:none;opacity:.5}
@keyframes ddh-scan{0%{top:0}50%{top:calc(100% - 3px)}100%{top:0}}
@media (prefers-reduced-motion:reduce){.ddh-scan{display:none}}
`}</style>
    </div>
  );
}

export default DitheredDataHeatmap;
