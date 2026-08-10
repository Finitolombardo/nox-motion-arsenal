import { useCallback, useEffect, useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, seededRandom, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// LiquidRipple — a bounded low-resolution refraction surface. The source is
// painted once, then displaced in a small work buffer and upscaled. Runtime
// cost therefore stays independent of the preview's physical pixel count.
// ---------------------------------------------------------------------------

export interface LiquidRippleProps {
  ambientStrength?: number; // 0..6 — ambient liquid wobble in buffer px
  rippleStrength?: number; // 0..30 — interaction displacement in buffer px
  rippleDuration?: number; // seconds
  rippleWidth?: number; // ring-band width in buffer px
  maxRipples?: number;
  dprCap?: number;
}

const BUF_W = 240;
const BUF_H = 150;

interface RingRipple {
  x: number;
  y: number;
  born: number;
}

function paintDashboard(ctx: CanvasRenderingContext2D, rnd: () => number) {
  ctx.clearRect(0, 0, BUF_W, BUF_H);
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, BUF_W, BUF_H);

  ctx.strokeStyle = 'rgba(240,236,228,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < BUF_W; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BUF_H);
    ctx.stroke();
  }

  const cols = 4;
  const rows = 3;
  const cw = BUF_W / cols;
  const ch = BUF_H / rows;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const pad = 5;
      const x = cx * cw + pad;
      const y = cy * ch + pad;
      const w = cw - pad * 2;
      const h = ch - pad * 2;
      const warm = rnd() > 0.5;
      ctx.fillStyle = warm ? 'rgba(201,48,48,0.16)' : 'rgba(212,162,74,0.14)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = warm ? 'rgba(255,140,120,0.55)' : 'rgba(240,220,170,0.5)';
      ctx.fillRect(x + 5, y + 5, Math.max(4, w * (0.3 + rnd() * 0.4)), 3);
      ctx.fillStyle = 'rgba(240,236,228,0.18)';
      ctx.fillRect(x + 5, y + h - 10, Math.max(4, w * 0.5), 2);
    }
  }
}

