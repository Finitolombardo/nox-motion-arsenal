import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// WebGPUDustDissolve — Headline löst sich in deterministischen Gold-Staub
// auf und setzt sich wieder zusammen. Implementierung: Canvas-2D-Partikel-
// System mit Text-Pixel-Sampling als Ziel-Map (MSDF-Analogon), Dissolve-
// Fortschritt aus Scroll/Zeit; Partikelpositionen aus det(i, salt)-PRNG
// vorberechnet. Konzept dokumentiert als Fallback „CSS-Filter-Version
// (blur+opacity) ohne Partikel" — hier ist die Vollversion (Partikel)
// ohne WebGPU-Zwang umgesetzt; reduced-motion nutzt den CSS-Fallback.
// ---------------------------------------------------------------------------

export interface WebGPUDustDissolveProps {
  /** Headline-Text. */
  text?: string;
  /** Partikel-Anzahl (600–6000). */
  count?: number;
  /** Dissolve-Geschwindigkeit (0.2–2). */
  speed?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

interface D {
  x: number; y: number; tx: number; ty: number;
  size: number; phase: number; drift: number;
}

export function WebGPUDustDissolve({
  text = 'DUST',
  count = 1800,
  speed = 1,
  seed = 20260810,
}: WebGPUDustDissolveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const safeCount = clamp(Math.round(count), 600, 6000);
  const safeSpeed = clamp(speed, 0.2, 2);

  const dust = useMemo<D[]>(() => {
    const rng = seededRandom(seed);
    return Array.from({ length: safeCount }, (_, i) => ({
      x: (rng() - 0.5) * 2,
      y: (rng() - 0.5) * 2,
      tx: 0, ty: 0,
      size: 0.5 + rng() * 1.6,
      phase: rng() * Math.PI * 2,
      drift: 0.4 + rng() * 1.2,
    }));
  }, [safeCount, seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const scale = 0.6;
    off.width = Math.floor(w * scale);
    off.height = Math.floor(h * scale);

    if (!octx) return;
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, off.width, off.height);
    octx.font = `800 ${Math.floor(off.height * 0.24)}px ui-monospace, monospace`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = '#fff';
    octx.fillText(text, off.width / 2, off.height / 2);

    const data = octx.getImageData(0, 0, off.width, off.height).data;
    const targets: Array<[number, number]> = [];
    for (let y = 0; y < off.height; y += 2) {
      for (let x = 0; x < off.width; x += 2) {
        if (data[(y * off.width + x) * 4 + 3] > 128) {
          targets.push([(x / off.width - 0.5) * 2, (y / off.height - 0.5) * 2]);
        }
      }
    }
    for (let i = 0; i < dust.length; i++) {
      const t = targets[i % Math.max(targets.length, 1)];
      if (t) {
        dust[i].tx = t[0];
        dust[i].ty = t[1];
      }
    }

    let raf = 0;
    const start = performance.now();

    const render = (now: number) => {
      const elapsed = ((now - start) / 1000) * safeSpeed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dissolve-Fortschritt: 0→1→0 (auf-lösen, wieder-setzen).
      const dissolve = (Math.sin(elapsed * 0.4) + 1) / 2;

      ctx.fillStyle = NOX_COLORS.gold;
      ctx.shadowColor = NOX_COLORS.gold;
      ctx.shadowBlur = 5;

      for (const p of dust) {
        // Staub-Streuung nimmt mit Dissolve zu (deterministische Richtung).
        const scatter = dissolve;
        const sx = p.drift * Math.sin(p.phase + elapsed * 2.4);
        const sy = p.drift * Math.cos(p.phase * 1.3 + elapsed * 1.8);
        const px = (p.tx + sx * scatter * 0.35) * (canvas.width / 2);
        const py = (p.ty + sy * scatter * 0.35) * (canvas.height / 2);
        const s = p.size * dpr * (0.5 + scatter * 0.7);
        ctx.globalAlpha = 0.25 + (1 - scatter) * 0.75;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + px, canvas.height / 2 + py, s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [dust, text, safeSpeed, reduced]);

  const vars = {
    '--wgd-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div className="wgd-root" style={vars}>
      {reduced ? (
        <h2 className="wgd-cssfallback" aria-label={text}>
          {text}
        </h2>
      ) : (
        <canvas ref={canvasRef} className="wgd-canvas" aria-label={`${text} Dust-Dissolve`} />
      )}
      <style>{`
.wgd-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.wgd-canvas{width:100%;height:100%;display:block}
.wgd-cssfallback{color:var(--wgd-gold);font:800 clamp(28px,7vw,64px)/1 ui-monospace,monospace;
  letter-spacing:.18em;text-shadow:0 0 34px color-mix(in srgb,var(--wgd-gold) 50%,transparent);
  margin:0}
`}</style>
    </div>
  );
}

export default WebGPUDustDissolve;
