import { useMemo, useRef } from 'react';
import { clamp, damp, useInView, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// CursorLightField — Active-Theory additive-blend mechanic in Canvas2D.
// Three damped followers trail the pointer at different speeds. The expensive
// radial gradients are pre-rendered once into sprites instead of allocated on
// every frame, and the canvas loop pauses while the effect is offscreen.
// ---------------------------------------------------------------------------

export interface CursorLightFieldProps {
  lightRadius?: number; // px radius of the main light blob
  intensity?: number; // 0.3..1.5 light strength
  trailDecay?: number; // 0.05..0.5 — higher = shorter trail
  palette?: 'nox' | 'ember' | 'mono';
  dprCap?: number; // 1..2 render-density budget
}

const PALETTES: Record<string, [string, string, string]> = {
  nox: ['201, 48, 48', '212, 162, 74', '240, 236, 228'],
  ember: ['255, 90, 46', '255, 179, 71', '201, 48, 48'],
  mono: ['240, 236, 228', '138, 135, 129', '240, 236, 228'],
};

const LAMBDAS = [8, 5, 3];
const WORDS = ['FORGE', 'RANK', 'SCAN', 'SIGNAL', 'SYSTEM', 'NODE', 'VOID', 'PULSE'];

function makeGlowSprite(rgb: string, alpha: number) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const r = canvas.width / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  grad.addColorStop(0.45, `rgba(${rgb}, ${alpha * 0.4})`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export function CursorLightField({
  lightRadius = 130,
  intensity = 1,
  trailDecay = 0.16,
  palette = 'nox',
  dprCap = 1.5,
}: CursorLightFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);
  const hoverCapable = useHoverCapable();
  const followers = useRef([
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ]);
  const primed = useRef(false);

  const safeRadius = clamp(Number.isFinite(lightRadius) ? lightRadius : 130, 40, 320);
  const safeIntensity = clamp(Number.isFinite(intensity) ? intensity : 1, 0.1, 2);
  const safeDecay = clamp(Number.isFinite(trailDecay) ? trailDecay : 0.16, 0.03, 0.6);
  const safeDpr = clamp(Number.isFinite(dprCap) ? dprCap : 1.5, 1, 2);
  const colors = PALETTES[palette] ?? PALETTES.nox;
  const running = inView && !reduced;

  const glowSprites = useMemo(
    () => [
      makeGlowSprite(colors[0], 0.5 * safeIntensity),
      makeGlowSprite(colors[1], 0.34 * safeIntensity),
      makeGlowSprite(colors[2], 0.26 * safeIntensity),
    ],
    [colors, safeIntensity],
  );
  const coreSprite = useMemo(() => makeGlowSprite('255, 245, 230', 0.55 * safeIntensity), [safeIntensity]);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const p = pointer.current;
      if (running && !hoverCapable) driftPointer(p, elapsed);

      if (!primed.current || reduced) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#0b0b0d';
        ctx.fillRect(0, 0, size.w, size.h);
        primed.current = true;
      } else if (running) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(11, 11, 13, ${safeDecay})`;
        ctx.fillRect(0, 0, size.w, size.h);
      }

      for (let i = 0; i < followers.current.length; i++) {
        const f = followers.current[i];
        if (reduced) {
          f.x = 0.5;
          f.y = 0.5;
        } else if (running) {
          f.x = damp(f.x, p.tx, LAMBDAS[i], dt);
          f.y = damp(f.y, p.ty, LAMBDAS[i], dt);
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      const radii = [1, 0.72, 0.5];
      for (let i = 0; i < followers.current.length; i++) {
        const f = followers.current[i];
        const x = f.x * size.w;
        const y = f.y * size.h;
        const r = Math.max(24, safeRadius * radii[i]);
        const sprite = glowSprites[i];
        if (sprite) ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
      }

      const lead = followers.current[0];
      if (coreSprite) {
        const coreR = Math.max(14, Math.min(24, safeRadius * 0.16));
        ctx.drawImage(coreSprite, lead.x * size.w - coreR, lead.y * size.h - coreR, coreR * 2, coreR * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
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
        background: NOX_COLORS.bg,
        isolation: 'isolate',
        touchAction: 'pan-y',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, auto)',
            gap: 'clamp(10px, 3cqw, 34px)',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 'clamp(10px, 1.6cqw, 14px)',
            letterSpacing: '0.32em',
            color: NOX_COLORS.text,
          }}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} style={{ opacity: 0.9 }}>
              {WORDS[i % WORDS.length]}
            </span>
          ))}
        </div>
        <div
          style={{
            fontSize: 'clamp(26px, 6cqw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: NOX_COLORS.text,
            marginTop: 6,
          }}
        >
          LIGHT FIELD
        </div>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.text, opacity: 0.75 }}>
          ADDITIVE // ONE + ONE
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', pointerEvents: 'none' }}
      />
    </div>
  );
}

export default CursorLightField;
