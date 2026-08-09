import { useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, damp, seededRandom, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// OrbitalLightTrails — NOX Adapted der Active-Theory-Trail-Mechanik.
//
// V2 keeps the original autonomous Lissajous-light idea, but turns it into a
// reusable production background: no hard-coded demo copy, no per-segment
// stroke loop, no radial-gradient allocation for every orb on every frame.
// The loop pauses offscreen, pointer input only bends the field subtly, and
// reduced motion renders a deterministic static composition.
// ---------------------------------------------------------------------------

export interface OrbitalLightTrailsProps {
  orbCount?: number;
  trailLength?: number;
  speed?: number;
  intensity?: number;
}

type Point = { x: number; y: number };

interface Orb {
  hist: Point[];
  x: number;
  y: number;
  color: [number, number, number];
  fx: number;
  fy: number;
  phase: number;
  rx: number;
  ry: number;
  lambda: number;
  depth: number;
}

interface PointerState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  active: boolean;
}

const NOX_TRAIL_COLORS: Array<[number, number, number]> = [
  [201, 48, 48],
  [212, 162, 74],
  [255, 120, 60],
  [240, 236, 228],
];

const rgb = ([r, g, b]: [number, number, number], alpha: number) =>
  `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1).toFixed(3)})`;

function createGlowSprite(color: [number, number, number]) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, rgb(color, 0.95));
  g.addColorStop(0.12, rgb(color, 0.52));
  g.addColorStop(0.38, rgb(color, 0.18));
  g.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

function traceSmoothPath(ctx: CanvasRenderingContext2D, points: Point[], w: number, h: number) {
  if (points.length < 2) return false;
  const first = points[0];
  ctx.beginPath();
  ctx.moveTo(first.x * w, first.y * h);

  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const mx = ((current.x + next.x) * 0.5) * w;
    const my = ((current.y + next.y) * 0.5) * h;
    ctx.quadraticCurveTo(current.x * w, current.y * h, mx, my);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x * w, last.y * h);
  return true;
}

function orbitPosition(orb: Orb, t: number, pointerX: number, pointerY: number, pointerMix: number): Point {
  const baseX = 0.5 + Math.sin(t * orb.fx * Math.PI * 2 + orb.phase) * orb.rx;
  const baseY = 0.5 + Math.sin(t * orb.fy * Math.PI * 2 + orb.phase * 1.7) * orb.ry;
  const depthInfluence = 0.55 + orb.depth * 0.45;
  return {
    x: baseX + (pointerX - 0.5) * pointerMix * depthInfluence,
    y: baseY + (pointerY - 0.5) * pointerMix * depthInfluence,
  };
}

