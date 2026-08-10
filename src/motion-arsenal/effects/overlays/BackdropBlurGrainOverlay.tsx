import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// BackdropBlurGrainOverlay — Material-Overlay aus Backdrop Blur, statischem
// SVG-Grain (feTurbulence als data-URI) und Goldkante. Fängt Pointer-
// Interaktion ab (dekoratives Overlay), blur + grain sind rein statisch —
// kein rAF, keine Per-Frame-Writes. Reduced Motion: identisch (statisch).
// ---------------------------------------------------------------------------

export interface BackdropBlurGrainOverlayProps {
  /** Blur in px (2–20). */
  blur?: number;
  /** Grain-Intensität (0–1). */
  grain?: number;
  /** Goldkante sichtbar. */
  goldEdge?: boolean;
  /** Deterministischer Seed. */
  seed?: number;
}

export function BackdropBlurGrainOverlay({
  blur = 8,
  grain = 0.5,
  goldEdge = true,
  seed = 20260810,
}: BackdropBlurGrainOverlayProps) {
  const safeBlur = clamp(blur, 2, 20);
  const safeGrain = clamp(grain, 0, 1);

  // Deterministisches SVG-Grain (feTurbulence) als data-URI.
  const grainURI = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed % 1000}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [seed]);

  const vars = {
    '--bbg-gold': NOX_COLORS.gold,
    '--bbg-blur': `${safeBlur}px`,
    '--bbg-grain-opacity': String(safeGrain),
  } as CSSProperties;

  return (
    <div className="bbg-root" style={vars} aria-hidden="true">
      <div className="bbg-blur" />
      <div className="bbg-grain" style={{ backgroundImage: grainURI }} />
      {goldEdge && <div className="bbg-edge" />}
      <style>{`
.bbg-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.bbg-blur{position:absolute;inset:-30px;backdrop-filter:blur(var(--bbg-blur));
  -webkit-backdrop-filter:blur(var(--bbg-blur))}
.bbg-grain{position:absolute;inset:0;opacity:var(--bbg-grain-opacity);
  background-repeat:repeat;mix-blend-mode:overlay}
.bbg-edge{position:absolute;inset:0;pointer-events:none;border:1px solid
  color-mix(in srgb,var(--bbg-gold) 34%,transparent);
  box-shadow:inset 0 0 40px color-mix(in srgb,var(--bbg-gold) 10%,transparent)}
`}</style>
    </div>
  );
}

export default BackdropBlurGrainOverlay;
