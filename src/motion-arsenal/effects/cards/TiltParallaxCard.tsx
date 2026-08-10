import { useRef, type CSSProperties } from 'react';
import { clamp, damp, lerp, useInView, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { useTouchMode } from './cardDemoUtils';

// ---------------------------------------------------------------------------
// TiltParallaxCard — 3D tilt with INNER parallax planes.
// Pointer devices get damped tilt + an underdamped settle. Touch and reduced
// motion stay static: no decorative perpetual rAF loop. The animation also
// pauses completely while the preview is outside the viewport.
// ---------------------------------------------------------------------------

export interface TiltParallaxCardProps {
  maxTilt?: number; // deg
  depth?: number; // 0..2 parallax plane spacing multiplier
  glare?: number; // 0..1 glare sweep intensity
  overshoot?: number; // 0..1 how elastic the settle is
}

export function TiltParallaxCard({
  maxTilt = 14,
  depth = 1,
  glare = 0.6,
  overshoot = 0.7,
}: TiltParallaxCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const touch = useTouchMode();
  const inView = useInView(rootRef);

  const tilt = clamp(maxTilt, 0, 24);
  const depthScale = clamp(depth, 0, 2);
  const glareStrength = clamp(glare, 0, 1);
  const springiness = clamp(overshoot, 0, 1);
  const anim = useRef({ rx: 0, ry: 0, vx: 0, vy: 0 });

  useRafLoop(
    (rawDt) => {
      const el = cardRef.current;
      if (!el) return;

      // Prevent giant spring jumps after tab throttling / debugger pauses.
      const dt = Math.min(Math.max(rawDt, 0), 1 / 20);
      const p = pointer.current;
      const s = anim.current;

      if (p.inside) {
        const trx = -(p.ty - 0.5) * 2 * tilt;
        const try_ = (p.tx - 0.5) * 2 * tilt;
        const nrx = damp(s.rx, trx, 12, dt);
        const nry = damp(s.ry, try_, 12, dt);
        s.vx = (nrx - s.rx) / Math.max(dt, 1e-4);
        s.vy = (nry - s.ry) / Math.max(dt, 1e-4);
        s.rx = nrx;
        s.ry = nry;
      } else {
        // KRANK-style overshoot settle: underdamped spring toward flat.
        const k = 90;
        const c = lerp(15, 4.5, springiness);
        s.vx += (-k * s.rx - c * s.vx) * dt;
        s.vy += (-k * s.ry - c * s.vy) * dt;
        s.rx += s.vx * dt;
        s.ry += s.vy * dt;

        // Snap microscopic residual motion to zero so styles stop changing.
        if (Math.abs(s.rx) < 0.002 && Math.abs(s.ry) < 0.002 && Math.abs(s.vx) < 0.01 && Math.abs(s.vy) < 0.01) {
          s.rx = 0;
          s.ry = 0;
          s.vx = 0;
          s.vy = 0;
        }
      }

      el.style.setProperty('--tp-rx', s.rx.toFixed(3));
      el.style.setProperty('--tp-ry', s.ry.toFixed(3));
    },
    inView && !reduced && !touch,
  );

  const cardVars = { '--tp-rx': '0', '--tp-ry': '0' } as CSSProperties;
  const z = (v: number) => `${(v * depthScale).toFixed(1)}px`;
  const plane = (zv: number, driftMul: number): CSSProperties => ({
    transform: `translateZ(${z(zv)}) translate(calc(var(--tp-ry) * ${driftMul}px), calc(var(--tp-rx) * ${-driftMul}px))`,
  });

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(120% 100% at 50% 118%, #140f11 0%, #0a0a0b 60%)',
        display: 'grid',
        placeItems: 'center',
        perspective: 900,
      }}
    >
      <div
        ref={cardRef}
        style={{
          ...cardVars,
          position: 'relative',
          width: 'min(340px, 78%)',
          aspectRatio: '1.55',
          maxHeight: '80%',
          borderRadius: 16,
          transform: 'rotateX(calc(var(--tp-rx) * 1deg)) rotateY(calc(var(--tp-ry) * 1deg))',
          transformStyle: 'preserve-3d',
          background: `linear-gradient(158deg, #1b1a1f 0%, ${NOX_COLORS.bgPanel} 52%, #0c0c0f 100%)`,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 26px 60px rgba(0,0,0,0.6)',
          willChange: inView && !reduced && !touch ? 'transform' : 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '12%',
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${NOX_COLORS.red}55 0%, transparent 72%)`,
            filter: 'blur(18px)',
            ...plane(12, -0.5),
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            overflow: 'hidden',
            pointerEvents: 'none',
            transform: 'translateZ(2px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(105deg, transparent 34%, rgba(255,255,255,${(0.32 * glareStrength).toFixed(3)}) 47%, rgba(255,255,255,${(0.06 * glareStrength).toFixed(3)}) 52%, transparent 64%)`,
              backgroundSize: '240% 100%',
              backgroundPositionX: 'calc(50% + var(--tp-ry) * 3.2%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '8% 9%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            color: NOX_COLORS.text,
            ...plane(25, 0.35),
          }}
        >
          <div style={{ fontSize: 'clamp(16px, 3.4vw, 24px)', fontWeight: 750, letterSpacing: '0.03em' }}>
            RANK CORE
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.3em', color: NOX_COLORS.textDim, marginTop: 4 }}>
            PARALLAX PLANES Z12–Z70
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '9%',
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            fontSize: 'clamp(30px, 6.5vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: NOX_COLORS.text,
            textShadow: `0 0 24px ${NOX_COLORS.red}66`,
            ...plane(45, 0.6),
          }}
        >
          07
        </div>

        <div
          style={{
            position: 'absolute',
            top: '11%',
            left: '9%',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${NOX_COLORS.red}88`,
            background: 'rgba(20,10,10,0.55)',
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            fontSize: 8,
            letterSpacing: '0.28em',
            color: NOX_COLORS.text,
            boxShadow: `0 6px 18px rgba(0,0,0,0.5), 0 0 12px ${NOX_COLORS.red}44`,
            ...plane(70, 0.85),
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: NOX_COLORS.gold,
              boxShadow: `0 0 8px ${NOX_COLORS.gold}`,
            }}
          />
          NOX FORGE
        </div>
      </div>
    </div>
  );
}

export default TiltParallaxCard;