export function OrbitalLightTrails({
  orbCount = 4,
  trailLength = 60,
  speed = 1,
  intensity = 0.85,
}: OrbitalLightTrailsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(hostRef);
  const orbs = useRef<Orb[] | null>(null);
  const sprites = useRef<HTMLCanvasElement[] | null>(null);
  const pointer = useRef<PointerState>({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false });

  const safeIntensity = clamp(intensity, 0, 1.5);
  const safeSpeed = clamp(speed, 0.15, 3);
  const safeTrailLength = Math.round(clamp(trailLength, 12, 120));

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const narrow = size.w < 700;
      const requested = Math.round(clamp(orbCount, 1, 8));
      const count = narrow ? Math.min(requested, 5) : requested;
      const historyLimit = narrow ? Math.min(safeTrailLength, 72) : safeTrailLength;

      if (!orbs.current || orbs.current.length !== count) {
        const rnd = seededRandom(77);
        orbs.current = Array.from({ length: count }, (_, i) => ({
          hist: [],
          x: 0.5,
          y: 0.5,
          color: NOX_TRAIL_COLORS[i % NOX_TRAIL_COLORS.length],
          fx: 0.12 + rnd() * 0.22,
          fy: 0.09 + rnd() * 0.2,
          phase: rnd() * Math.PI * 2,
          rx: 0.22 + rnd() * 0.22,
          ry: 0.18 + rnd() * 0.2,
          lambda: 3 + rnd() * 4,
          depth: 0.25 + rnd() * 0.75,
        }));
      }

      if (!sprites.current) {
        sprites.current = NOX_TRAIL_COLORS.map(createGlowSprite);
      }

      ctx.clearRect(0, 0, size.w, size.h);
      ctx.globalCompositeOperation = 'lighter';

      const p = pointer.current;
      const pointerLambda = p.active ? 7.5 : 2.4;
      p.tx = p.active ? p.tx : 0.5;
      p.ty = p.active ? p.ty : 0.5;
      p.x = reduced ? 0.5 : damp(p.x, p.tx, pointerLambda, dt);
      p.y = reduced ? 0.5 : damp(p.y, p.ty, pointerLambda, dt);

      const t = elapsed * safeSpeed;
      const pointerMix = reduced ? 0 : 0.075;

      for (let index = 0; index < orbs.current.length; index += 1) {
        const orb = orbs.current[index];
        const target = orbitPosition(orb, t, p.x, p.y, pointerMix);

        if (reduced || dt === 0) {
          orb.x = target.x;
          orb.y = target.y;
          orb.hist = Array.from({ length: Math.min(historyLimit, 34) }, (_, i) => {
            const age = (Math.min(historyLimit, 34) - 1 - i) * 0.025;
            return orbitPosition(orb, t - age, 0.5, 0.5, 0);
          });
        } else {
          orb.x = damp(orb.x, target.x, orb.lambda, dt);
          orb.y = damp(orb.y, target.y, orb.lambda, dt);
          orb.hist.push({ x: orb.x, y: orb.y });
          if (orb.hist.length > historyLimit) orb.hist.splice(0, orb.hist.length - historyLimit);
        }

        if (!traceSmoothPath(ctx, orb.hist, size.w, size.h)) continue;

        const depthAlpha = (0.55 + orb.depth * 0.45) * safeIntensity;
        const depthWidth = 0.85 + orb.depth * 1.55;

        // Two smooth strokes replace the old O(history) per-segment stroke loop.
        // The broad pass supplies haze; the narrow pass keeps the trail crisp.
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = rgb(orb.color, 0.075 * depthAlpha);
        ctx.lineWidth = 6.5 * depthWidth;
        ctx.stroke();

        traceSmoothPath(ctx, orb.hist, size.w, size.h);
        ctx.strokeStyle = rgb(orb.color, 0.34 * depthAlpha);
        ctx.lineWidth = 1.15 * depthWidth;
        ctx.stroke();

        const headX = orb.x * size.w;
        const headY = orb.y * size.h;
        const sprite = sprites.current[index % sprites.current.length];
        const glowSize = (42 + orb.depth * 34) * (narrow ? 0.82 : 1);
        ctx.globalAlpha = clamp(0.42 * depthAlpha, 0, 1);
        ctx.drawImage(sprite, headX - glowSize, headY - glowSize, glowSize * 2, glowSize * 2);
        ctx.globalAlpha = 1;

        ctx.fillStyle = rgb(orb.color, 0.82 * safeIntensity);
        ctx.beginPath();
        ctx.arc(headX, headY, 0.9 + orb.depth * 1.25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },
    inView && !reduced,
    1.75,
  );

  return (
    <div
      ref={hostRef}
      onPointerMove={(event) => {
        if (reduced || event.pointerType === 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        pointer.current.tx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        pointer.current.ty = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        pointer.current.active = true;
      }}
      onPointerLeave={() => {
        pointer.current.active = false;
      }}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'auto',
        background:
          'radial-gradient(circle at 50% 115%, rgba(74, 26, 12, 0.34), transparent 54%), radial-gradient(circle at 50% 42%, #111116 0%, #09090c 58%, #060608 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, transparent 0%, rgba(4,4,7,0.08) 50%, rgba(3,3,5,0.58) 100%)',
        }}
      />
    </div>
  );
}

export default OrbitalLightTrails;
