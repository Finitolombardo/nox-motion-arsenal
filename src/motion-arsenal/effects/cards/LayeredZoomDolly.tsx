import { useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop, useScrollProgress } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// LayeredZoomDolly — mehrere 2D-Ebenen erzeugen eine räumliche Kamerafahrt.
// Ein preserve-3d-Container hält 4–6 Ebenen mit festen translateZ-Tiefen
// (-900..0px); die Kamera fährt per Progress (Scroll oder Auto) entlang der
// Z-Achse, dadurch ziehen nahe Ebenen schneller vorbei als ferne (echte
// Parallaxe). Deterministische Ebenen-Geometrie via seededRandom.
// Reduced Motion: statische Tiefenkomposition, keine Fahrt.
// ---------------------------------------------------------------------------

export interface LayeredZoomDollyProps {
  /** Ebenen (Titel + eigener Gold-/Blau-Ton), max 6. */
  layers?: string[];
  /** Kameratiefe: max. translateZ in px (400–1200). */
  depth?: number;
  /** Steuerung: Scroll oder Auto (Toggle). */
  mode?: 'scroll' | 'auto';
  /** Deterministischer Seed für Ebenen-Details. */
  seed?: number;
}

interface LayerSpec {
  label: string;
  z: number;
  hue: string;
  glyphs: { x: number; y: number; s: number }[];
}

const HUES = [NOX_COLORS.gold, '#2f6f8f', '#1b2a4a', '#6f4a2a', '#4a5a8a', '#8a6a3a'];

export function LayeredZoomDolly({
  layers = ['NOX', 'MOTION', 'ARSENAL', 'SYSTEM', 'CORE'],
  depth = 800,
  mode = 'scroll',
  seed = 20260810,
}: LayeredZoomDollyProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const camRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const safeDepth = clamp(depth, 400, 1200);
  const safeLayers = layers.length > 0 ? layers.slice(0, 6) : ['NOX'];

  const rng = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Ebenen: gleichmäßig über die Z-Tiefe verteilt, mit
  // zufälligen (aber seed-festen) Dekor-Glyphen pro Ebene.
  const specs = useMemo<LayerSpec[]>(() => {
    return safeLayers.map((label, i) => ({
      label,
      z: -Math.round((safeDepth * (i + 1)) / (safeLayers.length + 1)),
      hue: HUES[i % HUES.length],
      glyphs: Array.from({ length: 5 + (i % 3) }, () => ({
        x: rng() * 100,
        y: rng() * 100,
        s: 8 + rng() * 22,
      })),
    }));
  }, [safeLayers, safeDepth, rng]);

  const progressRef = useScrollProgress(rootRef);
  const autoRef = useRef({ p: 0, dir: 1, playing: true });

  useRafLoop((dt) => {
    if (reduced) return;
    let p = progressRef.current;
    if (mode === 'auto') {
      const a = autoRef.current;
      if (a.playing) {
        a.p += a.dir * dt * 0.22;
        if (a.p >= 1) { a.p = 1; a.dir = -1; }
        if (a.p <= 0) { a.p = 0; a.dir = 1; }
      }
      p = a.p;
    }
    // Kamera fährt von +depth (hinter allem) nach -depth*1.2 (durch die
    // Ebenen hindurch) — Ebenen mit z > Kamera-Z wachsen sichtbar.
    const cam = camRef.current;
    if (cam) {
      const z = safeDepth * (1 - p * 2.2);
      cam.style.transform = `translateZ(${z}px)`;
    }
  }, true);

  const vars = {
    '--lzd-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="lzd-root" style={vars}>
      <div className="lzd-scene">
        <div ref={camRef} className="lzd-cam" style={{ transform: `translateZ(${safeDepth}px)` }}>
          {specs.map((s, i) => (
            <div
              key={i}
              className="lzd-layer"
              style={{
                transform: `translate3d(-50%,-50%,${s.z}px)`,
                color: s.hue,
                '--lzd-label': `"${s.label}"`,
              } as CSSProperties}
            >
              {s.label}
              {s.glyphs.map((g, gi) => (
                <i
                  key={gi}
                  style={{
                    left: `${g.x}%`,
                    top: `${g.y}%`,
                    width: `${g.s}px`,
                    height: `${g.s}px`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {mode === 'auto' && (
        <button
          type="button"
          className="lzd-toggle"
          onClick={() => {
            autoRef.current.playing = !autoRef.current.playing;
          }}
        >
          {autoRef.current.playing ? 'PAUSE' : 'PLAY'}
        </button>
      )}
      <style>{`
.lzd-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:#06080c;perspective:900px;perspective-origin:50% 42%}
.lzd-scene{position:absolute;inset:0;display:grid;place-items:center}
.lzd-cam{position:relative;width:100%;height:100%;transform-style:preserve-3d;
  will-change:transform;transition:none}
.lzd-layer{position:absolute;left:50%;top:50%;width:110%;height:110%;
  display:grid;place-items:center;font:900 clamp(64px,17vw,190px)/1 system-ui;
  letter-spacing:-.05em;opacity:.92;will-change:transform;
  border:1px solid color-mix(in srgb,currentColor 16%,transparent);
  background:linear-gradient(160deg,color-mix(in srgb,currentColor 7%,#0a0d13),#080a0f 70%)}
.lzd-layer i{position:absolute;border:1px solid currentColor;opacity:.4;transform:rotate(45deg)}
.lzd-layer:nth-child(1){color:var(--lzd-gold)}
.lzd-toggle{position:absolute;bottom:18px;right:18px;z-index:5;border:1px solid
  color-mix(in srgb,var(--lzd-gold) 60%,transparent);background:#0b0d12cc;color:var(--lzd-gold);
  font:10px ui-monospace,monospace;letter-spacing:.16em;padding:8px 14px;cursor:pointer}
.lzd-toggle:hover{border-color:var(--lzd-gold)}
@media (prefers-reduced-motion:reduce){
  .lzd-cam{transform:translateZ(0) !important}
  .lzd-toggle{display:none}
}
`}</style>
    </div>
  );
}

export default LayeredZoomDolly;