export function LiquidRipple({
  ambientStrength = 2.4,
  rippleStrength = 16,
  rippleDuration = 1.4,
  rippleWidth = 14,
  maxRipples = 5,
  dprCap = 1.5,
}: LiquidRippleProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef, '100px');
  const rings = useRef<RingRipple[]>([]);

  const ambient = clamp(Number.isFinite(ambientStrength) ? ambientStrength : 2.4, 0, 6);
  const ripple = clamp(Number.isFinite(rippleStrength) ? rippleStrength : 16, 0, 30);
  const duration = clamp(Number.isFinite(rippleDuration) ? rippleDuration : 1.4, 0.45, 3);
  const bandWidth = clamp(Number.isFinite(rippleWidth) ? rippleWidth : 14, 5, 30);
  const ringBudget = Math.round(clamp(Number.isFinite(maxRipples) ? maxRipples : 5, 1, 8));
  const resolvedDprCap = clamp(Number.isFinite(dprCap) ? dprCap : 1.5, 1, 2);

  const srcData = useRef<ImageData | null>(null);
  const workCanvas = useRef<HTMLCanvasElement | null>(null);
  const workCtx = useRef<CanvasRenderingContext2D | null>(null);
  const workData = useRef<ImageData | null>(null);

  useEffect(() => {
    const src = document.createElement('canvas');
    src.width = BUF_W;
    src.height = BUF_H;
    const sctx = src.getContext('2d');
    if (!sctx) return;
    paintDashboard(sctx, seededRandom(7));
    srcData.current = sctx.getImageData(0, 0, BUF_W, BUF_H);

    const work = document.createElement('canvas');
    work.width = BUF_W;
    work.height = BUF_H;
    const ctx = work.getContext('2d');
    if (!ctx) return;
    workCanvas.current = work;
    workCtx.current = ctx;
    workData.current = ctx.createImageData(BUF_W, BUF_H);
  }, []);

  useEffect(() => {
    if (reduced) rings.current = [];
  }, [reduced]);

  const addRipple = useCallback(
    (x: number, y: number) => {
      if (reduced) return;
      rings.current.push({ x: clamp(x, 0, BUF_W), y: clamp(y, 0, BUF_H), born: performance.now() });
      while (rings.current.length > ringBudget) rings.current.shift();
    },
    [reduced, ringBudget],
  );

  const addRippleFromPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      addRipple(
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * BUF_W,
        ((event.clientY - rect.top) / Math.max(rect.height, 1)) * BUF_H,
      );
    },
    [addRipple],
  );

  const addCenterRipple = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      addRipple(BUF_W / 2, BUF_H / 2);
    },
    [addRipple],
  );

  useCanvas2D(
    canvasRef,
    (ctx, size, _dt, elapsed) => {
      const src = srcData.current;
      const wctx = workCtx.current;
      const wdata = workData.current;
      const work = workCanvas.current;
      if (!src || !wctx || !wdata || !work) return;

      const now = performance.now();
      const lifetimeMs = duration * 1000;
      const active = reduced ? [] : rings.current.filter((entry) => now - entry.born < lifetimeMs);
      rings.current = active;

      const source = src.data;
      const target = wdata.data;
      const speed = 130;

      for (let y = 0; y < BUF_H; y++) {
        for (let x = 0; x < BUF_W; x++) {
          let ox = reduced
            ? 0
            : Math.sin(x * 0.09 + elapsed * 1.1) * Math.cos(y * 0.08 - elapsed * 0.7) * ambient;
          let oy = reduced
            ? 0
            : Math.cos(y * 0.1 - elapsed * 0.9) * Math.sin(x * 0.07 + elapsed * 0.8) * ambient;
          let caustic = 0;

          for (const entry of active) {
            const age = (now - entry.born) / 1000;
            const radius = age * speed;
            const dx = x - entry.x;
            const dy = y - entry.y;
            const distSq = dx * dx + dy * dy;
            const outer = radius + bandWidth * 2.5;
            const inner = Math.max(0, radius - bandWidth * 2.5);
            if (distSq > outer * outer || distSq < inner * inner) continue;

            const dist = Math.sqrt(distSq) + 0.0001;
            const band = Math.exp(-Math.pow((dist - radius) / bandWidth, 2));
            const decay = Math.max(0, 1 - age / duration);
            const push = band * decay * ripple;
            ox += (dx / dist) * push;
            oy += (dy / dist) * push;
            caustic += band * decay;
          }

          const sx = Math.max(0, Math.min(BUF_W - 1, Math.round(x + ox)));
          const sy = Math.max(0, Math.min(BUF_H - 1, Math.round(y + oy)));
          const redX = Math.max(0, Math.min(BUF_W - 1, sx + (caustic > 0.06 ? 1 : 0)));
          const blueX = Math.max(0, Math.min(BUF_W - 1, sx - (caustic > 0.06 ? 1 : 0)));
          const si = (sy * BUF_W + sx) * 4;
          const ri = (sy * BUF_W + redX) * 4;
          const bi = (sy * BUF_W + blueX) * 4;
          const di = (y * BUF_W + x) * 4;
          const lift = Math.min(18, caustic * 12);

          target[di] = Math.min(255, source[ri] + lift);
          target[di + 1] = Math.min(255, source[si + 1] + lift * 0.55);
          target[di + 2] = Math.min(255, source[bi + 2] + lift * 0.25);
          target[di + 3] = source[si + 3];
        }
      }

      wctx.putImageData(wdata, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(work, 0, 0, BUF_W, BUF_H, 0, 0, size.w, size.h);

      if (!reduced && active.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const entry of active) {
          const age = (now - entry.born) / 1000;
          const progress = clamp(age / duration, 0, 1);
          const radiusX = (age * speed * size.w) / BUF_W;
          const radiusY = (age * speed * size.h) / BUF_H;
          const px = (entry.x / BUF_W) * size.w;
          const py = (entry.y / BUF_H) * size.h;
          ctx.strokeStyle = `rgba(242,214,158,${0.2 * (1 - progress)})`;
          ctx.lineWidth = Math.max(0.75, 1.6 * (1 - progress));
          ctx.beginPath();
          ctx.ellipse(px, py, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    inView && !reduced,
    resolvedDprCap,
  );

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label="Liquid ripple surface. Press Enter or Space, or tap the surface, to create a ripple."
      onPointerDown={addRippleFromPointer}
      onKeyDown={addCenterRipple}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NOX_COLORS.bg,
        cursor: reduced ? 'default' : 'pointer',
        touchAction: 'pan-y',
        outline: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, transparent 35%, rgba(0,0,0,0.2) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(240,236,228,0.06)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.32em',
          color: NOX_COLORS.textDim,
          pointerEvents: 'none',
        }}
      >
        LIQUID SURFACE // TAP TO REFRACT
      </div>
      <style>{`
        [role='button']:focus-visible > canvas + div {
          box-shadow: inset 0 0 0 1px rgba(240, 220, 170, 0.62), inset 0 0 30px rgba(212, 162, 74, 0.08) !important;
        }
        @media (max-width: 520px), (max-height: 420px) {
          [role='button'] > div:last-of-type { font-size: 8px !important; letter-spacing: .2em !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          [role='button'] { cursor: default !important; }
        }
      `}</style>
    </div>
  );
}

export default LiquidRipple;
