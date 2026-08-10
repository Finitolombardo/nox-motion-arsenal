import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// CanvasLineTypo — Headline als Canvas-Line-Art: Der Text wird in Punkte
// abgetastet (getImageData auf Offscreen-Canvas) und die Punkte "zeichnen"
// den Text als verbundene Linienzüge nach (draw-Loop mit progress). Die
// Punktwolke atmet leicht (deterministische Phase pro Punkt). Nur Canvas-
// Writes im rAF-Loop, kein DOM-Layout.
// Reduced Motion: Text wird direkt voll gezeichnet und bleibt statisch.
// ---------------------------------------------------------------------------

export interface CanvasLineTypoProps {
  /** Text. */
  text?: string;
  /** Punktdichte (0.4–2, 1 = Standard). */
  density?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function CanvasLineTypo({
  text = 'NOX',
  density = 1,
  seed = 20260810,
}: CanvasLineTypoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const safeDensity = clamp(density, 0.4, 2);

  const rng = useMemo(() => seededRandom(seed), [seed]);
  // Deterministische Atem-Phasen pro Punkt (wird im Loop verwendet).
  const phases = useMemo(() => Array.from({ length: 900 }, () => rng() * Math.PI * 2), [rng]);

  useRafLoop((t, dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Text in ein Offscreen-Canvas rasterisieren (cached).
    const off = document.createElement('canvas');
    off.width = Math.max(2, Math.round(w / 2));
    off.height = Math.max(2, Math.round(h / 2));
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, off.width, off.height);
    octx.fillStyle = '#fff';
    octx.font = `900 ${Math.floor(off.height * 0.62)}px system-ui`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(text, off.width / 2, off.height / 2 + 4);

    // Sample-Punkte (deterministisch, Dichte via Schrittweite).
    const data = octx.getImageData(0, 0, off.width, off.height).data;
    const step = Math.max(2, Math.round(3 / safeDensity));
    const pts: Array<{ x: number; y: number; phase: number }> = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const a = data[(y * off.width + x) * 4 + 3];
        if (a > 128) {
          pts.push({
            x: (x / off.width) * w,
            y: (y / off.height) * h,
            phase: phases[pts.length % phases.length],
          });
        }
      }
    }

    // Draw-Progress: Punkte erscheinen staffelweise (wellenförmig).
    const progress = reduced ? 1 : Math.min(1, (t / 1000) * 0.7);
    const glow = reduced ? 0 : 0.12 + Math.sin((t / 1000) * 1.6) * 0.04;

    ctx.strokeStyle = NOX_COLORS.gold;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = NOX_COLORS.gold;
    ctx.shadowBlur = 6 * glow;

    const n = Math.floor(pts.length * progress);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Atemende Punkte.
    ctx.shadowBlur = 0;
    ctx.fillStyle = NOX_COLORS.gold;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < n; i += 3) {
      const p = pts[i];
      const breathe = reduced ? 0 : Math.sin((t / 1000) * 2 + p.phase) * 0.3;
      ctx.fillRect(p.x - 0.5, p.y - 0.5, 1 + breathe, 1 + breathe);
    }
  }, true);

  const vars = {
    '--clt-bg': '#06080c',
  } as CSSProperties;

  return (
    <div className="clt-root" style={vars} aria-hidden="true">
      <canvas ref={canvasRef} className="clt-canvas" />
      <style>{`
.clt-root{position:absolute;inset:0;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.clt-canvas{width:100%;height:100%;display:block}
`}</style>
    </div>
  );
}

export default CanvasLineTypo;
