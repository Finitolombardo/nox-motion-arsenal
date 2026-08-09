import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// BokehGoldField — NOX Signature Background DNA.
// Tiefenunscharfe Gold-Kreise (Bokeh) driften in drei Schärfe-Ebenen durch den
// dunklen Grund. Komplett CSS-only: radial-gradient-Scheiben, Blur pro Ebene
// (nicht pro Element), transform-Keyframes mit deterministischen
// Positionen/Radien/Dauern aus seededRandom. Kein Canvas, kein JS pro Frame,
// keine unseeded Zufallswerte.
// ---------------------------------------------------------------------------

export interface BokehGoldFieldProps {
  /** Anzahl Bokeh-Scheiben gesamt (4–16). */
  count?: number;
  /** Drift-Tempo (0.1–3). */
  speed?: number;
  /** Schärfe-Tiefe: 0 = alle Ebenen gleich scharf, 1 = maximale Tiefenunschärfe. */
  focus?: number;
  /** Gold-Ton der Scheiben. */
  color?: string;
  /** Seed für die deterministische Feld-Layout. */
  seed?: number;
}

interface BokehLayer {
  name: string;
  /** Basis-Größenfaktor der Ebene. */
  scale: number;
  /** Basis-Bewegungsfaktor (nah = schneller, fern = langsamer). */
  motion: number;
  /** Basis-Opazität (fern = blasser). */
  opacity: number;
}

const LAYERS: BokehLayer[] = [
  { name: 'near', scale: 1, motion: 1, opacity: 0.9 },
  { name: 'mid', scale: 0.68, motion: 0.62, opacity: 0.65 },
  { name: 'far', scale: 0.42, motion: 0.36, opacity: 0.4 },
];

export function BokehGoldField({
  count = 10,
  speed = 1,
  focus = 0.5,
  color = NOX_COLORS.gold,
  seed = 20260808,
}: BokehGoldFieldProps) {
  const safeCount = clamp(Math.round(count), 4, 16);
  const safeSpeed = clamp(speed, 0.1, 3);
  const safeFocus = clamp(focus, 0, 1);

  const rnd = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Feld-Layout: Position, Radius, Drift-Dauer, Ebenen-Zugehörigkeit.
  const orbs = useMemo(() => {
    const perLayer = Math.ceil(safeCount / LAYERS.length);
    return LAYERS.map((layer, li) => {
      const from = li * perLayer;
      const to = Math.min(from + perLayer, safeCount);
      const items = Array.from({ length: Math.max(0, to - from) }, (_, k) => {
        const i = from + k;
        return {
          x: rnd() * 100,
          y: rnd() * 100,
          // Scheiben-Größe: Ebene bestimmt Grundgröße, rnd die Streuung.
          r: Math.round((9 + rnd() * 17) * layer.scale),
          // Drift-Dauer: Ebene + individuelle Variation (8–22 s Basis, /10 gerundet für saubere Werte).
          d: Math.round(((8 + rnd() * 14) * 1000) / (layer.motion * safeSpeed) / 10) * 10,
          // Leichte Verzögerung, damit die Ebenen nicht synchron starten.
          delay: Math.round((i * 1.3) % 7 * 10) * 10,
          // Vertikaler Drift-Anteil (0.3–1) für Variation in der Bewegungsrichtung.
          v: 0.3 + rnd() * 0.7,
          // Helle Kern-Intensität variiert leicht.
          core: 0.24 + rnd() * 0.2,
        };
      });
      return { layer, items };
    });
  }, [safeCount, safeSpeed, rnd]);

  // Blur pro Ebene: focus 0 → alle 2px (fast scharf), focus 1 → starke Staffelung.
  const layerBlur = (motion: number) => {
    const base = 2 + safeFocus * 10 * (1 - motion * 0.82);
    return Math.round(base * 10) / 10;
  };

  return (
    <div className="bgf-root" aria-hidden="true">
      {orbs.map(({ layer, items }) => (
        <div
          key={layer.name}
          className="bgf-layer"
          style={{ '--bgf-blur': `${layerBlur(layer.motion)}px` } as CSSProperties}
        >
          {items.map((o, k) => (
            <span
              key={k}
              className="bgf-orb"
              style={
                {
                  '--bgf-x': `${o.x.toFixed(2)}%`,
                  '--bgf-y': `${o.y.toFixed(2)}%`,
                  '--bgf-r': `${o.r}px`,
                  '--bgf-d': `${o.d}ms`,
                  '--bgf-delay': `${o.delay}ms`,
                  '--bgf-v': o.v.toFixed(2),
                  '--bgf-core': o.core.toFixed(2),
                  '--bgf-op': layer.opacity,
                  '--bgf-color': color,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
      <style>{`
.bgf-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;isolation:isolate}
.bgf-layer{position:absolute;inset:-12%;filter:blur(var(--bgf-blur));will-change:transform}
.bgf-orb{position:absolute;left:var(--bgf-x);top:var(--bgf-y);width:var(--bgf-r);height:var(--bgf-r);
  border-radius:50%;opacity:var(--bgf-op);
  background:radial-gradient(circle at 36% 36%,
    rgba(255,255,255,var(--bgf-core)),
    color-mix(in srgb, var(--bgf-color) 62%, transparent) 42%,
    color-mix(in srgb, var(--bgf-color) 22%, transparent) 64%,
    transparent 74%);
  animation:bgfDrift var(--bgf-d) ease-in-out var(--bgf-delay) infinite alternate}
@keyframes bgfDrift{
  0%{transform:translate3d(0,0,0) scale(1)}
  100%{transform:translate3d(4vw,calc(-3vh * var(--bgf-v)),0) scale(1.18)}
}
@media (prefers-reduced-motion:reduce){
  .bgf-orb{animation:none}
}
@media (max-width:640px){
  .bgf-orb{opacity:calc(var(--bgf-op) * 0.8)}
}
`}</style>
    </div>
  );
}

export default BokehGoldField;
