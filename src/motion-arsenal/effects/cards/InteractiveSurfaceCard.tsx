import { useRef, type CSSProperties } from 'react';
import { damp, lerp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { useTouchMode } from './cardDemoUtils';

// ---------------------------------------------------------------------------
// TiltParallaxCard — 3D tilt with INNER parallax planes.
// Follow phase: damped tilt (Lusion damp, lambda = 12) toward the pointer.
// Inside the card, badge / number / typo / glow float on translateZ steps so
// perspective produces real parallax between planes. A glare sweep slides
// with the tilt angle. On pointer leave the card settles via an UNDERDAMPED
// spring — the KRANK overshoot (cubic-bezier(.3,0,.66,-.3)) as physics, not
// as CSS: it swings past flat and elastically bounces back.
// ---------------------------------------------------------------------------

export interface InteractiveSurfaceCardProps {
  maxTilt?: number; // deg
  depth?: number; // 0..2 parallax plane spacing multiplier
  glare?: number; // 0..1 glare sweep intensity
  overshoot?: number; // 0..1 how elastic the settle is
  /** Refraction module (absorbed from HoverLightRefraction). */
  refraction?: boolean;
  /** Chromatic fringe strength of the refraction module. */
  chroma?: number; // 0..2
  /** Border-trace module (absorbed from BorderTraceDepth). */
  borderTrace?: boolean;
  /** Trace + glow accent of the border-trace module. */
  accent?: string;
  /** Trace revolutions per second. */
  traceSpeed?: number;
}

/** Canonical interactive card-surface core; legacy card variants delegate here. */
export function InteractiveSurfaceCard({
  maxTilt = 14,
  depth = 1,
  glare = 0.6,
  overshoot = 0.7,
  refraction = true,
  chroma = 1,
  borderTrace = true,
  accent = NOX_COLORS.gold,
  traceSpeed = 1,
}: InteractiveSurfaceCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const touch = useTouchMode();

  // px/py track the raw pointer for the refraction highlight, vel is the
  // pointer speed the chromatic fringe scales with (Active-Theory velocity
  // thinking), trace is the border-trace angle advanced per frame.
  const anim = useRef({ rx: 0, ry: 0, vx: 0, vy: 0, px: 0.5, py: 0.5, vel: 0, trace: 0 });

  useRafLoop(
    (dt, t) => {
      const el = cardRef.current;
      if (!el) return;
      const p = pointer.current;
      const s = anim.current;
      const following = touch || p.inside;
      if (following) {
        let trx: number;
        let try_: number;
        if (touch) {
          trx = Math.sin(t * 0.75) * maxTilt * 0.7;
          try_ = Math.cos(t * 0.55) * maxTilt * 0.7;
        } else {
          trx = -(p.ty - 0.5) * 2 * maxTilt;
          try_ = (p.tx - 0.5) * 2 * maxTilt;
        }
        // damp lambda = 12 — track velocity so the spring handoff is seamless.
        const nrx = damp(s.rx, trx, 12, dt);
        const nry = damp(s.ry, try_, 12, dt);
        s.vx = (nrx - s.rx) / Math.max(dt, 1e-4);
        s.vy = (nry - s.ry) / Math.max(dt, 1e-4);
        s.rx = nrx;
        s.ry = nry;
      } else {
        // KRANK-style overshoot settle: underdamped spring toward flat.
        const k = 90;
        const c = lerp(15, 4.5, overshoot);
        s.vx += (-k * s.rx - c * s.vx) * dt;
        s.vy += (-k * s.ry - c * s.vy) * dt;
        s.rx += s.vx * dt;
        s.ry += s.vy * dt;
      }
      el.style.setProperty('--tp-rx', s.rx.toFixed(3));
      el.style.setProperty('--tp-ry', s.ry.toFixed(3));

      if (refraction) {
        // Touch mode has no pointer, so the highlight rides the auto-tilt.
        const targetX = touch ? 0.5 + Math.sin(t * 0.75) * 0.28 : p.inside ? p.tx : 0.5;
        const targetY = touch ? 0.5 + Math.cos(t * 0.55) * 0.28 : p.inside ? p.ty : 0.5;
        const nx = damp(s.px, targetX, 14, dt);
        const ny = damp(s.py, targetY, 14, dt);
        const speed = Math.hypot(nx - s.px, ny - s.py) / Math.max(dt, 1e-4);
        s.px = nx;
        s.py = ny;
        s.vel = damp(s.vel, Math.min(speed, 6), 6, dt);
        el.style.setProperty('--tp-px', `${(nx * 100).toFixed(2)}%`);
        el.style.setProperty('--tp-py', `${(ny * 100).toFixed(2)}%`);
        el.style.setProperty('--tp-fringe', (Math.min(s.vel / 6, 1) * chroma).toFixed(3));
      }

      if (borderTrace) {
        s.trace = (s.trace + dt * 360 * 0.28 * traceSpeed) % 360;
        el.style.setProperty('--tp-trace', `${s.trace.toFixed(1)}deg`);
      }
    },
    !reduced,
  );

  const cardVars = {
    '--tp-rx': '0',
    '--tp-ry': '0',
    '--tp-px': '50%',
    '--tp-py': '50%',
    '--tp-fringe': '0',
    '--tp-trace': '0deg',
  } as CSSProperties;
  const z = (v: number) => `${(v * depth).toFixed(1)}px`;
  // Inner planes drift slightly opposite to tilt on top of translateZ.
  const plane = (zv: number, driftMul: number): CSSProperties => ({
    transform: `translateZ(${z(zv)}) translate(calc(var(--tp-ry) * ${driftMul}px), calc(var(--tp-rx) * ${-driftMul}px))`,
    willChange: 'transform',
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
          width: 'min(340px, 74%)',
          aspectRatio: '1.55',
          maxHeight: '80%',
          borderRadius: 16,
          transform: 'rotateX(calc(var(--tp-rx) * 1deg)) rotateY(calc(var(--tp-ry) * 1deg))',
          transformStyle: 'preserve-3d',
          background: `linear-gradient(158deg, #1b1a1f 0%, ${NOX_COLORS.bgPanel} 52%, #0c0c0f 100%)`,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 26px 60px rgba(0,0,0,0.6)',
          willChange: 'transform',
        }}
      >
        {/* Deep glow plane (lowest z) */}
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
        {/* Glare sweep tied to the tilt angle */}
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
              backgroundImage: `linear-gradient(105deg, transparent 34%, rgba(255,255,255,${(0.32 * glare).toFixed(3)}) 47%, rgba(255,255,255,${(0.06 * glare).toFixed(3)}) 52%, transparent 64%)`,
              backgroundSize: '240% 100%',
              backgroundPositionX: 'calc(50% + var(--tp-ry) * 3.2%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
        {/* Refraction module — absorbed from HoverLightRefraction. The specular
            highlight moves counter to the pointer and a red/cyan fringe grows
            with pointer velocity. */}
        {refraction && (
          <div
            data-module="refraction"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              overflow: 'hidden',
              pointerEvents: 'none',
              transform: 'translateZ(3px)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-20%',
                background:
                  'radial-gradient(circle at calc(100% - var(--tp-px)) calc(100% - var(--tp-py)), rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 26%, transparent 58%)',
                mixBlendMode: 'screen',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                opacity: 'var(--tp-fringe)',
                boxShadow:
                  'inset 3px 0 10px rgba(255,60,60,0.55), inset -3px 0 10px rgba(60,220,255,0.55)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        )}
        {/* Border-trace module — absorbed from BorderTraceDepth: a conic edge
            light plus an offset blurred copy that reads as depth. */}
        {borderTrace && (
          <>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: -2,
                borderRadius: 18,
                padding: 2,
                background: `conic-gradient(from var(--tp-trace), transparent 0deg, ${accent} 26deg, transparent 74deg)`,
                filter: 'blur(9px)',
                opacity: 0.5,
                transform: 'translateZ(0px)',
                pointerEvents: 'none',
              }}
            />
            <div
              data-module="border-trace"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                padding: 1,
                background: `conic-gradient(from var(--tp-trace), transparent 0deg, ${accent} 22deg, transparent 66deg)`,
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                maskComposite: 'exclude',
                transform: 'translateZ(4px)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
        {/* Typo plane */}
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
        {/* Big number plane */}
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
        {/* Badge plane (highest z) */}
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

export default InteractiveSurfaceCard;
