import { useMemo, useRef } from 'react';
import { clamp, seededRandom, useInView, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath } from '../../lib/svgUtils';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// InteractiveSymbolDrift — spring-return procedural glyph field. The loop now
// pauses offscreen, clamps malformed controls, reduces the glyph budget on
// coarse/touch pointers and preserves vertical page scrolling on mobile.
// ---------------------------------------------------------------------------

export interface InteractiveSymbolDriftProps {
  mode?: 'repel' | 'attract';
  forceRadius?: number; // px — pointer influence radius
  count?: number; // 12..60 glyphs
  colorMode?: 'nox' | 'ember' | 'mono';
  seed?: number;
  dprCap?: number; // 1..2 render-density budget
}

const PALETTES: Record<string, string[]> = {
  nox: [NOX_COLORS.red, NOX_COLORS.gold, NOX_COLORS.text, NOX_COLORS.redBright],
  ember: ['#ff5a2e', NOX_COLORS.red, '#ffb347', '#7a1f1f'],
  mono: [NOX_COLORS.text, NOX_COLORS.textDim, '#5a5852', NOX_COLORS.text],
};

interface Glyph {
  path: Path2D;
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rot: number;
  color: string;
}

export function InteractiveSymbolDrift({
  mode = 'repel',
  forceRadius = 130,
  count = 30,
  colorMode = 'nox',
  seed = 9,
  dprCap = 1.5,
}: InteractiveSymbolDriftProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);
  const hoverCapable = useHoverCapable();

  const safeRadius = clamp(Number.isFinite(forceRadius) ? forceRadius : 130, 40, 280);
  const safeCount = clamp(Math.round(Number.isFinite(count) ? count : 30), 12, 60);
  const budgetedCount = hoverCapable ? safeCount : Math.min(safeCount, 30);
  const safeSeed = Math.trunc(Number.isFinite(seed) ? seed : 9);
  const safeDpr = clamp(Number.isFinite(dprCap) ? dprCap : 1.5, 1, 2);
  const running = inView && !reduced;

  const glyphs = useMemo<Glyph[]>(() => {
    const rnd = seededRandom(safeSeed);
    const palette = PALETTES[colorMode] ?? PALETTES.nox;
    const cols = Math.ceil(Math.sqrt(budgetedCount * 1.7));
    const rows = Math.ceil(budgetedCount / cols);
    return Array.from({ length: budgetedCount }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const hx = (col + 0.5) / cols + (rnd() - 0.5) * (0.55 / cols);
      const hy = (row + 0.5) / rows + (rnd() - 0.5) * (0.55 / rows);
      return {
        path: new Path2D(glyphPath(safeSeed * 101 + i * 17, 26)),
        hx,
        hy,
        x: hx,
        y: hy,
        vx: 0,
        vy: 0,
        scale: 0.55 + rnd() * 0.85,
        rot: (rnd() - 0.5) * 1.2,
        color: palette[i % palette.length],
      };
    });
  }, [budgetedCount, colorMode, safeSeed]);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const p = pointer.current;
      if (running && !hoverCapable) driftPointer(p, elapsed);
      const px = p.tx * size.w;
      const py = p.ty * size.h;

      ctx.clearRect(0, 0, size.w, size.h);

      const spring = 42;
      const damping = 5.5;
      const power = mode === 'repel' ? 900 : 640;

      for (const g of glyphs) {
        const gx = g.x * size.w;
        const gy = g.y * size.h;

        if (reduced) {
          g.x = g.hx;
          g.y = g.hy;
          g.vx = 0;
          g.vy = 0;
        } else if (running) {
          if (p.inside) {
            const dx = gx - px;
            const dy = gy - py;
            const d2 = dx * dx + dy * dy;
            const radius2 = safeRadius * safeRadius;
            if (d2 < radius2 && d2 > 0.0001) {
              const d = Math.sqrt(d2);
              const strength = (1 - d / safeRadius) * power;
              const dir = mode === 'repel' ? 1 : -1;
              g.vx += ((dx / d) * strength * dir * dt) / size.w;
              g.vy += ((dy / d) * strength * dir * dt) / size.h;
            }
          }
          g.vx += (g.hx - g.x) * spring * dt - g.vx * damping * dt;
          g.vy += (g.hy - g.y) * spring * dt - g.vy * damping * dt;
          g.vx = clamp(g.vx, -1.6, 1.6);
          g.vy = clamp(g.vy, -1.6, 1.6);
          g.x += g.vx * dt;
          g.y += g.vy * dt;

          if (Math.abs(g.vx) < 0.00002 && Math.abs(g.hx - g.x) < 0.00002) {
            g.vx = 0;
            g.x = g.hx;
          }
          if (Math.abs(g.vy) < 0.00002 && Math.abs(g.hy - g.y) < 0.00002) {
            g.vy = 0;
            g.y = g.hy;
          }
        }

        const speed = Math.hypot(g.vx, g.vy);
        const excite = clamp(speed * 3, 0, 1);
        ctx.save();
        ctx.translate(g.x * size.w, g.y * size.h);
        ctx.rotate(g.rot + g.vx * 1.4);
        ctx.scale(g.scale, g.scale);
        ctx.translate(-13, -13);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = g.color;
        ctx.globalAlpha = 0.1 + excite * 0.3;
        ctx.lineWidth = 5;
        ctx.stroke(g.path);
        ctx.globalAlpha = 0.55 + excite * 0.45;
        ctx.lineWidth = 1.6;
        ctx.stroke(g.path);
        ctx.restore();
      }

      if (running && p.inside) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = mode === 'repel' ? NOX_COLORS.red : NOX_COLORS.gold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, safeRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
    running,
    safeDpr,
  );

  return (
    <div
      ref={rootRef}
      data-running={running ? 'true' : 'false'}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 0%, #101014 0%, ${NOX_COLORS.bg} 62%)`,
        touchAction: 'pan-y',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.42em', color: NOX_COLORS.textDim }}>
            EMITTER FIELD // {mode === 'repel' ? 'EVADE' : 'CONVERGE'}
          </div>
          <div style={{ fontSize: 'clamp(24px, 5.5cqw, 50px)', fontWeight: 810, letterSpacing: '-0.02em', color: NOX_COLORS.text, opacity: 0.92 }}>
            SYMBOL DRIFT
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveSymbolDrift;
