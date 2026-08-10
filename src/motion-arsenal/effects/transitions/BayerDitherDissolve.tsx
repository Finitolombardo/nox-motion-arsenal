import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// BayerDitherDissolve — Bayer-geditherter Abschnittswechsel mit Gold-Kante.
// Zwei Panels (Vorder-/Hintergrund) werden über eine Bayer-4x4-Matrix auf
// reduzierter Canvas-Auflösung ineinander aufgelöst: Jede Zelle wird sichtbar,
// sobald ihr Bayer-Schwellwert unter dem Dissolve-Fortschritt liegt. Der Canvas
// wird hochskaliert (pixelated), die Gold-Kante der Frontplatte kommt beim
// Umschlag zum Vorschein. Kein Math.random — Bayer-Matrix ist deterministisch,
// der Auto-Play-Takt nutzt setInterval mit festen Werten.
// ---------------------------------------------------------------------------

export interface BayerDitherDissolveProps {
  /** Text der Vorderfläche (wird weggeblendet). */
  frontLabel?: string;
  /** Text der Rückfläche (kommt zum Vorschein). */
  backLabel?: string;
  /** Dauer eines vollständigen Umschlags in ms (600–3000). */
  duration?: number;
  /** Zellgröße der Bayer-Matrix in px auf dem Canvas (4–16). */
  cellSize?: number;
  /** Gold-Kante an der Frontplatte ein/aus. */
  goldEdge?: boolean;
  /** Automatischer Wechsel zwischen den Flächen. */
  autoPlay?: boolean;
  /** Seed für die zufällige Flächen-Deko (deterministisch). */
  seed?: number;
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function BayerDitherDissolve({
  frontLabel = 'NOX',
  backLabel = 'ARSENAL',
  duration = 1600,
  cellSize = 8,
  goldEdge = true,
  autoPlay = true,
  seed = 20260810,
}: BayerDitherDissolveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [running, setRunning] = useState(autoPlay);

  const rnd = useMemo(() => seededRandom(seed), [seed]);

  // Deterministische Deko-Punkte für beide Flächen.
  const deco = useMemo(() => {
    const points = Array.from({ length: 14 }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 2 + rnd() * 5,
      op: 0.18 + rnd() * 0.25,
    }));
    return points;
  }, [rnd]);

  // Auto-Play: ein Takt = Hin- und Rückweg, dann Pause.
  useEffect(() => {
    if (!running) return;
    let dir = 1;
    let p = 0;
    const id = window.setInterval(() => {
      p += dir * (1000 / duration) * 0.5;
      if (p >= 1) {
        p = 1;
        setFlipped(true);
        dir = -1;
      } else if (p <= 0) {
        p = 0;
        setFlipped(false);
        dir = 1;
      }
      setProgress(p);
    }, 16);
    return () => window.clearInterval(id);
  }, [running, duration]);

  // Bayer-Matrix auf reduzierter Auflösung rendern — nur bei Progress-Änderung.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(canvas.clientWidth / cellSize));
    const h = Math.max(2, Math.round(canvas.clientHeight / cellSize));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const thresh = progress * 16;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const b = BAYER4[y % 4][x % 4];
        const on = b < thresh;
        const idx = (y * w + x) * 4;
        if (on) {
          // Gold-Leuchten der aufgedeckten Fläche, leicht geglättet zur Kante.
          const glow = clamp((thresh - b) / 8, 0, 1);
          data[idx] = 212;
          data[idx + 1] = 162;
          data[idx + 2] = 74 + Math.round(glow * 60);
          data[idx + 3] = 255;
        } else {
          data[idx] = 10;
          data[idx + 1] = 10;
          data[idx + 2] = 11;
          data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    // DPR-Anpassung über CSS-Größe (Canvas bleibt logisch klein, wird hochskaliert).
    void dpr;
  }, [progress, cellSize]);

  const ditherStyle = {
    '--bdd-duration': `${duration}ms`,
    '--bdd-scale': `scale(${flipped ? 1 : 1})`,
  } as CSSProperties;

  return (
    <div
      className="bdd-root"
      style={ditherStyle}
      onPointerEnter={() => setRunning(true)}
    >
      {/* Rückfläche */}
      <div className="bdd-panel bdd-back" aria-hidden={!flipped}>
        <span className="bdd-label">{backLabel}</span>
        {deco.map((d, i) => (
          <i
            key={i}
            className="bdd-deco"
            style={{
              left: `${d.x.toFixed(1)}%`,
              top: `${d.y.toFixed(1)}%`,
              width: `${d.r}px`,
              height: `${d.r}px`,
              opacity: d.op,
            }}
          />
        ))}
      </div>

      {/* Vorderfläche mit Gold-Kante */}
      <div
        className="bdd-panel bdd-front"
        aria-hidden={flipped}
        style={goldEdge ? undefined : { borderColor: 'transparent' }}
      >
        <span className="bdd-label bdd-front-label">{frontLabel}</span>
      </div>

      {/* Bayer-Maske */}
      <canvas
        ref={canvasRef}
        className="bdd-canvas"
        role="img"
        aria-label={`${frontLabel} zu ${backLabel} — Bayer-Dither-Umschlag`}
      />

      {/* Fortschritts-Toggle für manuelle Steuerung */}
      <button
        type="button"
        className="bdd-toggle"
        onClick={() => {
          setRunning(false);
          setProgress((p) => {
            const next = p >= 0.5 ? 0 : 1;
            setFlipped(next === 1);
            return next;
          });
        }}
        aria-pressed={flipped}
      >
        {flipped ? backLabel : frontLabel}
      </button>

      <style>{`
.bdd-root{position:relative;width:100%;height:100%;min-height:220px;overflow:hidden;
  border-radius:14px;background:#0a0a0b;contain:layout paint}
.bdd-panel{position:absolute;inset:0;display:grid;place-items:center;
  transition:opacity var(--bdd-duration) steps(24,end)}
.bdd-back{background:radial-gradient(120% 120% at 30% 20%,#1d1708 0%,#0a0a0b 55%)}
.bdd-front{background:radial-gradient(120% 120% at 70% 80%,#1a140a 0%,#0c0b09 60%);
  border:2px solid var(--nox-gold,#d4a24a);box-shadow:inset 0 0 42px rgba(212,162,74,.14)}
.bdd-front[aria-hidden="true"]{opacity:0;pointer-events:none}
.bdd-label{font-family:var(--nox-font-display,Georgia,serif);font-size:clamp(34px,9vw,84px);
  font-weight:700;letter-spacing:.08em;color:#f0ece4;text-shadow:0 0 24px rgba(212,162,74,.35)}
.bdd-front-label{color:#f0ece4;background:linear-gradient(180deg,#fff8e6,#d4a24a);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.bdd-deco{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe9ad,transparent 70%);
  pointer-events:none}
.bdd-canvas{position:absolute;inset:0;width:100%;height:100%;
  image-rendering:pixelated;pointer-events:none;mix-blend-mode:screen;opacity:.92}
.bdd-toggle{position:absolute;left:14px;bottom:14px;z-index:3;padding:8px 16px;border-radius:999px;
  border:1px solid rgba(212,162,74,.5);background:rgba(10,10,11,.72);color:#d4a24a;
  font-size:12px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;
  backdrop-filter:blur(6px);transition:background .2s}
.bdd-toggle:hover{background:rgba(212,162,74,.16)}
@media (prefers-reduced-motion:reduce){
  .bdd-panel{transition:none}
  .bdd-canvas{display:none}
}
`}</style>
    </div>
  );
}

export default BayerDitherDissolve;
